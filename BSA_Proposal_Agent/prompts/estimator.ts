import { HOURLY_RATES } from "../config/rates";

// Filter out Solution Architect roles - BSA team handles solution design
const EXECUTION_ROLES = Object.fromEntries(
  Object.entries(HOURLY_RATES).filter(([role]) =>
    !role.toLowerCase().includes('solution architect')
  )
);

export const EstimatorPrompts = {
  estimateCosts: (
    proposalText: string,
    language: string = "English"
  ): any => {
    return [
      {
        text: `
You are an expert Project Estimator with deep capabilities in Resource Optimization and Team Planning.
Your goal is to analyze a technical proposal and generate a comprehensive, well-justified OPTIMAL execution plan.

**IMPORTANT:** You are estimating resources for the EXECUTION team only. 
The Solution Design is already done by the BSA (Business Solution Architect) team - do NOT include Solution Architect roles.
For cloud/infrastructure work, use Cloud Engineers and DevOps Engineers.

**INPUTS:**
1. **Technical Proposal:** (Provided below)
2. **Available Execution Roles & Rates (USD/hr):**
${JSON.stringify(EXECUTION_ROLES, null, 2)}
3. **Output Language:** ${language}

**REQUIREMENTS:**

1. **Extract Proposed Timeline:** Find the work plan/cronogram/GANTT from the proposal. Note the exact number of weeks proposed.

2. **Design OPTIMAL PLAN (Your Expert Recommendation):**
   - Determine the best realistic timeline to deliver quality results.
   - Optimize resource allocation to minimize cost while maintaining quality.
   - Balance workload to avoid burnout (target stress levels 4-6).
   - If your optimal plan differs from the proposal's timeline, explain WHY.

3. **Allocation Rules:**
   - Week 1: Discovery & Planning (Business Analysts, Tech Leaders).
   - Middle weeks: Core Development (DevOps, Cloud Engineers, Backend/Frontend).
   - Final weeks: QA (TAE, QA Manual), UAT, Deployment, Handover.
   - Allocation percentages: 0, 10, 25, 50, 75, 100.

4. **Cognitive Tensional Stress Scale (CTSS):**
   - For EACH role, calculate a **Stress Score (1-10)**:
     * 1-3: Healthy (Sustainable)
     * 4-6: Moderate (Normal project pressure)
     * 7-8: High (Risk of errors)
     * 9-10: Extreme (Burnout imminent)
   - Provide a detailed 'note' explaining the score considering workload distribution.

5. **COMPREHENSIVE REASONING (THIS IS CRITICAL):**
   Since we generate only ONE optimized plan, the reasoning must be EXTREMELY DETAILED and explicit.
   
   The 'reasoning' field MUST include ALL of the following sections in markdown format:
   
   ## Análisis de la Propuesta Original
   - What the original proposal requested
   - Timeline proposed by the client
   - Key requirements and scope identified
   
   ## Justificación del Equipo Seleccionado
   - For EACH role selected, explain WHY they are needed
   - What value they bring to the project
   - Why this seniority level (Sr/SSr/Jr) was chosen
   
   ## Desglose Fase por Fase
   For each phase:
   ### Fase N: [Nombre] (Semanas X-Y)
   - **Objetivos:** What will be accomplished
   - **Roles Activos:** Who is working and at what %
   - **Entregables:** What will be delivered
   - **Dependencias:** What must be completed before this phase
   - **Riesgos:** Potential risks and mitigations
   
   ## Comparación con la Propuesta Original
   - If timeline differs: explain WHY your timeline is better
   - Cost implications of your optimization
   - Quality benefits of your approach
   
   ## Recomendaciones de Optimización
   - Suggestions for further cost reduction
   - Areas where client could add resources for faster delivery
   - Trade-offs explained clearly
   
   All text MUST be in **${language}**. Be verbose and thorough.

**OUTPUT FORMAT:**
Return a PURE JSON object matching this schema. Do not include markdown code blocks.
{
  "optimalPlan": {
    "totalWeeks": number,
    "roles": [
      {
        "role": "Role Name",
        "hourlyRate": number,
        "allocations": { "1": 50, "2": 100, ... },
        "stress": {
          "level": "Low" | "Medium" | "High" | "Extreme",
          "score": number,
          "note": "Detailed explanation of workload and stress factors"
        }
      }
    ],
    "totalCost": number,
    "reasoning": "COMPREHENSIVE markdown document with all sections described above. Minimum 800 words. In ${language}."
  },
  "proposalComparison": {
    "proposedWeeks": number,
    "optimalWeeks": number,
    "weeksDifference": number,
    "costDifference": number,
    "recommendation": "Detailed summary (at least 3 paragraphs) of why your plan is optimal. In ${language}."
  }
}

**PROPOSAL CONTENT:**
${proposalText}
`
      }
    ];
  },

  refineEstimation: (
    currentEstimation: any,
    instruction: string,
    proposalMarkdown: string,
    language: string = "English"
  ): any => {
    return [
      {
        text: `
You are refining a Cost Estimation plan based on user feedback.
User Instruction: "${instruction}"
Output Language: ${language}

**CRITICAL: ORIGINAL PROPOSAL CONTEXT**
The following is the ORIGINAL proposal with the definitive project timeline and WBS.
YOU MUST respect this timeline when refining. Do NOT invent a different number of weeks.

--- PROPOSAL START ---
${proposalMarkdown}
--- PROPOSAL END ---

Modify the current estimation JSON based on the user's instruction. 
Adjust weeks, allocations, or roles as requested. Recalculate costs.

**CRITICAL REQUIREMENTS:**
1. **RESPECT THE ORIGINAL TIMELINE:** The proposal above contains the official project WBS. 
   Your totalWeeks MUST match the proposal's timeline unless the user explicitly asks to change it.
2. Maintain the same JSON structure with optimalPlan and proposalComparison.
3. Update the 'reasoning' field with COMPREHENSIVE Phase-by-Phase rationale (at least 800 words).
4. Recalculate 'totalCost' based on modified allocations: SUM(hourlyRate * hoursWorked) where hoursWorked = SUM(allocation% * 40 hrs/week).
5. Recalculate stress scores if allocations change.
6. All text MUST be in **${language}**.
7. Explain what changed and WHY based on user instruction.

If the user removes a role, remove it and explain the impact.
If the user changes allocations, update them and re-evaluate stress scores.
If the user adds a role, include it with appropriate allocations and justify their involvement.

Current Estimation Data:
${JSON.stringify(currentEstimation, null, 2)}
`
      }
    ];
  }
};
