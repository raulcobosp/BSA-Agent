import React, { useState, useEffect } from 'react';
import { ProposalRequest, AppStep, AgentLog, ResearchResult, SolutionDesign, ProposalImages, BusinessAnalysis, ContextDensity, ExpandConfig, CostEstimation, CostSettings, MetacognitionAnalysis } from './types';
import { AI_MODELS } from './config/models';
import InputStep from './components/InputStep';
import ProcessingStep from './components/ProcessingStep';
import ResultStep from './components/ResultStep';
import { conductResearch, analyzeBusinessCase, designSolution, generateProposal, evaluateProposal, parseEvaluationScore, extractImprovements, expandResearchSection, expandBusinessSection, expandProposalSection, generateSingleImage, setExecutionDelay, researchArchitectServices, generateCostEstimation, refineCostEstimation, validateSolutionDesign, generateKYCInfographic, generateBusinessInfographic, generateArchitectureInfographic, generateCostInfographic, generateCoverImage, generateCoverWithLogos, analyzeMetacognition, generateMetacognitionInfographic, expandMetacognitionSection } from './services/geminiService';
import { Terminal, Check, Edit3, Plus, Trash2, ArrowRight, Save, FolderOpen, Cpu } from 'lucide-react';
import { saveSession, loadSession } from './services/sessionService';
import { SavedSession } from './types';
import SessionManager from './components/SessionManager';
import { applySyncToProposal, generateSyncPreview, ProposalSyncPreview } from './utils/proposalSync';


const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [logs, setLogs] = useState<AgentLog[]>([]);

  // Keep track of the request data for re-runs
  const [currentRequest, setCurrentRequest] = useState<ProposalRequest | null>(null);

  // State for Agent Artifacts
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [businessAnalysis, setBusinessAnalysis] = useState<BusinessAnalysis | null>(null);
  const [solutionDesign, setSolutionDesign] = useState<SolutionDesign | null>(null);
  const [proposalImages, setProposalImages] = useState<ProposalImages | null>(null);
  const [resultMarkdown, setResultMarkdown] = useState<string>('');
  const [evaluationMarkdown, setEvaluationMarkdown] = useState<string>('');
  const [costEstimation, setCostEstimation] = useState<CostEstimation | null>(null);
  const [metacognitionAnalysis, setMetacognitionAnalysis] = useState<MetacognitionAnalysis | null>(null);
  const [isImproving, setIsImproving] = useState(false);
  const [apiDelay, setApiDelay] = useState(0); // Default 0s delay
  const [contextDensity, setContextDensity] = useState<ContextDensity>('high'); // Default High density

  // State for Architectural Steering
  const [steeringServices, setSteeringServices] = useState<string[]>([]);
  const [steeringInstruction, setSteeringInstruction] = useState('');

  // Cost Settings State
  const [costSettings, setCostSettings] = useState<CostSettings>({
    fixedLeadershipAllocation: false,
    leadershipPercentage: 12.5
  });

  // Session Manager State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);

  // Proposal Sync Preview State
  const [syncPreview, setSyncPreview] = useState<ProposalSyncPreview | null>(null);


  // Helper log function passed to services
  const addLog = (message: string, type: AgentLog['type'] = 'info') => {
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(36).substr(2, 9), timestamp: new Date(), message, type },
    ]);
  };

  // Wrapper for service calls to use simple string logging
  const logWrapper = (msg: string) => addLog(msg, 'thinking');

  const handleDelayChange = (seconds: number) => {
    setApiDelay(seconds);
    setExecutionDelay(seconds);
  };

  const handleStartProcess = async (data: ProposalRequest) => {
    setCurrentRequest(data);

    // Initialize settings from Input
    setContextDensity(data.contextDensity);
    setApiDelay(data.apiDelay);
    setExecutionDelay(data.apiDelay);

    setStep(AppStep.PROCESSING);
    setLogs([]);
    setResearchResult(null);
    setBusinessAnalysis(null);
    setSolutionDesign(null);
    setProposalImages(null);
    setResultMarkdown('');
    setEvaluationMarkdown('');
    setCostEstimation(null);
    setIsImproving(false);

    addLog(`Initialized agent for company: ${data.companyName}`, 'info');
    addLog(`Configuration: Density=${data.contextDensity.toUpperCase()}, API Delay=${data.apiDelay}s`, 'info');

    try {
      // --- PHASE 1: Research (Blocking Phase) ---
      addLog(`Starting KYC Research using Google Search Grounding (Language: ${data.language})...`, 'thinking');
      const research = await conductResearch(data.companyName, data.language, logWrapper);
      setResearchResult(research);
      addLog(`Research complete. Identified strategic goals and SWOT analysis.`, 'success');

      // Generate KYC Infographic immediately after research
      const kycImage = await generateKYCInfographic(data.companyName, research, data.language, data.imageModel, logWrapper);
      setProposalImages(prev => ({ ...prev, kycInfographic: kycImage }));

      // --- PHASE 1.5: Business Analysis ---
      addLog(`Analyzing Business Case & ROI...`, 'thinking');
      const bAnalysis = await analyzeBusinessCase(data.companyName, data.businessCase, data.language, logWrapper);
      setBusinessAnalysis(bAnalysis);
      addLog(`Business Case Analysis Complete.`, 'success');

      // Generate Business Infographic immediately after analysis
      const bizImage = await generateBusinessInfographic(bAnalysis, data.language, data.imageModel, logWrapper);
      setProposalImages(prev => ({ ...prev, businessInfographic: bizImage }));

      setStep(AppStep.RESULT);

      // --- PHASE 2: Design (Async) ---
      addLog(`Designing Architecture for "${data.companyName}"...`, 'thinking');

      let design = await designSolution(data, research, bAnalysis, undefined, undefined, logWrapper, data.contextDensity);

      // LOGIC VALIDATION LOOP
      addLog(`Validating Architecture Logic against Business Requirements...`, 'thinking');
      const validation = await validateSolutionDesign(bAnalysis, design, logWrapper);

      if (!validation.isValid) {
        addLog(`❌ Architecture Logic Check Failed (Score: ${validation.score}/10).`, 'error');
        addLog(`Critique: "${validation.critique}"`, 'info');
        addLog(`Re-designing architecture with corrective feedback...`, 'thinking');

        // Retry Loop
        design = await designSolution(data, research, bAnalysis, validation.critique, design, logWrapper, data.contextDensity);
        addLog(`✅ Re-design complete.`, 'success');
      } else {
        addLog(`✅ Architecture Logic Validated (Score: ${validation.score}/10).`, 'success');
      }

      setSolutionDesign(design);

      // Generate Architecture Infographic immediately after design
      const archImage = await generateArchitectureInfographic(design, data.hyperScaler, data.language, data.imageModel, logWrapper);
      setProposalImages(prev => ({ ...prev, architectureInfographic: archImage }));

      addLog(`Design Phase Complete. Waiting for user approval to generate proposal...`, 'success');

      // STOP AUTO-GENERATION
      /* 
      // --- PHASE 3: Image Generation ---
      addLog(`Generating visual assets...`, 'thinking');
      const images = await generateProposalImages(data.companyName, research, data.businessCase, design, data.imageModel, logWrapper);
      setProposalImages(images);

      setStep(AppStep.RESULT);

      // --- PHASE 4: Proposal Generation ---
      await runProposalLoop(data, research, bAnalysis, design, images, data.contextDensity);
      */

    } catch (error) {
      addLog(`Critical Error: ${error}`, 'error');
    }
  };

  /**
   * User Action: Trigger Proposal Generation manually
   */
  const handleGenerateProposal = async () => {
    if (!currentRequest || !researchResult || !businessAnalysis || !solutionDesign) {
      addLog("Missing required artifacts to generate proposal.", 'error');
      return;
    }

    try {
      setIsImproving(true);
      // --- PHASE 3: Cover Image Generation with Logos ---
      addLog(`Generating cover image with logos...`, 'thinking');
      const coverContext = {
        summary: researchResult.summary,
        businessCase: currentRequest.businessCase,
        strategicGoals: researchResult.strategicGoals,
        hyperScaler: currentRequest.hyperScaler,
        problemStatement: businessAnalysis.problemStatement
      };
      const coverImage = await generateCoverWithLogos(currentRequest.companyName, coverContext, '', currentRequest.imageModel, logWrapper);
      setProposalImages(prev => ({ ...prev, coverImage }));

      // --- PHASE 4: Proposal Generation ---
      await runProposalLoop(currentRequest, researchResult, businessAnalysis, solutionDesign, { ...proposalImages, coverImage }, currentRequest.contextDensity);
    } catch (e) {
      addLog(`Error generating proposal: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * Main Logic loop: Generate (optional) -> Evaluate -> Refine (if needed)
   */
  const runProposalLoop = async (
    data: ProposalRequest,
    research: ResearchResult,
    bAnalysis: BusinessAnalysis,
    design: SolutionDesign,
    images: ProposalImages | undefined,
    density: ContextDensity,
    startingProposal?: string // If provided, we assume this is the "newest" draft to evaluate
  ) => {
    let currentProposal = startingProposal || "";

    // If we didn't start with a proposal (normal flow), generate one
    if (!currentProposal) {
      addLog(`Drafting initial proposal (Density: ${density})...`, 'thinking');
      // Note: applyContextFilter is in geminiService but we'll simulate the call here
      // In a real build we'd export it or refactor generateProposal to handle it
      currentProposal = await generateProposal(data, research, bAnalysis, design, images, undefined, undefined, logWrapper, density);
      setResultMarkdown(currentProposal);
      addLog('Initial draft generated.', 'success');
    }

    /* DECOUPLED: Optimization per user request. Smart Audit is now manual only.
    addLog(`Running Initial SMART Evaluation...`, 'thinking');
    const evalResult = await evaluateProposal(currentProposal, data.companyName, data.language, logWrapper);
    setEvaluationMarkdown(evalResult);

    const score = parseEvaluationScore(evalResult);
    const { hasCritical } = extractImprovements(evalResult);

    addLog(`Quality Score: ${score}/100 | Critical Issues: ${hasCritical ? 'YES' : 'NO'}`, 'info');

    if (score < 90 || hasCritical) {
      addLog('Initial quality check failed. Attempting one auto-correction...', 'thinking');
      const { text: improvements } = extractImprovements(evalResult);
      currentProposal = await generateProposal(data, research, bAnalysis, design, images, improvements, currentProposal, logWrapper, density);
      setResultMarkdown(currentProposal);
      addLog(`Corrected proposal generated. Ready for review.`, 'success');
    } else {
      addLog('Quality Standard Met (SMART > 90% & No Criticals). Process Complete.', 'success');
    }
    */
    addLog('Proposal generated. Ready for review.', 'success');

    setIsImproving(false);
  };

  /**
   * User Action: Manual Update/Delete of Expanded Content (KYC & Business)
   */
  const handleUpdateContent = (type: 'kyc' | 'business' | 'design', section: string, content: string | null) => {
    if (type === 'kyc') {
      setResearchResult(prev => {
        if (!prev) return null;
        const newExpanded = { ...prev.expandedContent };
        if (content === null) {
          delete newExpanded[section];
        } else {
          newExpanded[section] = content;
        }
        return { ...prev, expandedContent: newExpanded };
      });
    } else if (type === 'design') {
      setSolutionDesign(prev => {
        if (!prev) return null;
        const newExpanded = { ...prev.expandedContent };
        if (content === null) {
          delete newExpanded[section];
        } else {
          newExpanded[section] = content;
        }
        return { ...prev, expandedContent: newExpanded };
      });
    } else {
      setBusinessAnalysis(prev => {
        if (!prev) return null;
        const newExpanded = { ...prev.expandedContent };
        if (content === null) {
          delete newExpanded[section];
        } else {
          newExpanded[section] = content;
        }
        return { ...prev, expandedContent: newExpanded };
      });
    }
    addLog(`${type.toUpperCase()} section '${section}' ${content === null ? 'deleted' : 'updated'} manually.`, 'info');
  };

  /**
   * User Action: Manual Update of Proposal Markdown
   */
  const handleUpdateProposal = (newMarkdown: string) => {
    setResultMarkdown(newMarkdown);
  };

  /**
   * User Action: Manual Audit Trigger
   */
  const handleManualAudit = async () => {
    if (!resultMarkdown || !currentRequest) return;
    setIsImproving(true);
    addLog('Manual SMART Audit triggered...', 'thinking');
    try {
      const evalResult = await evaluateProposal(resultMarkdown, currentRequest.companyName, currentRequest.language, logWrapper);
      setEvaluationMarkdown(evalResult);
      const score = parseEvaluationScore(evalResult);
      addLog(`Audit Complete. New Score: ${score}/100`, 'success');
    } catch (e) {
      addLog(`Audit Error: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Expand KYC Section
   */
  const handleExpandKYC = async (sectionKey: string, config: ExpandConfig) => {
    if (!currentRequest || !researchResult) return;

    addLog(`Expanding KYC section: ${sectionKey} (Density: ${config.density})...`, 'thinking');
    setIsImproving(true); // Re-use loading state indicator

    try {
      const expandedText = await expandResearchSection(
        currentRequest.companyName,
        sectionKey,
        researchResult.detailedAnalysis,
        currentRequest.language,
        config,
        logWrapper
      );

      setResearchResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          expandedContent: {
            ...prev.expandedContent,
            [sectionKey]: expandedText
          }
        };
      });
      addLog(`Section ${sectionKey} expanded successfully.`, 'success');
    } catch (e) {
      addLog(`Error expanding section: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Expand Business Case Section
   */
  const handleExpandBusiness = async (sectionKey: string, config: ExpandConfig) => {
    if (!currentRequest || !businessAnalysis) return;

    addLog(`Expanding Business Case section: ${sectionKey} (Density: ${config.density})...`, 'thinking');
    setIsImproving(true);

    try {
      const expandedText = await expandBusinessSection(
        sectionKey,
        businessAnalysis,
        currentRequest.language,
        config,
        logWrapper
      );

      setBusinessAnalysis(prev => {
        if (!prev) return null;
        return {
          ...prev,
          expandedContent: {
            ...prev.expandedContent,
            [sectionKey]: expandedText
          }
        };
      });
      addLog(`Business section ${sectionKey} expanded successfully.`, 'success');
    } catch (e) {
      addLog(`Error expanding business section: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Expand Proposal Section
   */
  const handleExpandProposal = async (section: string, config: ExpandConfig) => {
    if (!resultMarkdown || !currentRequest) return;
    setIsImproving(true);
    addLog(`Expanding proposal section: ${section} (Density: ${config.density})...`, 'thinking');

    try {
      const expansion = await expandProposalSection(
        section,
        resultMarkdown,
        currentRequest.businessCase,
        currentRequest.language,
        config,
        logWrapper
      );

      const escapedSection = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^(#{1,6})\\s+${escapedSection}\\s*$`, 'im');

      setResultMarkdown(prev => {
        const match = prev.match(regex);
        if (match && match.index !== undefined) {
          const endOfMatch = match.index + match[0].length;
          return prev.slice(0, endOfMatch) + `\n\n${expansion}\n` + prev.slice(endOfMatch);
        }
        return prev + `\n\n## ${section} (Expanded)\n${expansion}`;
      });
      addLog(`Section '${section}' expanded successfully.`, 'success');
    } catch (e) {
      addLog(`Error expanding proposal: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Expand Metacognition Section
   */
  const handleExpandMetacognition = async (section: string, config: ExpandConfig) => {
    if (!metacognitionAnalysis || !currentRequest) return;
    setIsImproving(true);
    addLog(`Expanding metacognition section: ${section}...`, 'thinking');

    try {
      // If we don't have expandedContent record yet, grab the source data
      let currentContent = metacognitionAnalysis.expandedContent?.[section] || "";

      if (!currentContent) {
        if (section === 'Customer Perspective') {
          currentContent = JSON.stringify(metacognitionAnalysis.customerPerspective, null, 2);
        } else if (section === 'Nubiral Perspective') {
          currentContent = JSON.stringify(metacognitionAnalysis.nubiralPerspective, null, 2);
        } else if (section === 'Proposal Perspective') {
          currentContent = JSON.stringify(metacognitionAnalysis.proposalPerspective, null, 2);
        }
      }

      const expandedText = await expandMetacognitionSection(
        section,
        currentContent,
        metacognitionAnalysis,
        currentRequest.language,
        currentRequest.textModel,
        logWrapper
      );

      setMetacognitionAnalysis(prev => {
        if (!prev) return null;
        return {
          ...prev,
          expandedContent: {
            ...prev.expandedContent,
            [section]: expandedText
          }
        };
      });

      addLog(`Metacognition section '${section}' expanded.`, 'success');
    } catch (e) {
      addLog(`Error expanding metacognition section: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Regenerate Specific Image
   */
  const handleRegenerateImage = async (type: 'cover' | 'infographic', instruction?: string) => {
    if (!currentRequest || !researchResult) return;

    setIsImproving(true);
    addLog(`Regenerating ${type} image...`, 'thinking');

    try {
      const contextData = {
        summary: researchResult.summary,
        businessCase: currentRequest.businessCase,
        analysis: researchResult.detailedAnalysis,
        strategicGoals: researchResult.strategicGoals,
        hyperScaler: currentRequest.hyperScaler,
        problemStatement: businessAnalysis?.problemStatement
      };

      let newImageUrl: string | undefined;

      if (type === 'cover') {
        // Use logo composite function for cover images
        newImageUrl = await generateCoverWithLogos(
          currentRequest.companyName,
          contextData,
          instruction,
          currentRequest.imageModel,
          logWrapper
        );
      } else {
        newImageUrl = await generateSingleImage(
          type,
          currentRequest.companyName,
          contextData,
          instruction,
          currentRequest.imageModel,
          logWrapper
        );
      }

      if (newImageUrl) {
        setProposalImages(prev => {
          const newState = { ...prev };
          if (type === 'cover') newState.coverImage = newImageUrl;
          if (type === 'infographic') newState.kycInfographic = newImageUrl;
          return newState;
        });
        addLog(`${type} image updated successfully.`, 'success');

        if (resultMarkdown) {
          setResultMarkdown(prev => {
            const altMap: Record<string, string> = {
              'cover': '![Cover Image]',
              'infographic': '![KYC Infographic]'
            };

            const alt = altMap[type];
            if (!alt) return prev;

            const regex = new RegExp(`${alt.replace('[', '\\[').replace(']', '\\]')}\\(data:image/[^)]+\\)`);
            if (regex.test(prev)) {
              return prev.replace(regex, `${alt}(${newImageUrl})`);
            }
            return prev;
          });
        }
      }
    } catch (e) {
      addLog(`Error regenerating image: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Update Architecture from Chat
   */
  const handleUpdateDesignFromChat = async (newDesign: Partial<SolutionDesign>) => {
    if (!solutionDesign) return;

    addLog(`Architecture updated via Chat Agent.`, 'success');
    setSolutionDesign(prev => {
      if (!prev) return null;
      return {
        ...prev,
        mermaidCode: newDesign.mermaidCode || prev.mermaidCode,
        architectureOverview: newDesign.architectureOverview || prev.architectureOverview,
        rationale: newDesign.rationale || prev.rationale,
        keyComponents: newDesign.keyComponents || prev.keyComponents
      };
    });
  };

  /**
   * User Action: Refine Design
   */
  const handleRefineDesign = async (feedback: string) => {
    if (!solutionDesign || !researchResult || !currentRequest || !businessAnalysis) return;

    setIsImproving(true);
    addLog(`Refining Architecture based on user feedback...`, 'thinking');

    try {
      const newDesign = await designSolution(currentRequest, researchResult, businessAnalysis, feedback, solutionDesign, logWrapper, contextDensity);
      setSolutionDesign(newDesign);
      addLog('Architecture updated successfully. Click "Generate Proposal Document" when ready.', 'success');

      // NOTE: Do NOT auto-trigger proposal generation here
      // User must click the explicit "Generate Proposal Document" button
    } catch (e) {
      addLog(`Error during refinement: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Refine Proposal Text
   */
  const handleRefineProposal = async (feedback: string) => {
    if (!solutionDesign || !researchResult || !currentRequest || !businessAnalysis) return;

    setIsImproving(true);
    addLog(`Refining Proposal based on user feedback...`, 'thinking');

    try {
      const newProposal = await generateProposal(currentRequest, researchResult, businessAnalysis, solutionDesign, proposalImages || undefined, feedback, resultMarkdown, logWrapper, contextDensity);
      setResultMarkdown(newProposal);
      addLog('Proposal updated based on feedback.', 'success');

      await runProposalLoop(currentRequest, researchResult, businessAnalysis, solutionDesign, proposalImages || undefined, contextDensity, newProposal);
    } catch (e) {
      addLog(`Error during refinement: ${e}`, 'error');
      setIsImproving(false);
    }
  };

  /**
   * User Action: Estimate Execution Cost
   */
  const handleEstimateCost = async () => {
    if (!resultMarkdown || !currentRequest) return;

    setIsImproving(true);
    addLog('Initiating Execution Cost Estimation (Agentic)...', 'thinking');
    try {
      const estimation = await generateCostEstimation(resultMarkdown, currentRequest.businessCase, currentRequest.language, currentRequest.textModel, logWrapper);
      setCostEstimation(estimation);
      addLog('Cost Estimation generated successfully.', 'success');

      // Generate Cost Infographic immediately after estimation
      const costImage = await generateCostInfographic(estimation, currentRequest.language, currentRequest.imageModel, logWrapper);
      setProposalImages(prev => ({ ...prev, costInfographic: costImage }));
    } catch (e) {
      addLog(`Error generating cost estimation: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Refine Cost Estimation
   * FIXED: Now passes resultMarkdown to maintain proposal timeline context
   */
  const handleRefineCost = async (instruction: string) => {
    if (!costEstimation || !resultMarkdown) {
      addLog('Cannot refine cost without proposal context.', 'error');
      return;
    }

    setIsImproving(true);
    addLog(`Refining cost plan: "${instruction}"...`, 'thinking');
    try {
      const newEstimation = await refineCostEstimation(
        costEstimation,
        instruction,
        resultMarkdown, // Pass the proposal markdown for timeline context
        currentRequest?.language || "English",
        currentRequest?.textModel || "gemini-2.0-flash",
        logWrapper
      );
      setCostEstimation(newEstimation);
      addLog('Cost plan refined.', 'success');
    } catch (e) {
      addLog(`Error refining cost: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };


  /**
   * User Action: Save Cost Estimation (after edits) and regenerate infographic
   */
  const handleSaveCostEstimation = async (editedEstimation: CostEstimation) => {
    if (!currentRequest) return;

    setIsImproving(true);
    addLog('Saving cost estimation changes...', 'thinking');
    try {
      setCostEstimation(editedEstimation);

      // Regenerate cost infographic with updated data
      addLog('Regenerating cost infographic with updated plan...', 'thinking');
      const newCostImage = await generateCostInfographic(editedEstimation, currentRequest.language, currentRequest.imageModel, logWrapper);
      setProposalImages(prev => ({ ...prev, costInfographic: newCostImage }));

      addLog('Cost estimation saved and infographic regenerated.', 'success');
    } catch (e) {
      addLog(`Error saving cost estimation: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Show preview of syncing cost estimation to proposal
   */
  const handleShowSyncPreview = () => {
    if (!costEstimation || !resultMarkdown || !currentRequest) {
      addLog('Cannot sync: missing cost estimation or proposal.', 'error');
      return;
    }

    const preview = generateSyncPreview(resultMarkdown, costEstimation, currentRequest.language);
    setSyncPreview(preview);
    addLog('Generating sync preview...', 'thinking');
  };

  /**
   * User Action: Apply the sync (update proposal with cost data)
   */
  const handleApplySync = () => {
    if (!costEstimation || !resultMarkdown || !currentRequest) return;

    const updatedMarkdown = applySyncToProposal(resultMarkdown, costEstimation, currentRequest.language);
    setResultMarkdown(updatedMarkdown);
    setSyncPreview(null);
    addLog('Proposal updated with Nubiral Team and WBS from Cost Estimation.', 'success');
  };

  /**
   * User Action: Cancel sync preview
   */
  const handleCancelSync = () => {
    setSyncPreview(null);
  };


  /**
   * User Action: Regenerate a specific infographic type
   */
  const handleRegenerateInfographic = async (type: 'kyc' | 'business' | 'architecture' | 'cost' | 'metacognition') => {
    if (!currentRequest) return;

    setIsImproving(true);
    addLog(`Regenerating ${type} infographic...`, 'thinking');

    try {
      let newImage: string | undefined;

      switch (type) {
        case 'kyc':
          if (researchResult) {
            newImage = await generateKYCInfographic(currentRequest.companyName, researchResult, currentRequest.language, currentRequest.imageModel, logWrapper);
            setProposalImages(prev => ({ ...prev, kycInfographic: newImage }));
          }
          break;
        case 'business':
          if (businessAnalysis) {
            newImage = await generateBusinessInfographic(businessAnalysis, currentRequest.language, currentRequest.imageModel, logWrapper);
            setProposalImages(prev => ({ ...prev, businessInfographic: newImage }));
          }
          break;
        case 'architecture':
          if (solutionDesign) {
            newImage = await generateArchitectureInfographic(solutionDesign, currentRequest.hyperScaler, currentRequest.language, currentRequest.imageModel, logWrapper);
            setProposalImages(prev => ({ ...prev, architectureInfographic: newImage }));
          }
          break;
        case 'cost':
          if (costEstimation) {
            newImage = await generateCostInfographic(costEstimation, currentRequest.language, currentRequest.imageModel, logWrapper);
            setProposalImages(prev => ({ ...prev, costInfographic: newImage }));
          }
          break;
        case 'metacognition':
          if (metacognitionAnalysis) {
            const image = await generateMetacognitionInfographic(metacognitionAnalysis, currentRequest.companyName, currentRequest.language, currentRequest.imageModel, logWrapper);
            setProposalImages(prev => ({ ...prev, metacognitionInfographic: image }));
          }
          break;
      }

      addLog(`${type} infographic regenerated.`, 'success');
    } catch (e) {
      addLog(`Error regenerating ${type} infographic: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Analyze Metacognition (ReAct Pattern)
   */
  const handleAnalyzeMetacognition = async () => {
    if (!currentRequest || !researchResult || !businessAnalysis || !solutionDesign || !costEstimation || !resultMarkdown) {
      addLog("Missing required artifacts for metacognition analysis. Generate proposal and cost estimation first.", 'error');
      return;
    }

    setIsImproving(true);
    addLog(`Starting Metacognition Analysis...`, 'thinking');

    try {
      // Run the ReAct metacognition analysis
      const analysis = await analyzeMetacognition(
        currentRequest.companyName,
        researchResult,
        businessAnalysis,
        solutionDesign,
        resultMarkdown,
        costEstimation,
        currentRequest.language,
        AI_MODELS.REASONING.PRO,
        logWrapper
      );

      setMetacognitionAnalysis(analysis);
      addLog(`Metacognition analysis complete.`, 'success');

      // Generate infographic
      addLog(`Generating Metacognition Infographic...`, 'thinking');
      const infographic = await generateMetacognitionInfographic(
        analysis,
        currentRequest.companyName,
        currentRequest.language,
        currentRequest.imageModel,
        logWrapper
      );

      if (infographic) {
        setProposalImages(prev => ({ ...prev, metacognitionInfographic: infographic }));
        addLog(`Metacognition Infographic generated.`, 'success');
      }

    } catch (e) {
      addLog(`Metacognition analysis failed: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  /**
   * User Action: Update Cost Settings (SDM/TL fixed allocation rule)
   */
  const handleUpdateCostSettings = (settings: CostSettings) => {
    setCostSettings(settings);
    addLog(`Cost settings updated: Fixed Leadership=${settings.fixedLeadershipAllocation ? 'ON' : 'OFF'} at ${settings.leadershipPercentage}%`, 'info');
  };

  /**
   * User Action: Update Models
   */
  const handleUpdateModels = (text: string, image: string) => {
    if (currentRequest) {
      setCurrentRequest(prev => prev ? ({ ...prev, textModel: text, imageModel: image }) : null);
      addLog(`Configuration updated: Text=[${text}], Image=[${image}]`, 'info');
    }
  };

  /**
   * User Action: Regenerate Solution Design (Full Re-run)
   */
  const handleRegenerateDesign = async () => {
    if (!currentRequest || !researchResult || !businessAnalysis) {
      addLog("Missing required artifacts to regenerate design.", 'error');
      return;
    }

    setIsImproving(true);
    addLog(`Regenerating Solution Architecture based on latest Strategy...`, 'thinking');

    try {
      let design = await designSolution(
        currentRequest,
        researchResult,
        businessAnalysis,
        undefined,
        undefined,
        logWrapper,
        contextDensity
      );

      // Validation Logic
      addLog(`Validating Architecture Logic...`, 'thinking');
      const validation = await validateSolutionDesign(businessAnalysis, design, logWrapper);

      if (!validation.isValid) {
        addLog(`Critique: "${validation.critique}"`, 'info');
        addLog(`Re-designing architecture with corrective feedback...`, 'thinking');
        design = await designSolution(
          currentRequest,
          researchResult,
          businessAnalysis,
          validation.critique,
          design,
          logWrapper,
          contextDensity
        );
      }

      setSolutionDesign(design);
      addLog(`✅ Architecture Regenerated.`, 'success');

      // Regenerate Infographic
      if (currentRequest.hyperScaler && currentRequest.language && currentRequest.imageModel) {
        const archImage = await generateArchitectureInfographic(
          design,
          currentRequest.hyperScaler,
          currentRequest.language,
          currentRequest.imageModel,
          logWrapper
        );
        setProposalImages(prev => ({ ...prev, architectureInfographic: archImage }));
      }

    } catch (e) {
      addLog(`Error regenerating design: ${e}`, 'error');
    } finally {
      setIsImproving(false);
    }
  };

  const handleReset = () => {
    setStep(AppStep.INPUT);

    setLogs([]);
    setResultMarkdown('');
    setEvaluationMarkdown('');
    setResearchResult(null);
    setBusinessAnalysis(null);
    setSolutionDesign(null);
    setProposalImages(null);
    setCostEstimation(null);
    setCurrentRequest(null);
  };

  /* --- Session Handlers --- */
  const handleSaveSession = async () => {
    if (!currentRequest) {
      addLog("Cannot save empty session. Please start a proposal first.", 'error');
      return;
    }

    const id = currentSessionId || crypto.randomUUID();
    const name = currentRequest.companyName || "Untitled Proposal";

    const session: SavedSession = {
      id,
      name,
      timestamp: Date.now(),
      lastModified: Date.now(),
      data: {
        request: currentRequest,
        research: researchResult,
        business: businessAnalysis,
        design: solutionDesign,
        proposalMarkdown: resultMarkdown,
        costEstimation: costEstimation,
        metacognition: metacognitionAnalysis,
        images: proposalImages || {},
        evaluationScore: evaluationMarkdown,
        step: step,
        logs: logs,
        activeTab: 'business' // Default
      }
    };

    try {
      await saveSession(session);
      setCurrentSessionId(id);
      addLog(`Session '${name}' saved successfully.`, 'success');
    } catch (e) {
      console.error(e);
      addLog("Failed to save session.", 'error');
    }
  };

  const handleLoadSession = async (id: string) => {
    try {
      const session = await loadSession(id);
      if (session) {
        setCurrentSessionId(session.id);
        setCurrentRequest(session.data.request);
        if (session.data.request) {
          setContextDensity(session.data.request.contextDensity);
          setApiDelay(session.data.request.apiDelay);
        }
        setResearchResult(session.data.research);
        setBusinessAnalysis(session.data.business);
        setSolutionDesign(session.data.design);
        setResultMarkdown(session.data.proposalMarkdown);
        setCostEstimation(session.data.costEstimation);
        setMetacognitionAnalysis(session.data.metacognition);
        setProposalImages(session.data.images);
        setEvaluationMarkdown(session.data.evaluationScore);
        setStep(session.data.step);
        setLogs(session.data.logs);
        addLog(`Session '${session.name}' loaded.`, 'success');
      }
    } catch (e) {
      console.error(e);
      addLog("Failed to load session.", 'error');
    }
  };

  const handleNewSession = () => {
    if (confirm("Start a new session? Unsaved progress will be lost.")) {
      setCurrentSessionId(null);
      setStep(AppStep.INPUT);
      setCurrentRequest(null);
      setResearchResult(null);
      setBusinessAnalysis(null);
      setSolutionDesign(null);
      setResultMarkdown('');
      setProposalImages(null);
      setCostEstimation(null);
      setMetacognitionAnalysis(null);
      setLogs([]);
      setSteeringServices([]);
      setSteeringInstruction('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Global Header */}
        <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSessionManagerOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <div className="bg-indigo-50 p-2 rounded-lg">
              <Cpu className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent leading-none">
                Nubiral BSA
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">GenAI Architect Agent</p>
            </div>
            {currentSessionId && (
              <div className="hidden md:flex ml-4 items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-600">
                  {currentRequest?.companyName || 'Untitled Session'}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveSession}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              disabled={!currentRequest}
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </header>

        <SessionManager
          isOpen={isSessionManagerOpen}
          onClose={() => setIsSessionManagerOpen(false)}
          onLoadSession={handleLoadSession}
          onNewSession={handleNewSession}
          currentSessionId={currentSessionId}
        />

        {step === AppStep.INPUT && (
          <div className="animate-fade-in-up">
            <InputStep onNext={handleStartProcess} />
          </div>
        )}

        {step === AppStep.PROCESSING && (
          <div className="animate-fade-in">
            <ProcessingStep logs={logs} />
          </div>
        )}

        {step === AppStep.RESULT && (
          <div className="animate-fade-in">
            {(!resultMarkdown || !evaluationMarkdown || isImproving) && (
              <div className="mb-8 p-4 bg-slate-900 rounded-lg border border-slate-700 text-xs font-mono h-32 overflow-y-auto opacity-90 custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-700 pb-1">
                  <Terminal className="w-3 h-3" />
                  <span>Background Agent Activity</span>
                </div>
                {logs.map(l => (
                  <div key={l.id} className="text-slate-400 mb-1">
                    <span className={l.type === 'thinking' ? 'text-blue-400' : l.type === 'success' ? 'text-green-400' : ''}>
                      {l.type.toUpperCase()}:
                    </span> {l.message}
                  </div>
                ))}
                {isImproving && <div className="text-blue-400 animate-pulse mt-2">Agente trabajando (Processing)...</div>}
              </div>
            )}

            <ResultStep
              markdown={resultMarkdown}
              research={researchResult!}
              business={businessAnalysis!}
              design={solutionDesign!}
              evaluation={evaluationMarkdown}
              costEstimation={costEstimation}
              images={proposalImages}
              logs={logs}
              onReset={handleReset}
              onRefineDesign={handleRefineDesign}
              onRefineProposal={handleRefineProposal}
              onExpandKYC={handleExpandKYC}
              onExpandBusiness={handleExpandBusiness}
              onExpandProposal={handleExpandProposal}
              onUpdateContent={handleUpdateContent}
              onUpdateProposal={handleUpdateProposal}
              onManualAudit={handleManualAudit}
              onRegenerateImage={handleRegenerateImage}
              onUpdateDesign={handleUpdateDesignFromChat}
              onEstimateCost={handleEstimateCost}
              onRefineCost={handleRefineCost}
              onSaveCostEstimation={handleSaveCostEstimation}
              onRegenerateInfographic={handleRegenerateInfographic}
              costSettings={costSettings}
              onUpdateCostSettings={handleUpdateCostSettings}
              isRefining={isImproving}
              currentModels={{ text: currentRequest?.textModel || 'gemini-3-pro-preview', image: currentRequest?.imageModel || 'gemini-2.5-flash-image' }}
              onUpdateModels={handleUpdateModels}
              currentDelay={apiDelay}
              onUpdateDelay={handleDelayChange}
              contextDensity={contextDensity}
              onUpdateDensity={setContextDensity}
              onGenerateProposal={handleGenerateProposal}
              language={currentRequest?.language}
              metacognitionAnalysis={metacognitionAnalysis}
              onAnalyzeMetacognition={handleAnalyzeMetacognition}
              onExpandMetacognition={handleExpandMetacognition}
              onRegenerateDesign={handleRegenerateDesign}
              syncPreview={syncPreview}
              onShowSyncPreview={handleShowSyncPreview}
              onApplySync={handleApplySync}
              onCancelSync={handleCancelSync}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left {
            animation: slideInLeft 0.3s ease-out forwards;
        }
        .animate-slide-in-right {
            animation: slideInRight 0.3s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #334155;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );

};

export default App;
