import { ResearchResult, BusinessAnalysis, SolutionDesign, CostEstimation, MetacognitionAnalysis } from "../types";

export const VisualizerPrompts = {
    /**
     * Generate Prompt for a Single Image Type (Legacy/Cover)
     */
    generateImage: (
        type: 'cover' | 'concept' | 'infographic' | 'business_technical',
        companyName: string,
        contextData: any,
        instruction: string = "",
        language: string = "English"
    ) => {
        let prompt = "";

        // Construct base prompt based on type
        if (type === 'cover') {
            // Extract rich context for a visionary cover image
            const industry = contextData.industry || contextData.summary?.split(' ').slice(0, 3).join(' ') || 'Industry';
            const strategicGoals = Array.isArray(contextData.strategicGoals)
                ? contextData.strategicGoals.slice(0, 3).join(', ')
                : 'Digital Transformation';
            const cloudProvider = contextData.hyperScaler || 'Cloud';
            const businessVision = contextData.businessCase || contextData.problemStatement || 'Business Optimization';

            prompt = `
                Create a visionary, premium corporate cover image for a technology proposal.

                **The Story to Visualize:**
                - Company: ${companyName}
                - Vision/Transformation Goal: ${strategicGoals}
                - Business Challenge Being Solved: ${businessVision}
                - Future Enabled By: ${cloudProvider} cloud technology

                **Visual Direction:**
                Create an abstract, inspirational visualization that represents:
                - The successful FUTURE state after implementation
                - Digital transformation and business growth
                - Innovation, efficiency, and competitive advantage
                - The journey from current challenges to a bright future

                **Style:**
                - Premium, executive-level, presentation-worthy
                - Abstract/conceptual (not literal office photos)
                - Modern gradients, dynamic shapes, technology motifs
                - Incorporate subtle cloud/data flow elements
                - Color palette: ${cloudProvider === 'AWS' ? 'Orange, Black, White' : cloudProvider === 'GCP' ? 'Blue, Green, Yellow, Red' : cloudProvider === 'Azure' ? 'Blue, Teal, Purple' : 'Blue, Cyan, White'} tones
                - High-end, polished, 4K quality

                **Critical Rules:**
                - NO TEXT, NO LOGOS, NO WORDS
                - NO literal depictions of people, offices, or computers
                - Focus on ABSTRACT representation of transformation and success
            `;
        } else if (type === 'concept') {
            prompt = `
                Futuristic isometric infographic representing: ${contextData.businessCase || ''}.
                Style: Modern, Clean, Cloud architecture visualization, glowing nodes.
                NO TEXT.
            `;
        } else if (type === 'infographic') {
            prompt = `
                A highly detailed corporate data visualization infographic for ${companyName}.
                Data Points: ${JSON.stringify(contextData.analysis || {})}.
                Style: High-end corporate dashboard, 3D charts, sleek graphs, professional blue and white color scheme.
                **Language:** If any text labels are needed, use ${language}.
            `;
        } else if (type === 'business_technical') {
            prompt = `
                Create a visually stunning, ultra-modern, professional infographic for a slide deck.
                Company: ${companyName}
                It must synthesize these key points into a cohesive visual story:
                - Business Case: ${contextData.businessCase}
                - Architecture Overview: ${contextData.design.architectureOverview}
                - Key Components: ${contextData.design.keyComponents.join(', ')}
                Use a clean, corporate, flat design style. Dominated by blues and purples.
                **Language:** If any text labels are needed, use ${language}.
            `;
        }

        // Append specific user instructions (Regeneration modifier)
        if (instruction) {
            prompt += `\n\n**CRITICAL MODIFICATION INSTRUCTION:** ${instruction}\nAdjust the image strictly according to this modification.`;
        }

        return prompt;
    },

    /**
     * KYC Research Infographic - Generated after conductResearch
     */
    generateKYCInfographic: (companyName: string, research: ResearchResult, language: string = "English") => {
        // Collect expanded content if available
        const expandedSections = research.expandedContent && Object.keys(research.expandedContent).length > 0
            ? Object.entries(research.expandedContent)
                .map(([section, content]) => `### ${section} (Expanded):\n${content}`)
                .join('\n\n')
            : '';

        return `
        Create a professional corporate intelligence infographic for "${companyName}".
        
        **Data to Visualize:**
        - Company Summary: ${research.summary}
        - Strategic Goals: ${research.strategicGoals.join(', ')}
        - SWOT Analysis:
          * Strengths: ${research.detailedAnalysis.swot?.strengths?.join(', ') || 'N/A'}
          * Weaknesses: ${research.detailedAnalysis.swot?.weaknesses?.join(', ') || 'N/A'}
          * Opportunities: ${research.detailedAnalysis.swot?.opportunities?.join(', ') || 'N/A'}
          * Threats: ${research.detailedAnalysis.swot?.threats?.join(', ') || 'N/A'}
        - Competitors (Global): ${research.detailedAnalysis.competitors?.global?.join(', ') || 'N/A'}
        - Competitors (Local): ${research.detailedAnalysis.competitors?.local?.join(', ') || 'N/A'}
        - Cloud Affinity: ${research.detailedAnalysis.hyperscalerAffinity}
        - GenAI Maturity: ${research.detailedAnalysis.genAiMaturity}

        ${expandedSections ? `**ADDITIONAL EXPANDED INSIGHTS (Include these in visualization):**\n${expandedSections}` : ''}

        **Style Requirements:**
        - High-end corporate dashboard aesthetic
        - Use a SWOT quadrant diagram prominently
        - Include competitor positioning visualization
        - Color scheme: Professional blues, teals, and whites
        - Clean typography, data-driven layout
        
        **Language:** Generate all visual labels, annotations, and any text elements in ${language}.
    `;
    },

    /**
     * Business Analysis Infographic - Generated after analyzeBusinessCase
     */
    generateBusinessInfographic: (analysis: BusinessAnalysis, language: string = "English") => {
        // Collect expanded content if available
        const expandedSections = analysis.expandedContent && Object.keys(analysis.expandedContent).length > 0
            ? Object.entries(analysis.expandedContent)
                .map(([section, content]) => `### ${section} (Expanded):\n${content}`)
                .join('\n\n')
            : '';

        return `
        Create a business case analysis infographic.

        **Data to Visualize:**
        - Core Problem: ${analysis.problemStatement}
        - Root Causes: ${analysis.rootCauseAnalysis.join(', ')}
        - Key Pain Points: ${analysis.keyPainPoints.join(', ')}
        - Expected ROI: ${analysis.expectedBusinessValue.roi}
        - Efficiency Gains: ${analysis.expectedBusinessValue.efficiencyGains}
        - Additional Benefits: ${analysis.expectedBusinessValue.otherBenefits.join(', ')}

        ${expandedSections ? `**ADDITIONAL EXPANDED INSIGHTS (Include these in visualization):**\n${expandedSections}` : ''}

        **Style Requirements:**
        - Professional problem-solution flow visualization
        - Highlight ROI prominently with upward trend graphics
        - Use pain point icons with visual hierarchy
        - Root cause analysis as a fishbone or tree diagram style
        - Color scheme: Business greens and blues indicating growth
        - Clean, executive-ready presentation style
        
        **Language:** Generate all visual labels, annotations, and any text elements in ${language}.
    `;
    },

    /**
     * Architecture Infographic - Generated after designSolution
     */
    generateArchitectureInfographic: (design: SolutionDesign, hyperScaler: string, language: string = "English") => `
        Create a cloud architecture solution infographic.

        **Data to Visualize:**
        - Cloud Provider: ${hyperScaler}
        - Architecture Overview: ${design.architectureOverview}
        - Key Components: ${design.keyComponents.join(', ')}
        - Design Rationale: ${design.rationale}

        **Style Requirements:**
        - Modern cloud architecture visualization
        - Isometric or flat design with connected nodes
        - Show component relationships with flowing connections
        - Include cloud provider iconography style (${hyperScaler})
        - Well-Architected Framework pillars as visual badges
        - Color scheme: Cloud blues, purples, with accent highlights
        - Professional, technical, but visually appealing
        
        **Language:** Generate all visual labels, annotations, and any text elements in ${language}.
    `,

    /**
     * Cost Estimation Infographic - Generated after generateCostEstimation
     */
    generateCostInfographic: (estimation: CostEstimation, language: string = "English") => {
        const plan = estimation.optimalPlan;
        const comparison = estimation.proposalComparison;

        const rolesSummary = plan.roles.map(r => `${r.role}`).join(', ');

        return `
            Create a professional project execution cost infographic.

            **Data to Visualize:**
            - Optimal Plan Timeline: ${plan.totalWeeks} weeks
            - Total Investment: $${plan.totalCost.toLocaleString()}
            - Team Composition: ${rolesSummary}
            ${comparison ? `- Proposal Comparison: ${comparison.proposedWeeks} weeks proposed → ${comparison.optimalWeeks} weeks optimized (${comparison.weeksDifference > 0 ? 'Saved ' + comparison.weeksDifference + ' weeks' : 'Added ' + Math.abs(comparison.weeksDifference) + ' weeks for quality'})` : ''}
            ${comparison ? `- Optimization Insight: ${comparison.recommendation}` : ''}

            **Visual Elements to Create:**
            - Timeline visualization as horizontal Gantt-style bar
            - Role allocation heatmap showing weekly intensities
            - Cost breakdown by phase or role (pie/donut chart)
            - Key metrics dashboard (total weeks, total cost, team size)
            ${comparison?.weeksDifference !== 0 ? '- Highlight optimization difference with visual callout' : ''}

            **Style Requirements:**
            - Professional project management dashboard aesthetic
            - Color scheme: Professional blues, with green for efficiency gains
            - Executive-ready, clean, data-dense visualization
            - No placeholder text - use actual data provided
            
            **Language:** Generate all visual labels and annotations in ${language}.
        `;
    },

    /**
     * Metacognition Analysis Infographic
     */
    generateMetacognitionInfographic: (analysis: MetacognitionAnalysis, companyName: string, language: string = "English") => {
        const consonanceCount = analysis.consonanceMatrix?.filter(c => c.alignmentScore >= 4).length || 0;
        const dissonanceCount = analysis.dissonanceAlerts?.length || 0;
        const criticalCount = analysis.dissonanceAlerts?.filter(d => d.severity === 'Critical' || d.severity === 'High').length || 0;
        const tensionCount = analysis.tensionManagement?.length || 0;

        return `
            Create a strategic Metacognition Analysis infographic for a cloud project proposal.

            **Context:**
            - Client: ${companyName}
            - This analysis maps cognitive alignments and gaps across Customer, Nubiral (delivery team), and Proposal perspectives

            **Key Metrics to Visualize:**
            - Total Consonances (Alignments): ${consonanceCount} strong alignments
            - Total Dissonances (Gaps): ${dissonanceCount} identified gaps
            - Critical/High Severity Alerts: ${criticalCount}
            - Tensions to Manage: ${tensionCount}

            **Visual Concept:**
            Create a Venn diagram or triangle visualization with three overlapping circles:
            - 🟢 CUSTOMER PERSPECTIVE (Teal/Cyan)
            - 🔵 PROPOSAL PERSPECTIVE (Blue)
            - 🟣 NUBIRAL PERSPECTIVE (Purple)

            In the overlapping areas, show:
            - Center (all three overlap): Perfect alignment zone
            - Two-way overlaps: Partial consonance
            - Non-overlapping edges: Potential dissonance zones

            **Additional Visual Elements:**
            - Heat indicators for alignment scores (green=aligned, yellow=partial, red=conflict)
            - Tension meter/balance icons for key tensions
            - Alert badges for critical dissonances
            - Recommendation callouts

            **Style Requirements:**
            - Executive consulting aesthetic (McKinsey/BCG quality)
            - Clean, strategic, analytical
            - Professional color palette: Teals, Blues, Purples
            - Suitable for steering committee or kickoff presentation
            - No placeholder text - use actual data

            **Language:** Generate all visual labels in ${language}.
        `;
    }
};

