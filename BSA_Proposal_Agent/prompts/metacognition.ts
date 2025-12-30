import { ResearchResult, BusinessAnalysis, SolutionDesign, CostEstimation } from "../types";

/**
 * Metacognition Analyst Agent - ReAct Pattern
 * Reason → Act (Search) → Observe → Refine
 * Analyzes cognitive consonances and dissonances across Customer, Nubiral, and Proposal perspectives
 */
export const MetacognitionPrompts = {
    /**
     * Stage 1: Initial Reasoning and Perspective Identification
     */
    stage1_reason: (
        companyName: string,
        research: ResearchResult,
        business: BusinessAnalysis,
        design: SolutionDesign,
        cost: CostEstimation,
        language: string = "English"
    ) => `
You are a Senior Delivery Strategist and Metacognition Analyst at Nubiral, using the ReAct (Reason-Act-Observe) methodology.

## STAGE 1: REASONING - Identify What We Need to Validate

**Client:** ${companyName}

**Available Data:**
- Research Summary: ${research.summary}
- Strategic Goals: ${research.strategicGoals.join(', ')}
- Business Problem: ${business.problemStatement}
- Pain Points: ${business.keyPainPoints.join(', ')}
- Solution: ${design.architectureOverview}
- Timeline: ${cost.optimalPlan.totalWeeks} weeks
- Team Size: ${cost.optimalPlan.roles.length} roles

## YOUR TASK

REASON about what information you need to SEARCH FOR to validate your metacognitive analysis:

1. **Customer Perspective Validation:**
   - What industry benchmarks should we search for?
   - What typical customer expectations exist for similar projects?
   - What common failure modes should we research?

2. **Competitor/Market Context:**
   - How do competitors approach similar solutions?
   - What are industry best practices?

3. **Risk Validation:**
   - What are common delivery risks for this type of project?
   - What regulatory or compliance considerations exist?

**OUTPUT FORMAT:**
Return a JSON object with your reasoning and search queries:

{
  "reasoning": "Your chain-of-thought about what needs validation...",
  "searchQueries": [
    "query 1 for industry benchmarks",
    "query 2 for customer expectations",
    "query 3 for delivery risks",
    "query 4 for best practices"
  ],
  "hypotheses": {
    "customerAssumptions": ["What we think the customer expects..."],
    "deliveryRisks": ["Potential risks we hypothesize..."],
    "tensionsToValidate": ["Tensions we suspect exist..."]
  }
}

**Language:** ${language}
Think step by step. Be thorough in identifying what needs external validation.
`,

    /**
     * Stage 2: Act - Execute search and synthesize findings
     * This stage uses Google Search grounding
     */
    stage2_act: (
        companyName: string,
        industry: string,
        hypotheses: any,
        language: string = "English"
    ) => `
You are a Metacognition Analyst performing GROUNDED RESEARCH to validate delivery hypotheses.

**Client:** ${companyName}
**Industry:** ${industry}

**Hypotheses to Validate:**
${JSON.stringify(hypotheses, null, 2)}

## YOUR TASK

Use Google Search to find REAL DATA about:
1. Industry benchmarks for cloud transformation projects in ${industry}
2. Common customer expectations and success criteria
3. Typical delivery challenges and failure modes
4. Best practices for stakeholder alignment

**Search and synthesize findings for each hypothesis.**

Return your findings as structured observations that will inform the final analysis.

**Language:** ${language}
`,

    /**
     * Stage 3: Observe and Synthesize - Final Analysis
     */
    stage3_observe: (
        companyName: string,
        research: ResearchResult,
        business: BusinessAnalysis,
        design: SolutionDesign,
        proposal: string,
        cost: CostEstimation,
        searchFindings: string,
        language: string = "English"
    ) => `
You are a Senior Delivery Strategist completing a Metacognitive Analysis using validated, grounded insights.

## CONTEXT

**Client:** ${companyName}

**Research Summary:**
${research.summary}

**Strategic Goals:**
${research.strategicGoals.join(', ')}

**Business Problem:**
${business.problemStatement}

**Solution Overview:**
${design.architectureOverview}

**Key Components:**
${design.keyComponents.join(', ')}

**Timeline:** ${cost.optimalPlan.totalWeeks} weeks
**Team Size:** ${cost.optimalPlan.roles.length} roles

## GROUNDED SEARCH FINDINGS
${searchFindings}

---

## YOUR FINAL ANALYSIS

Using both the project data AND the grounded search findings, produce a comprehensive metacognitive analysis.

### 1. Customer Perspective
Analyze what the CUSTOMER believes, expects, and assumes:
- **statedGoals**: What they explicitly want
- **implicitAssumptions**: What they haven't said but expect (VALIDATE against search findings)
- **riskTolerance**: Based on industry research (Low/Medium/High)
- **organizationalConstraints**: Internal barriers
- **successDefinition**: How THEY will measure success

### 2. Nubiral Perspective
Analyze Nubiral's delivery reality:
- **deliveryStrengths**: What we're genuinely good at
- **potentialGaps**: Skills or experience we might lack (VALIDATE against industry requirements)
- **resourceConsiderations**: Availability challenges
- **commercialFactors**: Pricing pressure, strategic importance
- **experienceRelevance**: Similarity to past projects

### 3. Proposal Perspective
Analyze what the PROPOSAL actually promises:
- **promisedOutcomes**: Explicit deliverables
- **implicitCommitments**: Things implied but not written
- **scopeBoundaries**: What's OUT of scope
- **dependencyAssumptions**: Dependencies on client

### 4. Consonance Matrix
For each dimension, score alignment 1-5 and CITE your reasoning:
- Timeline expectations
- Budget/investment alignment
- Scope understanding
- Success criteria
- Risk perception
- Change management
- Technical complexity perception
- Post-implementation support

### 5. Dissonance Alerts
Identify CRITICAL misalignments with EVIDENCE from search findings:
- severity: Low/Medium/High/Critical
- description, customerExpectation, reality, mitigationStrategy

### 6. Tension Management
Identify tensions with GROUNDED recommendations:
- tension, leftForce, rightForce, currentBalance, recommendation, checkpoints

### 7. Delivery Recommendations
5-10 actionable, GROUNDED recommendations based on search findings.

---

## OUTPUT FORMAT

Return a JSON object:

{
  "customerPerspective": {
    "statedGoals": ["Goal 1", "Goal 2"],
    "implicitAssumptions": ["Assumption 1"],
    "riskTolerance": "Low/Medium/High",
    "organizationalConstraints": ["Constraint 1"],
    "successDefinition": "Success definition text"
  },
  "nubiralPerspective": {
    "deliveryStrengths": ["Strength 1"],
    "potentialGaps": ["Gap 1"],
    "resourceConsiderations": ["Consideration 1"],
    "commercialFactors": ["Factor 1"],
    "experienceRelevance": "Relevance description"
  },
  "proposalPerspective": {
    "promisedOutcomes": ["Outcome 1"],
    "implicitCommitments": ["Commitment 1"],
    "scopeBoundaries": ["Boundary 1"],
    "dependencyAssumptions": ["Dependency 1"]
  },
  "consonanceMatrix": [
      {
          "dimension": "Name of dimension",
          "alignmentScore": number (1-5),
          "notes": "Evidence and reasoning for the score"
      }
  ],
  "dissonanceAlerts": [
      {
          "severity": "Low|Medium|High|Critical",
          "description": "Brief description",
          "customerExpectation": "What they want",
          "reality": "What is realistic",
          "mitigationStrategy": "How to fix it"
      }
  ],
  "tensionManagement": [
      {
          "tension": "e.g., Speed vs Quality",
          "leftForce": "Description of Force A",
          "rightForce": "Description of Force B",
          "currentBalance": "Description of current state",
          "recommendation": "Management strategy",
          "checkpoints": ["Checkpoint 1", "Checkpoint 2"]
      }
  ],
  "deliveryRecommendations": [ ... ],
  "groundingSources": ["List of search sources that informed this analysis"]
}

**IMPORTANT:** 
- All text content MUST be in ${language}.
- CITE specific search findings when making claims about industry norms or best practices.
- Be honest about what the search DID NOT find evidence for.
`,

    /**
     * Expand a specific section with more detail
     */
    expandSection: (
        sectionName: string,
        currentContent: string,
        fullContext: string,
        language: string = "English"
    ) => `
You are expanding a section of a Metacognition Analysis.

**Section to Expand:** ${sectionName}

**Current Content:**
${currentContent}

**Full Analysis Context:**
${fullContext}

Use Google Search to find additional supporting evidence and provide a comprehensive expansion with:
- Deeper analysis with CITED sources
- Industry benchmarks and comparisons
- Specific examples and scenarios
- Actionable insights
- Risk mitigation strategies

Output in markdown format in ${language}.
Minimum 400 words.
    `
};
