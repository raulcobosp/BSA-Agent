import { GoogleGenAI, Schema, Type, Tool } from "@google/genai";
import { ProposalRequest, ResearchResult, SolutionDesign, ProposalImages, AgentLog, ChatMessage, BusinessAnalysis, ContextDensity, ExpandConfig, MetacognitionAnalysis } from "../types";
import { AI_MODELS, GEN_CONFIG } from "../config/models";
import { ResearcherPrompts } from "../prompts/researcher";
import { ArchitectPrompts } from "../prompts/architect";
import { WriterPrompts } from "../prompts/writer";
import { VisualizerPrompts } from "../prompts/visualizer";
import { AuditorPrompts } from "../prompts/auditor";
import { ExpertPrompts } from "../prompts/expert";
import { EstimatorPrompts } from "../prompts/estimator";
import { CostEstimation, ValidationResult } from "../types";
import { ValidatorPrompts } from "../prompts/validator";
import { fetchCompanyLogo, compositeLogosOnCover } from "../utils/logoUtils";
import { MetacognitionPrompts } from "../prompts/metacognition";

/**
 * =================================================================================
 * NUBIRAL BSA AGENT PIPELINE & CONTEXT FLOW DOCUMENTATION
 * =================================================================================
 * 
 * 1. KYC RESEARCHER AGENT (conductResearch)
 *    - Input: Company Name (String)
 *    - Context: Google Search Grounding (Live Web Data)
 *    - Output: `ResearchResult` (JSON) containing structured analysis (SWOT, Competitors).
 *    - Flow: This JSON acts as the "Truth Source" for all subsequent agents.
 * 
 * 2. BUSINESS ANALYST AGENT (analyzeBusinessCase)
 *    - Input: Raw Business Case (String)
 *    - Output: `BusinessAnalysis` (JSON) containing ROI, Pain Points, User Stories.
 * 
 * 3. ARCHITECT AGENT (designSolution)
 *    - Input: `ProposalRequest` + `ResearchResult` (JSON) + `BusinessAnalysis` (JSON)
 *    - Context: FILTERED based on `ContextDensity`.
 *    - Output: `SolutionDesign` (JSON) containing Architecture decisions & Mermaid Code.
 * 
 * 4. PROPOSAL WRITER AGENT (generateProposal)
 *    - Input: All previous artifacts (`ResearchResult`, `BusinessAnalysis`, `SolutionDesign`)
 *    - Configuration: maxOutputTokens set to 65536 to prevent "lazy" endings.
 *    - Output: Full Markdown Document.
 * 
 * 5. AUDITOR AGENT (evaluateProposal)
 *    - Input: The generated Markdown from Step 4.
 *    - Output: SMART Score (0-100) & Critical Feedback Loop.
 * 
 * =================================================================================
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Rate Limiting Control ---
let _executionDelay = 0;

export const setExecutionDelay = (seconds: number) => {
  _executionDelay = seconds;
};
// -----------------------------

type LogFn = (message: string) => void;

// Helper to extract JSON from markdown code blocks or raw text
// Improved: Handles cases where model adds extra text after JSON
const cleanJson = (text: string): string => {
  if (!text) return "{}";

  // Try markdown code block first
  const match = text.match(/```json([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }

  // Try to find JSON object by matching { to }
  const jsonStart = text.indexOf('{');
  if (jsonStart !== -1) {
    let braceCount = 0;
    let jsonEnd = -1;

    for (let i = jsonStart; i < text.length; i++) {
      if (text[i] === '{') braceCount++;
      if (text[i] === '}') braceCount--;
      if (braceCount === 0) {
        jsonEnd = i;
        break;
      }
    }

    if (jsonEnd !== -1) {
      return text.substring(jsonStart, jsonEnd + 1);
    }
  }

  // Fallback: remove markdown wrappers
  return text.replace(/```/g, '').trim();
};


// Helper to clean Markdown that might be wrapped in code blocks
export const cleanMarkdown = (text: string) => {
  if (!text) return "";
  // Remove wrapping ```markdown ... ``` or just ``` ... ```
  const match = text.match(/^```(?:markdown)?\s*([\s\S]*?)\s*```$/);
  if (match) {
    return match[1].trim();
  }
  return text;
};

// Helper to strip base64 images from markdown for evaluation to save tokens
const stripImagesForContext = (markdown: string) => {
  // Replace ![Alt](data:image/...) with ![Alt](...image placeholder...)
  // Matches standard markdown image syntax with data URI
  return markdown.replace(/!\[([^\]]*)\]\(data:image\/[^;]+;base64,[^\)]+\)/g, '![$1]([Image Data Omitted for Context Window])');
};

/**
 * Context Filter Logic - Simulates Human Information Hand-off
 */
const applyContextFilter = (
  research: ResearchResult,
  business: BusinessAnalysis,
  density: ContextDensity
): string => {

  // LOW DENSITY: Executive Summary Only (High Level)
  if (density === 'low') {
    return JSON.stringify({
      client_summary: research.summary,
      strategic_goals: research.strategicGoals.slice(0, 3), // Top 3 goals only
      core_problem: business.problemStatement,
      expected_roi: business.expectedBusinessValue.roi,
      key_constraints: research.detailedAnalysis.regulatoryConstraints
    }, null, 2);
  }

  // MEDIUM DENSITY: Tactical Summary (Managerial Level)
  if (density === 'medium') {
    return JSON.stringify({
      client_summary: research.summary,
      strategic_goals: research.strategicGoals,
      industry_context: research.detailedAnalysis.industryLandscape.substring(0, 300) + "...",
      top_risks: research.detailedAnalysis.challengesAndRisks.slice(0, 5),
      problem_statement: business.problemStatement,
      root_causes: business.rootCauseAnalysis,
      roi_analysis: business.expectedBusinessValue,
      key_pain_points: business.keyPainPoints,
      hyperscaler_affinity: research.detailedAnalysis.hyperscalerAffinity
    }, null, 2);
  }

  // HIGH DENSITY: Full Operational Dump (Raw Data)
  return JSON.stringify({
    research_full: research,
    business_analysis_full: business
  }, null, 2);
};


/**
 * Helper function to retry API calls on failure
 */
async function generateWithRetry(model: string, params: any, retries = 2, onLog?: LogFn) {
  for (let i = 0; i <= retries; i++) {
    try {
      // --- Apply System Delay ---
      if (_executionDelay > 0) {
        if (onLog && i === 0) onLog(`System pause: ${_executionDelay}s (Rate Limit Control)...`);
        await new Promise(resolve => setTimeout(resolve, _executionDelay * 1000));
      }
      // --------------------------

      if (onLog && i > 0) onLog(`Retry attempt ${i}/${retries} for model ${model}...`);

      // Merge config to ensure maxOutputTokens is applied if not present
      const finalParams = {
        ...params,
        config: {
          ...GEN_CONFIG.HIGH_OUTPUT, // Default to High Output Limit
          ...params.config
        }
      };

      return await ai.models.generateContent({
        model,
        ...finalParams
      });
    } catch (error) {
      console.warn(`[Gemini Service] Attempt ${i + 1} failed for model ${model}:`, error);
      if (onLog) onLog(`Warning: API call failed (Attempt ${i + 1}). Retrying...`);
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

/**
 * Step 1: Research the Company (KYC) - ReAct Pattern (Reason + Act + Validate)
 */
export const conductResearch = async (companyName: string, language: string, onLog?: LogFn): Promise<ResearchResult> => {
  const model = AI_MODELS.REASONING.FLASH;

  // --- REASONING STEP ---
  if (onLog) onLog(`[ReAct Researcher] Reasoning: Formulating search strategy for "${companyName}"...`);

  const basePrompt = ResearcherPrompts.conductResearch(companyName, language);

  // --- ACTION STEP 1: Initial Research ---
  if (onLog) onLog(`[ReAct Researcher] Action: Executing primary deep-dive search...`);

  let response;
  try {
    response = await generateWithRetry(model, {
      contents: basePrompt,
      config: {
        tools: [{ googleSearch: {} }],
        ...GEN_CONFIG.JSON_MODE
      }
    }, 2, onLog);
  } catch (e) {
    if (onLog) onLog(`[ReAct Researcher] Error: Primary search failed. Using fallback.`);
    return createFallbackResearch(companyName);
  }

  const text = response.text || "{}";
  let data;
  try {
    data = JSON.parse(cleanJson(text));
  } catch (e) {
    if (onLog) onLog(`Warning: JSON parse failed. Attempting fallback...`);
    data = {};
  }

  // --- OBSERVATION & SELF-CORRECTION LOOP ---
  // Check if data is sparse (e.g., missing challenges or competitors)
  const analysis = data.detailedAnalysis || {};
  const missingChallenges = !analysis.challengesAndRisks || analysis.challengesAndRisks.length === 0;
  const missingCompetitors = !analysis.competitors || (!analysis.competitors.global?.length && !analysis.competitors.local?.length);

  if (missingChallenges || missingCompetitors) {
    const missingField = missingChallenges ? "Challenges & Risks" : "Competitors";
    if (onLog) onLog(`[ReAct Researcher] Observation: Data is sparse for '${missingField}'. Triggering Agentic Repair...`);

    try {
      const repairPrompt = ResearcherPrompts.repairResearch(companyName, missingField, JSON.stringify(data), language);

      // Action: Targeted Search
      if (onLog) onLog(`[ReAct Researcher] Action: Executing targeted repair search...`);
      const retryResponse = await generateWithRetry(model, {
        contents: repairPrompt,
        config: {
          tools: [{ googleSearch: {} }], // Enable tools for the repair
          ...GEN_CONFIG.JSON_MODE
        }
      }, 1, onLog);

      const repairedData = JSON.parse(cleanJson(retryResponse.text || "{}"));

      // Synthesis: Merge
      data = { ...data, ...repairedData };
      if (onLog) onLog("[ReAct Researcher] Success: Data repaired and synthesized.");
    } catch (e) {
      console.warn("Supplementation failed", e);
      if (onLog) onLog("[ReAct Researcher] Repair failed. Proceeding with available data.");
    }
  }

  // Process Sources
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.uri && web.title)
    .map((web: any) => ({ title: web.title, uri: web.uri })) || [];

  const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values()) as { title: string; uri: string }[];

  return {
    summary: data.summary || `Information about ${companyName}`,
    strategicGoals: data.strategicGoals || [],
    detailedAnalysis: data.detailedAnalysis || {
      industryLandscape: "Data unavailable",
      challengesAndRisks: [],
      regulatoryConstraints: [],
      keyStakeholders: [],
      hyperscalerAffinity: "Unknown",
      businessMaturity: "Unknown",
      eaMaturity: "Unknown",
      genAiMaturity: "Unknown",
      competitors: { global: [], local: [] },
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] }
    },
    sources: uniqueSources,
    expandedContent: {}
  };
};

// Helper for fallback research
const createFallbackResearch = (companyName: string): ResearchResult => ({
  summary: `Could not retrieve real-time data for ${companyName}.`,
  strategicGoals: ["Digital Transformation", "Operational Efficiency"],
  detailedAnalysis: {
    industryLandscape: "General Industry",
    challengesAndRisks: ["Legacy Systems", "Cost of Inaction: High operational costs"],
    regulatoryConstraints: [],
    keyStakeholders: ["CIO", "CTO"],
    hyperscalerAffinity: "Unknown",
    businessMaturity: "Average",
    eaMaturity: "Low AI Adoption",
    genAiMaturity: "Low",
    competitors: { global: [], local: [] },
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  },
  sources: [],
  expandedContent: {}
});

/**
 * Step 1.2: Pre-Design Cloud Service Grounding (Architect Agent)
 */
export const researchArchitectServices = async (request: ProposalRequest, businessCase: string, onLog?: LogFn): Promise<string> => {
  const model = AI_MODELS.REASONING.FLASH;
  if (onLog) onLog(`[Grounding Architect] Researching optimal ${request.hyperScaler} services...`);

  const prompt = ArchitectPrompts.researchServices(request, businessCase);

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    }, 1, onLog);

    return response.text || "No services identified.";
  } catch (e) {
    if (onLog) onLog(`Grounding failed: ${e}`);
    return "Standard cloud services will be used.";
  }
};


/**
 * NEW: Business Case Analysis Agent
 */
export const analyzeBusinessCase = async (
  companyName: string,
  businessCase: string,
  language: string,
  onLog?: LogFn
): Promise<BusinessAnalysis> => {
  const model = AI_MODELS.REASONING.FLASH;
  if (onLog) onLog(`[Business Analyst] Deconstructing business case and identifying ROI opportunities...`);

  const prompt = WriterPrompts.analyzeBusinessCase(companyName, businessCase, language);

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: { ...GEN_CONFIG.JSON_MODE }
    }, 1, onLog);

    const data = JSON.parse(cleanJson(response.text || "{}"));
    return { ...data, expandedContent: {} };
  } catch (e) {
    if (onLog) onLog(`Business Analysis failed: ${e}`);
    return {
      problemStatement: businessCase,
      rootCauseAnalysis: [],
      currentProcessFlaws: [],
      expectedBusinessValue: { roi: "Unknown", efficiencyGains: "Unknown", otherBenefits: [] },
      keyPainPoints: [],
      userStories: [],
      mermaidDiagram: "",
      expandedContent: {}
    };
  }
};

/**
 * NEW FEATURE: Expand specific BUSINESS CASE section with AI
 */
export const expandBusinessSection = async (
  sectionName: string,
  currentAnalysis: BusinessAnalysis,
  language: string,
  config?: ExpandConfig,
  onLog?: LogFn
): Promise<string> => {
  const model = AI_MODELS.REASONING.FLASH;
  if (onLog) onLog(`Expanding business section: ${sectionName}...`);

  // Re-using ResearcherPrompts.expandSection is okay, or we can add a specific one to WriterPrompts
  // Let's use ResearcherPrompts since it's a "Deep Dive" search/expand task
  const prompt = ResearcherPrompts.expandSection(
    "Client Business Case", // Generic Company Name context for this specific task
    sectionName,
    JSON.stringify(currentAnalysis),
    language,
    config
  );

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] } // Business analysis expansion benefits from grounding too
    }, 1, onLog);

    return cleanMarkdown(response.text || "Expansion failed.");
  } catch (e) {
    if (onLog) onLog(`Expansion error: ${e}`);
    return "Could not expand section due to an error.";
  }
};


/**
 * NEW FEATURE: Expand specific KYC section with AI Deep Dive
 */
export const expandResearchSection = async (
  companyName: string,
  sectionName: string,
  currentContext: any,
  language: string,
  config?: ExpandConfig,
  onLog?: LogFn
): Promise<string> => {
  const model = AI_MODELS.REASONING.FLASH;
  if (onLog) onLog(`Expanding section: ${sectionName} using Google Search (Language: ${language})...`);

  const prompt = ResearcherPrompts.expandSection(companyName, sectionName, JSON.stringify(currentContext), language, config);

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    }, 1, onLog);

    return cleanMarkdown(response.text || "Expansion failed.");
  } catch (e) {
    if (onLog) onLog(`Expansion error: ${e}`);
    return "Could not expand section due to an error.";
  }
};

/**
 * NEW FEATURE: Expand specific PROPOSAL section with AI
 */
export const expandProposalSection = async (
  sectionName: string,
  currentProposal: string,
  businessCase: string,
  language: string,
  config?: ExpandConfig,
  onLog?: LogFn
): Promise<string> => {
  const model = AI_MODELS.REASONING.FLASH;
  if (onLog) onLog(`Expanding proposal section: ${sectionName}...`);

  const prompt = WriterPrompts.expandSection(sectionName, currentProposal, businessCase, language, config);

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
    }, 1, onLog);

    return cleanMarkdown(response.text || "Expansion failed.");
  } catch (e) {
    if (onLog) onLog(`Expansion error: ${e}`);
    return "Could not expand section due to an error.";
  }
};

/**
 * Single Image Generation Helper (Core utility for all infographics)
 */
const generateImageFromPrompt = async (
  prompt: string,
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn,
  logPrefix: string = "image"
): Promise<string | undefined> => {
  try {
    if (onLog) onLog(`[Visualizer] Generating ${logPrefix}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],  // CRITICAL: Required for Gemini 3 image models
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const cleanBase64 = part.inlineData.data.replace(/\s/g, '');
        if (onLog) onLog(`[Visualizer] ${logPrefix} generated successfully.`);
        return `data:${part.inlineData.mimeType};base64,${cleanBase64}`;
      }
    }
    if (onLog) onLog(`[Visualizer] Warning: No image data returned for ${logPrefix}.`);
  } catch (e) {
    console.warn(`Image generation failed for ${logPrefix}:`, e);
    if (onLog) onLog(`[Visualizer] Failed to generate ${logPrefix}.`);
  }
  return undefined;
};

/**
 * Legacy Single Image Generation (Used for regeneration by type)
 */
export const generateSingleImage = async (
  type: 'cover' | 'concept' | 'infographic' | 'business_technical',
  companyName: string,
  contextData: any,
  instruction: string = "",
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  const prompt = VisualizerPrompts.generateImage(type, companyName, contextData, instruction);
  return generateImageFromPrompt(prompt, modelName, onLog, `${type} image`);
};

/**
 * Generate Cover Image WITH Logos Composited
 * - Generates the base visionary cover image
 * - Fetches customer logo from Clearbit
 * - Composites: Customer logo (LEFT) + Nubiral logo (RIGHT)
 */
export const generateCoverWithLogos = async (
  companyName: string,
  contextData: any,
  instruction: string = "",
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  try {
    // Step 1: Generate base cover image
    if (onLog) onLog(`[Visualizer] Generating cover image for ${companyName}...`);
    const baseCover = await generateSingleImage('cover', companyName, contextData, instruction, modelName, onLog);

    if (!baseCover) {
      if (onLog) onLog(`[Visualizer] Warning: Base cover generation failed.`);
      return undefined;
    }

    // Step 2: Fetch customer logo
    if (onLog) onLog(`[Visualizer] Fetching ${companyName} logo...`);
    let customerLogo: string | null = null;
    try {
      customerLogo = await fetchCompanyLogo(companyName);
      if (customerLogo) {
        if (onLog) onLog(`[Visualizer] Customer logo retrieved successfully.`);
      } else {
        if (onLog) onLog(`[Visualizer] Customer logo not found, using text fallback.`);
      }
    } catch (e) {
      if (onLog) onLog(`[Visualizer] Logo fetch failed, using text fallback.`);
    }

    // Step 3: Composite logos onto cover
    if (onLog) onLog(`[Visualizer] Compositing logos onto cover...`);
    const finalCover = await compositeLogosOnCover(baseCover, customerLogo, companyName);

    if (onLog) onLog(`[Visualizer] Cover image with logos generated successfully.`);
    return finalCover;

  } catch (error) {
    console.error('Cover with logos generation error:', error);
    if (onLog) onLog(`[Visualizer] Error generating cover with logos: ${error}`);
    // Fallback to base cover without logos
    return generateSingleImage('cover', companyName, contextData, instruction, modelName, onLog);
  }
};

/**
 * KYC Infographic - Generated immediately after conductResearch
 */
export const generateKYCInfographic = async (
  companyName: string,
  research: ResearchResult,
  language: string = "English",
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  const prompt = VisualizerPrompts.generateKYCInfographic(companyName, research, language);
  return generateImageFromPrompt(prompt, modelName, onLog, "KYC Infographic");
};

/**
 * Business Analysis Infographic - Generated immediately after analyzeBusinessCase
 */
export const generateBusinessInfographic = async (
  analysis: BusinessAnalysis,
  language: string = "English",
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  const prompt = VisualizerPrompts.generateBusinessInfographic(analysis, language);
  return generateImageFromPrompt(prompt, modelName, onLog, "Business Infographic");
};

/**
 * Architecture Infographic - Generated immediately after designSolution
 */
export const generateArchitectureInfographic = async (
  design: SolutionDesign,
  hyperScaler: string,
  language: string = "English",
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  const prompt = VisualizerPrompts.generateArchitectureInfographic(design, hyperScaler, language);
  return generateImageFromPrompt(prompt, modelName, onLog, "Architecture Infographic");
};

/**
 * Cost Estimation Infographic - Generated immediately after generateCostEstimation
 */
export const generateCostInfographic = async (
  estimation: CostEstimation,
  language: string,
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  const prompt = VisualizerPrompts.generateCostInfographic(estimation, language);
  return generateImageFromPrompt(prompt, modelName, onLog, "Cost Infographic");
};

/**
 * Metacognition Analysis Infographic - Generated after analyzeMetacognition
 */
export const generateMetacognitionInfographic = async (
  analysis: MetacognitionAnalysis,
  companyName: string,
  language: string,
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  const prompt = VisualizerPrompts.generateMetacognitionInfographic(analysis, companyName, language);
  return generateImageFromPrompt(prompt, modelName, onLog, "Metacognition Infographic");
};

/**
 * Cover Image - Generated during proposal phase
 */
export const generateCoverImage = async (
  companyName: string,
  summary: string,
  modelName: string = AI_MODELS.VISION.FLASH,
  onLog?: LogFn
): Promise<string | undefined> => {
  const prompt = VisualizerPrompts.generateImage('cover', companyName, { summary }, '');
  return generateImageFromPrompt(prompt, modelName, onLog, "Cover Image");
};

/**
 * NEW FEATURE: Expand specific ARCHITECTURE section with AI
 */
export const expandArchitectureSection = async (
  sectionName: string,
  currentDesign: SolutionDesign,
  language: string,
  config?: ExpandConfig,
  onLog?: LogFn
): Promise<string> => {
  const model = AI_MODELS.REASONING.FLASH;
  if (onLog) onLog(`Expanding architecture section: ${sectionName}...`);

  const prompt = ArchitectPrompts.expandSection(
    sectionName,
    currentDesign,
    language,
    config
  );

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      // Architecture expansion might benefit from search if specific technical details are needed
      config: { tools: [{ googleSearch: {} }] }
    }, 1, onLog);

    return cleanMarkdown(response.text || "Expansion failed.");
  } catch (e) {
    if (onLog) onLog(`Expansion error: ${e}`);
    return "Could not expand section due to an error.";
  }
};

/**
 * Step 2: Design the Solution - ReAct Pattern (Explicit Chain of Thought)
 * UPDATED: Multi-step grounded workflow (Grounding -> Design -> Visual Refinement)
 */
export const designSolution = async (
  request: ProposalRequest,
  research: ResearchResult,
  businessAnalysis: BusinessAnalysis,
  feedback?: string,
  currentDesign?: SolutionDesign,
  onLog?: LogFn,
  density: ContextDensity = 'high'
): Promise<SolutionDesign> => {
  const model = request.textModel || AI_MODELS.REASONING.PRO;

  if (onLog) onLog(`[ReAct Architect] Initiating 3-Stage Design Sequence for ${request.hyperScaler}...`);

  // --- STAGE 1: Pre-Design Grounding (Cloud Service Research) ---
  let groundingData = "No specific grounding data available.";
  if (!feedback) { // Only run grounding on fresh designs, not refinements
    if (onLog) onLog(`[Stage 1/3] Grounding: Researching latest ${request.hyperScaler} services for this case...`);
    try {
      const researchPrompt = ArchitectPrompts.researchServices(request, businessAnalysis.problemStatement);
      const researchResponse = await generateWithRetry(AI_MODELS.REASONING.FLASH, {
        contents: researchPrompt,
        config: { tools: [{ googleSearch: {} }] }
      }, 1, onLog);
      groundingData = researchResponse.text || groundingData;
      if (onLog) onLog(`[Stage 1/3] Grounding Complete.`);
    } catch (e) {
      console.warn("Grounding failed, proceeding with internal knowledge.", e);
      if (onLog) onLog(`[Stage 1/3] Warning: Grounding failed. Using internal knowledge base.`);
    }
  }

  // --- STAGE 2: Core Architecture Design ---
  if (onLog) onLog(`[Stage 2/3] Architecting: Designing solution with context density ${density.toUpperCase()}...`);

  // Apply Context Filtering
  const filteredContext = applyContextFilter(research, businessAnalysis, density);

  let refinedContext = "";
  if (feedback && currentDesign) {
    refinedContext = ArchitectPrompts.getRefinementContext(feedback, currentDesign);
  }

  const prompt = ArchitectPrompts.designSolution(request, filteredContext, groundingData, refinedContext);

  let result: SolutionDesign;

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: {
        ...GEN_CONFIG.JSON_MODE,
        responseSchema: ArchitectPrompts.designSchema,
        // Enable Google Search grounding to verify new/unknown cloud services
        tools: [{ googleSearch: {} }],
      }
    }, 2, onLog);

    const text = response.text || "{}";
    result = JSON.parse(cleanJson(text));

    // Log the reasoning to the user (The 'Thought' part of ReAct)
    // Note: The schema uses snake_case 'thinking_process' but our interface uses camelCase 'thinkingProcess'
    // We map it here to ensure type safety if the model follows schema strictly
    const thinkingProcess = (result as any).thinking_process || result.thinkingProcess;

    if (onLog && thinkingProcess) {
      onLog(`[Stage 2/3] Thought Process:\n${thinkingProcess.substring(0, 150)}...`);
    }

    // Normalize the result to match SolutionDesign interface
    result.thinkingProcess = thinkingProcess;
    if ((result as any).thinking_process) delete (result as any).thinking_process;

  } catch (error) {
    console.error("Design Error:", error);
    if (onLog) onLog(`Error generating design: ${error}`);
    return {
      architectureOverview: "High-Availability Cloud Architecture (Fallback Design)",
      keyComponents: ["Managed Compute Service", "Relational Database Service", "Object Storage", "CDN"],
      rationale: "Standard industry best practices were applied as a fallback due to an error.",
      mermaidCode: "graph TD;\nClient-->LoadBalancer;\nLoadBalancer-->AppServer;\nAppServer-->Database;"
    };
  }

  // --- STAGE 3: Visual Refinement (The "Double-Pass") ---
  // Only refine if we have a valid mermaid code and it's not a fallback
  if (result.mermaidCode && !result.mermaidCode.includes("graph TD;\nClient-->LoadBalancer")) {
    if (onLog) onLog(`[Stage 3/3] Visualization: Refining Diagram for detail and layout...`);
    try {
      const refinePrompt = ArchitectPrompts.refineDiagram(result.mermaidCode, result.architectureOverview, request.hyperScaler);

      // Use a fast model for this pure transformation task
      const refineResponse = await generateWithRetry(AI_MODELS.REASONING.FLASH, {
        contents: refinePrompt,
        config: {
          // No tools needed, just code transformation
        }
      }, 1); // No log function passed here to avoid cluttering unless error

      const refinedCode = cleanMarkdown(refineResponse.text || "");
      if (refinedCode.includes("graph") || refinedCode.includes("flowchart")) {
        result.mermaidCode = refinedCode;
        if (onLog) onLog(`[Stage 3/3] Visualization Enhanced.`);
      }
    } catch (e) {
      console.warn("Diagram refinement failed, keeping original.", e);
      if (onLog) onLog(`[Stage 3/3] Warning: Refinement skipped. Using original diagram.`);
    }
  }

  return result;
};

/**
 * NEW: Logic Validator Agent
 */
export const validateSolutionDesign = async (
  business: BusinessAnalysis,
  design: SolutionDesign,
  onLog?: LogFn
): Promise<ValidationResult> => {
  const model = AI_MODELS.REASONING.FLASH; // Fast validation
  const prompt = ValidatorPrompts.validateDesign(business, design);

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: { ...GEN_CONFIG.JSON_MODE }
    }, 1, onLog);

    const validation = JSON.parse(cleanJson(response.text || "{}"));
    return validation;
  } catch (e) {
    if (onLog) onLog(`Validation failed (Logic Error): ${e}`);
    // Fail safe: Assume valid to prevent blocking pipeline on API error
    return { isValid: true, score: 5, critique: "Validation API failed, skipping check.", missingRequirements: [] };
  }
};

/**
 * Step 3: Generate the Proposal - ReAct Pattern (Strategic Planning)
 */
export const generateProposal = async (
  request: ProposalRequest,
  research: ResearchResult,
  businessAnalysis: BusinessAnalysis,
  design: SolutionDesign,
  images?: ProposalImages,
  feedback?: string,
  previousProposal?: string,
  onLog?: LogFn,
  density: ContextDensity = 'high' // New parameter
): Promise<string> => {
  const primaryModel = request.textModel || AI_MODELS.REASONING.PRO;
  const fallbackModel = AI_MODELS.REASONING.FLASH;

  if (onLog) onLog(`[ReAct Writer] Analyzing Audience and Strategy for ${request.language} proposal (Context: ${density.toUpperCase()})...`);

  // Apply Context Filtering
  const filteredContext = applyContextFilter(research, businessAnalysis, density);

  let refinedContext = "";
  if (feedback && previousProposal) {
    refinedContext = WriterPrompts.getRefinementContext(feedback);
  }

  const prompt = WriterPrompts.generateProposal(request, design, filteredContext, new Date().toLocaleDateString(), refinedContext);

  try {
    const response = await generateWithRetry(primaryModel, {
      contents: prompt,
      config: {
        ...GEN_CONFIG.HIGH_OUTPUT // Force max output tokens for detailed proposal
      }
    }, 1, onLog);
    let md = cleanMarkdown(response.text || "# Error generating proposal");

    if (onLog) onLog(`[ReAct Writer] Text generated. Injecting visual assets...`);

    // Inject Images if available
    if (images) {
      if (images.coverImage) {
        // Insert before the first header
        md = `![Cover Image](${images.coverImage})\n\n` + md;
      }

    }

    return md;
  } catch (primaryError) {
    if (onLog) onLog(`Primary model failed. Switching to fallback (${fallbackModel})...`);
    console.warn("Primary model failed, switching to fallback.");
    try {
      const fallbackResponse = await generateWithRetry(fallbackModel, { contents: prompt }, 1, onLog);
      return cleanMarkdown(fallbackResponse.text || "# Error generating proposal (Fallback)");
    } catch (fallbackError) {
      return "# Error generating proposal";
    }
  }
};

/**
 * Step 4: Evaluate the Proposal (SMART)
 */
export const evaluateProposal = async (proposalMarkdown: string, projectName: string, language: string, onLog?: LogFn): Promise<string> => {
  const model = AI_MODELS.REASONING.FLASH; // Fast model for evaluation

  if (onLog) onLog(`Initializing Auditor Agent (SMART Criteria) in ${language}...`);

  const prompt = AuditorPrompts.evaluateProposal(projectName, language);

  try {
    // Strip base64 images before evaluation to prevent token overflow
    if (onLog) onLog(`Optimizing context window (stripping images)...`);
    const cleanMd = stripImagesForContext(proposalMarkdown);
    if (onLog) onLog(`Sending evaluation request...`);
    const response = await generateWithRetry(model, { contents: [prompt, { text: cleanMd }] }, 2, onLog);
    if (onLog) onLog(`Audit complete.`);
    return cleanMarkdown(response.text || "# Error generating evaluation");
  } catch (e) {
    console.error("Evaluation error", e);
    if (onLog) onLog(`Audit failed: ${e}`);
    return "# Error in Evaluation service";
  }
};

// Helper to parse the score from the markdown table
export const parseEvaluationScore = (markdown: string): number => {
  try {
    const match = markdown.match(/\|\s*\*\*\*Nota:\*\*\*\s*\|\s*(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 0;
  } catch (e) {
    return 0;
  }
};

// Helper to extract critical improvements and check if critical
export const extractImprovements = (markdown: string): { text: string, hasCritical: boolean } => {
  // Split by the last header usually used for improvements
  const parts = markdown.split(/##\s+.*(?:Improve|Mejorar|Crític|Critic).*/i);
  const text = parts.length > 1 ? parts[1] : "";

  // Check for presence of "CRITICAL" or "CRÍTICO" in the table rows
  const hasCritical = /\|\s*\*\*CRÍTICO\*\*\s*\|/.test(text) || /\|\s*CRÍTICO\s*\|/.test(text) || /\|\s*\*\*CRITICAL\*\*\s*\|/.test(text) || /\|\s*CRITICAL\s*\|/.test(text);

  return { text: text || "Please review the proposal for completeness.", hasCritical };
};

/**
 * NEW: Chat with Expert Team Agent (Self-Model / Metacognitive + Tool Calling)
 * UPDATED: Strict checks to prevent hallucinations on missing data.
 * UPDATED: Now supports image input for vision analysis.
 */
export const chatWithBSAExpert = async (
  message: string,
  history: ChatMessage[],
  context: {
    research: ResearchResult | null;
    design: SolutionDesign | null;
    markdown: string;
    costEstimation: CostEstimation | null;
    logs: AgentLog[];
  },
  actions?: {
    regenerateImage: (type: 'cover' | 'concept' | 'infographic', instruction?: string) => Promise<void>;
    expandSection: (section: string) => Promise<void>;
    updateDesign: (design: Partial<SolutionDesign>) => Promise<void>;
  },
  imageBase64?: string // NEW: Optional image for vision analysis
): Promise<string> => {
  // Use flash model (has vision capabilities)
  const model = AI_MODELS.REASONING.FLASH;

  const tools: Tool[] = [
    {
      functionDeclarations: [
        {
          name: "regenerate_visual_asset",
          description: "Regenerate a visual asset. Use ONLY if the user explicitly requests to change an image.",
          parameters: { type: Type.OBJECT, properties: { asset_type: { type: Type.STRING, enum: ["cover", "concept", "infographic"] }, instruction: { type: Type.STRING } }, required: ["asset_type"] }
        },
        {
          name: "expand_kyc_section",
          description: "Perform deep dive research on a specific KYC section.",
          parameters: { type: Type.OBJECT, properties: { section_name: { type: Type.STRING } }, required: ["section_name"] }
        },
        {
          name: "update_solution_design",
          description: "Update the solution design (Mermaid diagram/Architecture).",
          parameters: { type: Type.OBJECT, properties: { mermaid_code: { type: Type.STRING }, architecture_overview: { type: Type.STRING }, rationale: { type: Type.STRING } }, required: ["mermaid_code"] }
        }
      ]
    }
  ];

  const recentLogs = context.logs.filter(l => l.type !== 'info').slice(-30).map(l => `[${l.type.toUpperCase()}] ${l.message}`).join('\n');

  // Check what data is actually available to prevent hallucinations
  const hasKYC = !!context.research;
  const hasDesign = !!context.design;
  const hasProposal = !!context.markdown;
  const hasCost = !!context.costEstimation;

  const systemPrompt = ExpertPrompts.chatSystemInstruction(
    hasKYC,
    hasDesign,
    hasProposal,
    hasCost,
    recentLogs,
    JSON.stringify(context.research?.detailedAnalysis || {}),
    context.design?.mermaidCode || "NOT_GENERATED_YET",
    JSON.stringify(context.costEstimation || {})
  );

  // Build chat history - include images in history if they exist
  const chatHistory = history.map(h => {
    const parts: any[] = [{ text: h.text }];
    if (h.image) {
      const base64Data = h.image.split(',')[1];
      const mimeType = h.image.match(/data:([^;]+);/)?.[1] || 'image/png';
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }
    return { role: h.role, parts };
  });

  try {
    const chat = ai.chats.create({ model: model, config: { systemInstruction: systemPrompt, tools: tools }, history: chatHistory });

    // Build message parts - include image if provided
    const messageParts: any[] = [{ text: message || "Please analyze this image." }];

    if (imageBase64) {
      // Extract base64 data and mime type from data URI
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.match(/data:([^;]+);/)?.[1] || 'image/png';
      messageParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    const result = await chat.sendMessage({ message: messageParts });

    const calls = result.functionCalls;
    if (calls && calls.length > 0) {
      const parts: any[] = [];
      for (const call of calls) {
        let toolResult = {};
        if (call.name === 'regenerate_visual_asset' && actions?.regenerateImage) {
          const args = call.args as any;
          await actions.regenerateImage(args.asset_type, args.instruction);
          toolResult = { result: `Image regeneration triggered.` };
        } else if (call.name === 'expand_kyc_section' && actions?.expandSection) {
          const args = call.args as any;
          await actions.expandSection(args.section_name);
          toolResult = { result: `Expansion triggered.` };
        } else if (call.name === 'update_solution_design' && actions?.updateDesign) {
          const args = call.args as any;
          await actions.updateDesign({ mermaidCode: args.mermaid_code, architectureOverview: args.architecture_overview, rationale: args.rationale });
          toolResult = { result: `Design updated.` };
        } else { toolResult = { result: `Tool not supported.` }; }
        parts.push({ functionResponse: { name: call.name, response: toolResult, id: call.id } });
      }
      const finalResult = await chat.sendMessage({ message: parts });
      return finalResult.text || "Action executed.";
    }
    return result.text || "I'm processing that...";
  } catch (e) {
    console.error("Chat error:", e);
    return "I am currently overloaded. Please try again.";
  }
};


/**
 * Step 6: Cost Estimation Agent
 */
export const generateCostEstimation = async (
  proposalMarkdown: string,
  businessCase: string,
  language: string = "English",
  textModel: string = AI_MODELS.REASONING.FLASH,
  onLog?: LogFn
): Promise<CostEstimation> => {
  const model = textModel;

  if (onLog) onLog(`[Cost Estimator] Analyzing proposal timeline and assigning roles...`);

  // Extract only needed sections to reduce token usage and noise.
  const extractRelevantSections = (md: string) => {
    const cutOffRegex = /##\s*7\./i;
    const parts = md.split(cutOffRegex);
    return parts[0];
  };

  const relevantProposalContext = extractRelevantSections(stripImagesForContext(proposalMarkdown));

  if (onLog) onLog(`[Cost Estimator] Context filtered to relevant sections (Executive Summary, Solution, Timeline).`);

  // DEBUG: Log payload size
  const estTokens = Math.ceil(relevantProposalContext.length / 4);
  if (onLog) onLog(`[Cost Estimator] Estimating Payload: ${relevantProposalContext.length} chars (~${estTokens} tokens).`);

  // DEBUG: Log first 500 chars of proposal to verify correct content
  if (onLog) {
    onLog(`[DEBUG COST] === PROPOSAL PREVIEW (first 500 chars) ===`);
    onLog(`[DEBUG COST] ${relevantProposalContext.substring(0, 500).replace(/\n/g, ' ')}`);
  }

  // DEBUG: Try to extract WBS/Timeline section to verify it's present
  const wbsMatch = relevantProposalContext.match(/##\s*5\..*?(?=##|$)/is);
  const timelineMatch = relevantProposalContext.match(/##\s*6\..*?(?=##|$)/is);
  const cronogramaMatch = relevantProposalContext.match(/cronograma|timeline|desglose.*actividades|wbs/i);

  if (onLog) {
    onLog(`[DEBUG COST] WBS/Section 5 found: ${wbsMatch ? 'YES (' + wbsMatch[0].substring(0, 100) + '...)' : 'NO'}`);
    onLog(`[DEBUG COST] Timeline/Section 6 found: ${timelineMatch ? 'YES' : 'NO'}`);
    onLog(`[DEBUG COST] Cronograma keyword found: ${cronogramaMatch ? 'YES' : 'NO'}`);
  }

  // DEBUG: Count weeks mentioned in proposal
  const weekMatches = relevantProposalContext.match(/(\d+)\s*(semanas?|weeks?)/gi);
  if (onLog && weekMatches) {
    onLog(`[DEBUG COST] Week mentions in proposal: ${weekMatches.join(', ')}`);
  }

  const prompt = EstimatorPrompts.estimateCosts(relevantProposalContext, language);

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: { ...GEN_CONFIG.JSON_MODE }
    }, 1, onLog);

    if (onLog) onLog(`[Cost Estimator] Estimation complete. Calculated Standard and Aggressive plans.`);
    const text = cleanJson(response.text || "{}");
    if (onLog) onLog(`[DEBUG COST] Raw response first 500 chars: ${text.substring(0, 500)}...`);
    const parsed = JSON.parse(text);

    // DEBUG: Log what timeline the estimator chose
    if (onLog) {
      onLog(`[DEBUG COST] === ESTIMATOR RESULT ===`);
      onLog(`[DEBUG COST] Optimal Plan Weeks: ${parsed.optimalPlan?.totalWeeks || 'NOT SET'}`);
      onLog(`[DEBUG COST] Proposal Comparison - Proposed Weeks: ${parsed.proposalComparison?.proposedWeeks || 'NOT SET'}`);
      onLog(`[DEBUG COST] Proposal Comparison - Optimal Weeks: ${parsed.proposalComparison?.optimalWeeks || 'NOT SET'}`);
    }

    return parsed;
  } catch (e) {
    if (onLog) onLog(`Cost Estimation failed: ${e}`);
    throw e;
  }
};


/**
 * Step 6.1: Cost Estimation Refinement
 * FIXED: Now includes proposalMarkdown to maintain timeline context
 */
export const refineCostEstimation = async (
  currentEstimation: CostEstimation,
  instruction: string,
  proposalMarkdown: string,
  language: string = "English",
  textModel: string = AI_MODELS.REASONING.FLASH,
  onLog?: LogFn
): Promise<CostEstimation> => {
  const model = textModel;
  if (onLog) onLog(`[Cost Estimator] Refining plan (Model: ${model}): "${instruction}"...`);

  const prompt = EstimatorPrompts.refineEstimation(currentEstimation, instruction, proposalMarkdown, language);

  try {
    const response = await generateWithRetry(model, {
      contents: prompt,
      config: { ...GEN_CONFIG.JSON_MODE }
    }, 1, onLog);

    const text = cleanJson(response.text || "{}");
    return JSON.parse(text);
  } catch (e) {
    if (onLog) onLog(`Cost Refinement failed: ${e}`);
    throw e;
  }
};


// ============ METACOGNITION ANALYSIS (ReAct Pattern) ============

/**
 * Step 7: Metacognition Analysis - ReAct Pattern
 * Stage 1: Reason - Identify hypotheses and search queries
 * Stage 2: Act - Execute Google Search grounding
 * Stage 3: Observe - Synthesize findings into final analysis
 */
export const analyzeMetacognition = async (
  companyName: string,
  research: ResearchResult,
  business: BusinessAnalysis,
  design: SolutionDesign,
  proposal: string,
  cost: CostEstimation,
  language: string = "English",
  textModel: string = AI_MODELS.REASONING.FLASH,
  onLog?: LogFn
): Promise<MetacognitionAnalysis> => {
  if (onLog) onLog(`[ReAct Metacognition] Starting cognitive analysis for ${companyName}...`);

  try {
    // ===== STAGE 1: REASON =====
    if (onLog) onLog(`[ReAct Metacognition] Reasoning: Identifying hypotheses and search queries...`);

    const stage1Prompt = MetacognitionPrompts.stage1_reason(
      companyName, research, business, design, cost, language
    );

    const stage1Response = await generateWithRetry(textModel, {
      contents: stage1Prompt,
      config: { ...GEN_CONFIG.JSON_MODE }
    }, 1, onLog);

    const stage1Result = JSON.parse(cleanJson(stage1Response.text || "{}"));
    if (onLog) onLog(`[ReAct Metacognition] Identified ${stage1Result.searchQueries?.length || 0} areas requiring validation.`);

    // ===== STAGE 2: ACT (Google Search Grounding) =====
    if (onLog) onLog(`[ReAct Metacognition] Action: Executing grounded search for validation...`);

    const industry = research.detailedAnalysis?.industryLandscape || "technology";
    const stage2Prompt = MetacognitionPrompts.stage2_act(
      companyName, industry, stage1Result.hypotheses, language
    );

    const stage2Response = await generateWithRetry(textModel, {
      contents: stage2Prompt,
      config: {
        ...GEN_CONFIG.HIGH_OUTPUT,
        tools: [{ googleSearch: {} }]
      }
    }, 1, onLog);

    const searchFindings = stage2Response.text || "No additional findings from search.";
    if (onLog) onLog(`[ReAct Metacognition] Observation: Received grounded research insights.`);

    // ===== STAGE 3: OBSERVE (Synthesize Final Analysis) =====
    if (onLog) onLog(`[ReAct Metacognition] Synthesizing: Creating final analysis with grounded insights...`);

    const stage3Prompt = MetacognitionPrompts.stage3_observe(
      companyName, research, business, design, proposal, cost, searchFindings, language
    );

    let analysis: MetacognitionAnalysis | undefined;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        const stage3Response = await generateWithRetry(textModel, {
          contents: stage3Prompt,
          config: { ...GEN_CONFIG.JSON_MODE }
        }, 1, onLog);

        const text = cleanJson(stage3Response.text || "{}");
        analysis = JSON.parse(text);
        break;
      } catch (e) {
        attempts++;
        if (onLog) onLog(`[ReAct Metacognition] Warning: JSON parsing failed in stage 3 (Attempt ${attempts}/${maxAttempts}). Retrying synthesis...`);
        if (attempts === maxAttempts) throw e;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!analysis) throw new Error("Failed to generate valid metacognition analysis.");

    if (onLog) onLog(`[ReAct Metacognition] Identified ${analysis.consonanceMatrix?.length || 0} alignment dimensions.`);
    if (onLog) onLog(`[ReAct Metacognition] Found ${analysis.dissonanceAlerts?.length || 0} dissonance alerts.`);
    if (onLog) onLog(`[ReAct Metacognition] Mapped ${analysis.tensionManagement?.length || 0} tensions to manage.`);
    if (onLog) onLog(`[ReAct Metacognition] ✅ Analysis complete with grounded validation.`);

    return analysis;
  } catch (e) {
    if (onLog) onLog(`[ReAct Metacognition] ❌ Error: ${e}`);
    throw e;
  }
};

/**
 * Expand a metacognition section with AI
 */
export const expandMetacognitionSection = async (
  sectionName: string,
  currentContent: string,
  fullAnalysis: MetacognitionAnalysis,
  language: string = "English",
  textModel: string = AI_MODELS.REASONING.FLASH,
  onLog?: LogFn
): Promise<string> => {
  if (onLog) onLog(`[Metacognition Analyst] Expanding "${sectionName}"...`);

  const prompt = MetacognitionPrompts.expandSection(
    sectionName,
    currentContent,
    JSON.stringify(fullAnalysis, null, 2),
    language
  );

  try {
    const response = await generateWithRetry(textModel, {
      contents: prompt,
      config: { ...GEN_CONFIG.HIGH_OUTPUT }
    }, 1, onLog);

    if (onLog) onLog(`[Metacognition Analyst] ✅ Section expanded successfully.`);
    return response.text || currentContent;
  } catch (e) {
    if (onLog) onLog(`[Metacognition Analyst] ❌ Expansion failed: ${e}`);
    return currentContent;
  }
};
