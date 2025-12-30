import { Schema, Type } from "@google/genai";
import { ProposalRequest, SolutionDesign } from "../types";

// ============================================================================
// MERMAID SAFETY RULES (CRITICAL - APPLIES TO ALL DIAGRAM GENERATION)
// ============================================================================
const MERMAID_SAFETY_RULES = `
**🚨 MERMAID DIAGRAM SYNTAX RULES (CRITICAL - PARSER WILL CRASH IF VIOLATED):**

1. **NEVER use parentheses ( ) in node labels or text.** 
   - ❌ WRONG: A[API Gateway (v2)]
   - ✅ CORRECT: A[API Gateway v2]

2. **NEVER use square brackets [ ] inside labels.**
   - ❌ WRONG: B[Lambda [Python]]
   - ✅ CORRECT: B[Lambda Python]

3. **NEVER use curly braces { } in labels except for Mermaid diamond syntax.**
   - ❌ WRONG: C[Config {prod}]
   - ✅ CORRECT: C[Config prod]

4. **NEVER use quotes inside labels.**
   - ❌ WRONG: D["S3 Bucket"]
   - ✅ CORRECT: D[S3 Bucket]

5. **Use only alphanumeric characters, spaces, hyphens, and underscores in labels.**

6. **For special characters, spell them out:**
   - ❌ WRONG: E[Cost < $100]
   - ✅ CORRECT: E[Cost under 100 USD]

7. **Always use LR (Left-to-Right) direction for architecture diagrams.**

8. **Wrap multi-word labels safely:**
   - Use underscores or hyphens: A[API_Gateway] or A[API-Gateway]
   - Or use simple spacing: A[API Gateway]
`;

export const ArchitectPrompts = {
    /**
     * Pre-Design Research Prompt (Grounding)
     */
    researchServices: (
        request: ProposalRequest,
        businessCase: string
    ) => `
        Role: Cloud Solutions Architect specialized in ${request.hyperScaler}.
        Task: Research and identify the optimal specific cloud services for the client's business case.

        Client Context:
        ${businessCase}

        Requirements:
        1. Identify the 3-4 most critical ${request.hyperScaler} services that solve the core problem.
        2. Verify if there are any specific service constraints or region availability issues (if region is implied).
        3. Find 1 innovative/modern service (e.g., GenAI, Serverless) that adds high value.

        Output:
        A concise bulleted list of recommended services with a one-line justification for each.
    `,

    /**
     * Main Chain-of-Thought Prompt for Solution Design
     */
    designSolution: (
        request: ProposalRequest,
        filteredContext: string,
        groundingData: string,
        refinedContext: string = "",
        feedback?: string
    ) => `
        Act as a Senior Cloud Solutions Architect specialized in ${request.hyperScaler}.
        
        Client: ${request.companyName}
        Target Cloud Provider (HyperScaler): ${request.hyperScaler}
        
        ${feedback ? `
        ### 🚨 CRITICAL FEEDBACK (RE-DESIGN REQUIRED)
        Your previous design was rejected by the Quality Assurance team.
        **Reason:** "${feedback}"
        
        **INSTRUCTION:**
        1. Acknowledge this mistake in your 'thinking_process'.
        2. Modify your design to SPECIFICALLY address the missing requirements listed above.
        3. Ensure the new design remains consistent with the original goals.
        ` : ''}

        **FILTERED CONTEXT:**
        ${filteredContext}

        **CLOUD SERVICE RESEARCH (Grounding):**
        ${groundingData}
        
        **CRITICAL: NEW/UNKNOWN SERVICES HANDLING:**
        If the user or the proposal mentions a service name you don't recognize:
        1. **DO NOT reject it** or claim it doesn't exist.
        2. **USE Google Search** to verify if it's a real or newly announced service.
        3. Cloud providers (AWS, GCP, Azure) announce new services frequently. If the service exists, USE IT.
        4. Only flag a service as questionable if Google Search confirms it doesn't exist.
        
        Task:
        Design a high-level technical solution architecture that addresses the business case described in the context above.
        
        **REASONING REQUIREMENT (CHAIN OF THOUGHT - VERBOSE):**
        Before generating the final architecture, you MUST perform an extensive 'Chain of Thought' analysis.
        This is NOT optional. The 'thinking_process' field should be detailed and comprehensive.
        
        1. **Deconstruct Requirements (5-10 sentences):**
           - List each key requirement from the business case
           - Identify constraints (budget, timeline, skills, compliance)
           - Note any implicit requirements not explicitly stated
        
        2. **Evaluate Alternatives (10-15 sentences):**
           - Describe at least 2-3 potential architectural patterns
           - For EACH alternative, explain:
             * What it would look like
             * Pros and cons
             * Why it might or might not fit
           - Reference specific ${request.hyperScaler} services for each option
        
        3. **Selection Rationale (10-15 sentences):**
           - Explain WHY you chose the final architecture
           - Map to Well-Architected Framework pillars:
             * Operational Excellence: How does this improve operations?
             * Security: What security patterns are applied?
             * Reliability: How is resilience achieved?
             * Performance: What optimizations are included?
             * Cost: Why is this cost-effective?
           - Explain trade-offs accepted and risks acknowledged
        
        4. **Business Alignment (5-10 sentences):**
           - Explicitly connect each major component to a business goal
           - Explain the expected business outcome of the technical choice

        ${MERMAID_SAFETY_RULES}

        **DIAGRAM LAYOUT REQUIREMENT:**
        The Mermaid Diagram MUST flow **Left-to-Right (LR)**.
        - **Left Side:** Customer/User/On-Premise systems
        - **Right Side:** Cloud Solution (${request.hyperScaler})
        - Use clear subgraphs to separate domains (e.g., "On-Premise", "Edge", "Cloud")

        **WELL-ARCHITECTED FRAMEWORK ALIGNMENT:**
        The design MUST explicitly align with the **${request.hyperScaler} Well-Architected Framework** pillars:
        1. Operational Excellence
        2. Security
        3. Reliability
        4. Performance Efficiency
        5. Cost Optimization
        6. Sustainability (if applicable)

        **IMPORTANT: The output content (architectureOverview, rationale, keyComponents) MUST be in: ${request.language}.**
        ${refinedContext}
    `,

    /**
     * Diagram Refinement Prompt (Pass 2)
     */
    refineDiagram: (
        originalCode: string,
        overview: string,
        hyperScaler: string
    ) => `
        Act as a Visualization Expert.
        Refine the following Mermaid.js architecture diagram to be significantly more detailed and professional.

        **Context:**
        Cloud: ${hyperScaler}
        Architecture Overview: ${overview}
        Original Code:
        ${originalCode}

        ${MERMAID_SAFETY_RULES}

        **Improvements Required:**
        1. **Layout:** Ensure strict Left-to-Right (LR) flow.
        2. **Detail:** Add specific service nodes. Use subgraphs for VPCs, Regions, or Availability Zones.
        3. **Protocols:** Add labels to links where appropriate (e.g., HTTPS, gRPC, SQL).
        4. **Style:** Use a clean, modern style definition.
        5. **SAFETY:** Double-check NO parentheses, brackets, or special characters in labels.

        **Output:**
        Return ONLY the raw Mermaid code block. No markdown wrapper.
    `,

    /**
     * Refinement Context Injection
     */
    getRefinementContext: (feedback: string, currentDesign: SolutionDesign) => `
         \n\nCRITICAL INSTRUCTION - REFINEMENT MODE:
         The user has provided specific instructions to modify the current architecture: "${feedback}".
         
         **Current Architecture Overview:** ${currentDesign.architectureOverview}
         **Current Components:** ${currentDesign.keyComponents.join(', ')}
         
         You MUST strictly apply this feedback while maintaining alignment with the Well-Architected Framework.
         Explain in 'thinking_process' what change you are making and why.
    `,

    /**
     * Architecture Expansion Prompt
     */
    expandSection: (
        sectionName: string,
        currentDesign: SolutionDesign,
        language: string,
        config?: any
    ) => `
        Role: Senior Cloud Architect.
        Task: Deep dive expansion of the architecture section: "${sectionName}".

        Current Architecture Context:
        Overview: ${currentDesign.architectureOverview}
        Key Components: ${currentDesign.keyComponents.join(', ')}

        Requirement:
        Provide a detailed technical breakdown of "${sectionName}". 
        Include:
        1. Specific configuration details (e.g., instance types, retention policies).
        2. Security considerations for this specific component/area.
        3. Operational trade-offs.
        4. Why this approach was chosen over alternatives.

        ${config?.instruction ? `**USER INSTRUCTION:** ${config.instruction}` : ''}
        
        Language: ${language}.
        Output: Pure Markdown.
    `,

    /**
     * JSON Schema for Structured Output
     */
    designSchema: {
        type: Type.OBJECT,
        properties: {
            thinking_process: {
                type: Type.STRING,
                description: "VERBOSE internal monologue (minimum 300 words): 1. Requirements deconstruction, 2. Alternatives evaluated with pros/cons, 3. Selection rationale with WAF alignment, 4. Trade-offs acknowledged."
            },
            alternatives_discarded: {
                type: Type.STRING,
                description: "Detailed explanation (minimum 100 words) of which alternative architectures were considered and why they were rejected."
            },
            architectureOverview: {
                type: Type.STRING,
                description: "A comprehensive paragraph (minimum 150 words) describing the technical approach, mentioning specific services and WAF alignment."
            },
            keyComponents: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific cloud services used in the solution."
            },
            rationale: {
                type: Type.STRING,
                description: "Detailed justification (minimum 200 words) explaining WHY this architecture is the best fit, citing specific WAF pillars and business requirements."
            },
            mermaidCode: {
                type: Type.STRING,
                description: "Valid Mermaid.js flowchart definition. CRITICAL: Use LR direction. NEVER use parentheses (), brackets [], or special characters inside node labels. Use only alphanumeric text, spaces, hyphens, and underscores in labels."
            },
            businessMapping: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        businessGoal: { type: Type.STRING, description: "The specific business goal or pain point from the analysis." },
                        technicalSolution: { type: Type.STRING, description: "The specific cloud component or pattern addressing it." },
                        outcome: { type: Type.STRING, description: "The expected technical or business outcome." }
                    },
                    required: ["businessGoal", "technicalSolution", "outcome"]
                },
                description: "Explicit mapping of business goals to technical solutions (minimum 3 mappings)."
            }
        },
        required: ["thinking_process", "alternatives_discarded", "architectureOverview", "keyComponents", "rationale", "mermaidCode", "businessMapping"]
    } as Schema
};
