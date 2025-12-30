import { ProposalRequest, SolutionDesign, ExpandConfig } from "../types";

export const WriterPrompts = {
    /**
     * Business Analysis Prompt
     */
    analyzeBusinessCase: (companyName: string, businessCase: string, language: string) => `
        Act as a Senior Business Analyst and Digital Transformation Consultant.
        
        Client: ${companyName}
        Input Case: "${businessCase}"
        
        **TASK:**
        Perform a comprehensive Business Case Analysis. 
        Deconstruct the vague input into concrete business drivers, pain points, and value.
        
        **REQUIRED OUTPUT JSON:**
        {
            "problemStatement": "Clear, professional definition of the core problem.",
            "rootCauseAnalysis": ["Root Cause 1", "Root Cause 2"],
            "currentProcessFlaws": ["Inefficiency 1", "Risk 2"],
            "expectedBusinessValue": {
                "roi": "Estimated ROI or financial impact description",
                "efficiencyGains": "Projected efficiency improvements (e.g., % time saved)",
                "otherBenefits": ["Benefit 1", "Benefit 2"]
            },
            "keyPainPoints": ["Pain 1", "Pain 2"],
            "userStories": ["As a [Role], I want [Feature] so that [Benefit]"],
            "mermaidDiagram": "A valid Mermaid.js 'mindmap' OR 'graph TD' (flowchart) describing the Current State (As-Is) or the Problem Hierarchy."
        }
        
        **Language:** ${language}
    `,

    /**
     * Main Proposal Generation Prompt
     */
    generateProposal: (
        request: ProposalRequest,
        design: SolutionDesign,
        filteredContext: string,
        currentDate: string,
        refinedContext: string = ""
    ) => `
        You are a Proposal Manager writing a formal Technical Proposal.
        
        Context:
        - Client: ${request.companyName}
        - Hyperscaler: ${request.hyperScaler}
        - **Language:** ${request.language}
        - **Proposal Date:** ${currentDate}
        - Solution Design: ${JSON.stringify(design)}
        
        **FILTERED RESEARCH & BUSINESS CONTEXT:**
        ${filteredContext}
        
        ${refinedContext}
        
        **STRATEGY PHASE (INTERNAL MONOLOGUE):**
        First, think about the client's perspective based ONLY on the filtered context provided. 
        How does the solution directly mitigate the risks VISIBLE in that context?
        Adopt a tone that is Professional, Confident, and Consultative.
        
        **EXECUTION PHASE:**
        Structure the response strictly in Markdown format.
        Use headers (#, ##, ###) properly.
        Do NOT wrap the entire response in a markdown block.
        
        **CRITICAL INSTRUCTION - DENSITY & DETAIL:**
        - Do NOT summarize or shorten the later sections. 
        - Maintain high density of information for **Governance**, **Success Criteria**, and **Deliverables**.
        - If you are running out of tokens, prioritize depth over brevity.
        - Write as if this is a final contract ready for signature.
        
        IMPORTANT: 
        1. Embed the following Mermaid diagram code within the 'Architecture' section using a mermaid code block:
        \`\`\`mermaid
        ${design.mermaidCode}
        \`\`\`
        2. **MANDATORY**: Generate a Mermaid.js GANTT chart in the 'Work Plan' section to visualize the timeline.
        3. **STRICT PARSER RULE**: In all Mermaid diagrams, never use parentheses ( ) or brackets [ ] inside text labels. Use only alphanumeric text.

        Required Sections (Translate headers to ${request.language}):
        1. **Professional Cover Info** (Title: "Technical Proposal - ${request.companyName}", Date: "${currentDate}", Author: "Nubiral")
        2. **Executive Summary** (Must address the Risks and ROI)
        3. **Background & Objectives**
        4. **Scope of Solution**
        5. **Solution Architecture** (Include WAF Alignment section)
        6. **Work Plan & Timeline** (GANTT) - include detailed cronogram of activities by phases, weeks.
        7. **Deliverables** (Detailed list)
        8. **Roles & Dependencies**
        9. **Success Criteria (KPIs)**
        10. **Governance & Support** (Detailed SDM and SLA tiers)
        11. **Legal & Commercial Terms** (Placeholder)
        
        Do not add any pre-text or post-text. Just the Markdown content.
    `,

    /**
     * Refinement Context for Proposal
     */
    getRefinementContext: (feedback: string) => `
       \n\nCRITICAL INSTRUCTION - REFINEMENT MODE:
       This is an iteration of a previous proposal.
       The previous proposal had CRITICAL issues or a low score OR the user provided specific manual feedback.
       
       Here is the feedback/critique to address:
       "${feedback}"
       
       Please rewrite the proposal to strictly address these gaps while maintaining the parts that were correct.
       Ensure the table of contents and all sections are preserved.
    `,

    /**
     * Proposal Section Expansion Prompt
     */
    expandSection: (
        sectionName: string,
        currentProposal: string,
        businessCase: string,
        language: string,
        config?: ExpandConfig
    ) => {
        let densityInstruction = "Write a DETAILED, high-quality expansion.";
        if (config?.density === 'Low') densityInstruction = "Write a concise summary paragraph (approx 100 words).";
        if (config?.density === 'High') densityInstruction = "Write an extensive, highly detailed section (approx 500-800 words).";

        return `
            You are a Senior Technical Proposal Writer.
            
            **Task:**
            Expand the specific section: "${sectionName}" of the proposal.
            
            **Context:**
            - Original Business Case: "${businessCase}"
            - Current Proposal Context (Partial): ${currentProposal.substring(0, 5000)}... (truncated)
            
            **Instructions:**
            1. ${densityInstruction}
            2. Do NOT summarize. Provide specific technical details, steps, or definitions.
            3. Use professional tone.
            4. Language: ${language}
            5. Output ONLY the content for this section, using appropriate Markdown subsections.

            ${config?.instruction ? `**USER INSTRUCTION:** ${config.instruction}` : ''}
        `;
    }
};
