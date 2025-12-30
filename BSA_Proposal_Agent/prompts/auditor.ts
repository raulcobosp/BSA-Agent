export const AuditorPrompts = {
    /**
     * SMART Evaluation Prompt
     */
    evaluateProposal: (projectName: string, language: string) => `
        Siendo un experto en desarrollar propuesta técnicas como arquitecto de soluciones de tecnología evaluar la propuesta técnica en los siguientes puntos en base al standard de calidad especificado.

        **Respond in this language: ${language}**

        [Professional Cover]: Identifies client, author, version, project name, date.
        [Executive Summary]: Condenses business challenge, pain, value prop, ROI.
        [Background & Objectives]: Understanding of need, SMART objectives.
        [Scope]: Precise definition of scope, acceptance criteria.
        [Solution Architecture]: Technical design, diagrams, justification, **Alignment with Well-Architected Framework**.
        [Work Plan]: Phases, tasks, GANTT chart.
        [Deliverables]: Explicit list of tangible outputs.
        [Roles & Dependencies]: Responsibilities, dependencies.
        [Governance & Support]: SDM, reporting, support plan.
        [Success Criteria]: Quantifiable KPIs (SMART).

        Format of the response (Translate headers to ${language}):
        # Technical Proposal Evaluation: ${projectName}
        ## General Verdict
        * **Summary:** ...
        * **Recommendation:** ...
        ---
        ## Criteria Analysis
        | Criterion | Status | Observations |
        | :--- | :--- | :--- |
        | **Professional Cover** | Met / Partially Met / Not Met | ... |
        | **Executive Summary** | Met / Partially Met / Not Met | ... |
        | **Background & Objectives** | Met / Partially Met / Not Met | ... |
        | **Scope** | Met / Partially Met / Not Met | ... |
        | **Architecture (WAF)** | Met / Partially Met / Not Met | ... |
        | **Work Plan** | Met / Partially Met / Not Met | ... |
        | **Deliverables** | Met / Partially Met / Not Met | ... |
        | **Roles & Dependencies** | Met / Partially Met / Not Met | ... |
        | **Success Criteria** | Met / Partially Met / Not Met | ... |
        | **Governance & Support** | Met / Partially Met / Not Met | ... |
        ---
        | Criterion | Score |
        | :--- | :--- | 
        | ***Note:***|  [CALCULATED_NUMBER] | 
        ---
        ## Strengths
        * ...
        ---
        ## Critical Improvements Needed
        | Priority | Weakness Description | Suggestion |
        | :--- | :--- | :--- |
        | **CRITICAL** | ... | ... |
        | **RECOMMENDED** | ... | ... |

        IMPORTANT: 
        1. The table "Score/Nota" row must look exactly like this: | ***Nota:***|  95 | (strictly pipe, space, bold Nota, pipe, space, number, pipe) - 'Nota' is the keyword for parsing regardless of language.
        2. If there are critical missing parts, ensure they are listed in "Critical Improvements" with priority "CRITICAL".
        3. Return CLEAN Markdown.
    `
};
