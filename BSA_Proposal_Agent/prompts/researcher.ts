import { ExpandConfig } from "../types";

export const ResearcherPrompts = {
    /**
     * Main ReAct Prompt for KYC Research
     */
    conductResearch: (companyName: string, language: string) => `
      Perform a deep strategic "Know Your Customer" (KYC) research on the company: "${companyName}".
      I need to create a technical proposal for them.
      
      Conduct a DETAILED analysis based on these specific dimensions:
      1. **Industry Landscape:** Current trends, size, and market dynamics.
      2. **Challenges & Risks:** 
         - Internal/External Challenges.
         - **Prohibitions/Regulations:** Specific regulatory constraints (e.g., GDPR, HIPAA, Local Financial regulations).
         - **Consequences of Inaction:** What specifically happens if they fail to innovate?
      3. **Stakeholders:** Key decision makers (CIO, CTO) and their strategic agenda.
      4. **Hyperscaler Affinity:** Detailed map of their current cloud usage (AWS/Azure/GCP) and relationship status.
      5. **Maturity Assessment:** 
         - Business Capability Maturity vs Global Leaders.
         - Enterprise Architecture Maturity.
         - **GenAI Maturity:** Specifically analyze their adoption of Generative AI compared to the industry standard.
      6. **Competition:** Global vs Local competitors.
      7. **SWOT:** Strengths, Weaknesses, Opportunities, Threats.

      **IMPORTANT: The output MUST be in the following language: ${language}.**

      Output the result strictly as a valid JSON object with the following schema:
      {
        "summary": "A 2-3 sentence overview of the company.",
        "strategicGoals": ["Goal 1", "Goal 2", "Goal 3"],
        "detailedAnalysis": {
            "industryLandscape": "Description of industry context.",
            "challengesAndRisks": ["Challenge 1", "Consequence of Inaction 1", "Regulatory Prohibition 1"],
            "regulatoryConstraints": ["Reg 1", "Reg 2"],
            "keyStakeholders": ["Role - Concern"],
            "hyperscalerAffinity": "Description of current cloud stance.",
            "businessMaturity": "Assessment vs leaders.",
            "eaMaturity": "Assessment of Architecture.",
            "genAiMaturity": "Specific assessment of GenAI adoption.",
            "competitors": {
                "global": ["Comp 1", "Comp 2"],
                "local": ["Comp 1", "Comp 2"]
            },
            "swot": {
                "strengths": ["..."],
                "weaknesses": ["..."],
                "opportunities": ["..."],
                "threats": ["..."]
            }
        }
      }
    `,

    /**
     * Self-Correction Prompt when data is missing
     */
    repairResearch: (companyName: string, missingField: string, currentData: string, language: string) => `
        I previously researched "${companyName}" but missed critical details regarding: ${missingField}.
        
        **TASK:**
        Perform a targeted search specifically for "${missingField}" for ${companyName}.
        
        **CONTEXT:**
        Previous partial data: ${currentData}
        
        **OUTPUT:**
        Return the FULL completed JSON object, merging the new findings into the existing structure.
        Ensure 'challengesAndRisks' and 'competitors' are populated.
        Language: ${language}.
    `,

    /**
     * Deep Dive Expansion Prompt
     */
    expandSection: (
        companyName: string, 
        sectionName: string, 
        currentContext: string, 
        language: string, 
        config?: ExpandConfig
    ) => {
        let densityInstruction = "Provide a comprehensive report.";
        if (config?.density === 'Low') densityInstruction = "Provide a concise 2-paragraph summary.";
        if (config?.density === 'High') densityInstruction = "Provide an extremely detailed, in-depth analysis with multiple subsections.";

        return `
            Perform a targeted deep-dive research for the company "${companyName}".
            Focus EXCLUSIVELY on the topic: "${sectionName}".
            
            Current known context: ${currentContext}

            Task:
            1. Search for detailed, up-to-date information regarding ${sectionName}.
            2. ${densityInstruction}
            3. If applicable, use Markdown tables to structure data.
            4. If applicable, suggest a Mermaid.js chart (e.g., pie chart for market share, graph for trends) and include the code block.
            
            ${config?.instruction ? `**USER INSTRUCTION:** ${config.instruction}` : ''}

            **Language:** ${language}
            Output format: Pure Markdown.
        `;
    }
};
