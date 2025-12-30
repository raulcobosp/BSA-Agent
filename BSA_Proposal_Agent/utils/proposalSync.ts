import { CostEstimation } from '../types';

/**
 * Generate the "Equipo Nubiral" section from cost estimation roles
 * Does NOT include allocation percentages or individual rates per user request
 */
export const generateTeamMarkdown = (cost: CostEstimation, language: string = 'Spanish'): string => {
    const roles = cost.optimalPlan?.roles || [];

    if (roles.length === 0) return '';

    const isSpanish = language.toLowerCase().includes('spanish') || language.toLowerCase().includes('español');

    const headers = isSpanish
        ? { section: 'Equipo Nubiral', role: 'Rol', responsibility: 'Responsabilidad Clave' }
        : { section: 'Nubiral Team', role: 'Role', responsibility: 'Key Responsibility' };

    let md = `## 4. ${headers.section}\n\n`;
    md += `| ${headers.role} | ${headers.responsibility} |\n`;
    md += `|------|-------------------------|\n`;

    for (const role of roles) {
        // Generate a generic responsibility based on role name
        const responsibility = getResponsibilityForRole(role.role, isSpanish);
        md += `| ${role.role} | ${responsibility} |\n`;
    }

    return md;
};

/**
 * Generate the WBS section from cost estimation
 * Uses totalWeeks and reasoning to create phase breakdown
 */
export const generateWBSMarkdown = (cost: CostEstimation, language: string = 'Spanish'): string => {
    const totalWeeks = cost.optimalPlan?.totalWeeks || 8;
    const reasoning = cost.optimalPlan?.reasoning || '';

    const isSpanish = language.toLowerCase().includes('spanish') || language.toLowerCase().includes('español');

    const headers = isSpanish
        ? { section: 'Cronograma de Ejecución', phase: 'Fase', week: 'Semana', activities: 'Actividades Principales', deliverables: 'Entregables' }
        : { section: 'Execution Timeline', phase: 'Phase', week: 'Week', activities: 'Main Activities', deliverables: 'Deliverables' };

    // Try to extract phases from reasoning
    const phases = extractPhasesFromReasoning(reasoning, totalWeeks, isSpanish);

    let md = `## 5. ${headers.section}\n\n`;
    md += `**Duración Total:** ${totalWeeks} ${isSpanish ? 'semanas' : 'weeks'}\n\n`;
    md += `| ${headers.phase} | ${headers.week} | ${headers.activities} | ${headers.deliverables} |\n`;
    md += `|------|---------|------------------------|-------------|\n`;

    for (const phase of phases) {
        md += `| ${phase.name} | ${phase.weeks} | ${phase.activities} | ${phase.deliverables} |\n`;
    }

    return md;
};

/**
 * Replace a section in the proposal markdown
 * Finds section by title regex and replaces content until next ## or end
 */
export const replaceProposalSection = (
    markdown: string,
    sectionPattern: string,
    newContent: string
): string => {
    // Match section header (## N. Title or ## Title) and everything until next ## or end
    const regex = new RegExp(
        `(##\\s*\\d*\\.?\\s*${sectionPattern}[^#]*?)(?=##\\s|$)`,
        'is'
    );

    if (regex.test(markdown)) {
        return markdown.replace(regex, newContent + '\n\n');
    }

    // Section not found - append at end
    return markdown + '\n\n' + newContent;
};

/**
 * Generate responsibility description based on role name
 */
const getResponsibilityForRole = (roleName: string, isSpanish: boolean): string => {
    const role = roleName.toLowerCase();

    const responsibilities: Record<string, { es: string; en: string }> = {
        'tech lead': { es: 'Liderazgo técnico y revisión de código', en: 'Technical leadership and code review' },
        'cloud engineer': { es: 'Implementación de infraestructura cloud', en: 'Cloud infrastructure implementation' },
        'devops': { es: 'CI/CD, automatización y monitoreo', en: 'CI/CD, automation and monitoring' },
        'data engineer': { es: 'Pipelines de datos y ETL', en: 'Data pipelines and ETL' },
        'backend': { es: 'Desarrollo de APIs y servicios', en: 'API and service development' },
        'frontend': { es: 'Desarrollo de interfaz de usuario', en: 'User interface development' },
        'data scientist': { es: 'Modelos ML/AI y análisis avanzado', en: 'ML/AI models and advanced analytics' },
        'security': { es: 'Seguridad, compliance y hardening', en: 'Security, compliance and hardening' },
        'qa': { es: 'Testing y aseguramiento de calidad', en: 'Testing and quality assurance' },
        'delivery': { es: 'Gestión de proyecto y stakeholders', en: 'Project and stakeholder management' },
        'sdm': { es: 'Gestión de entrega y coordinación', en: 'Delivery management and coordination' },
    };

    for (const [key, value] of Object.entries(responsibilities)) {
        if (role.includes(key)) {
            return isSpanish ? value.es : value.en;
        }
    }

    return isSpanish ? 'Soporte técnico especializado' : 'Specialized technical support';
};

/**
 * Extract phases from reasoning text or generate default phases
 */
const extractPhasesFromReasoning = (
    reasoning: string,
    totalWeeks: number,
    isSpanish: boolean
): Array<{ name: string; weeks: string; activities: string; deliverables: string }> => {

    // Try to find phases in reasoning (look for "Fase N:" or "Phase N:")
    const phaseRegex = /(?:fase|phase)\s*(\d+)[:\s]*([^\n]+)/gi;
    const matches = [...reasoning.matchAll(phaseRegex)];

    if (matches.length >= 3) {
        // Use extracted phases
        return matches.map((m, idx) => ({
            name: `${isSpanish ? 'Fase' : 'Phase'} ${m[1]}`,
            weeks: `Sem ${idx + 1}-${Math.min(idx + 2, totalWeeks)}`,
            activities: m[2].substring(0, 60).trim(),
            deliverables: isSpanish ? 'Ver detalle' : 'See details'
        }));
    }

    // Generate default phases based on totalWeeks
    const defaultPhases = isSpanish ? [
        { name: 'Fase 1: Inicio', activities: 'Kick-off, definición de alcance', deliverables: 'Project Charter' },
        { name: 'Fase 2: Diseño', activities: 'Arquitectura, diseño técnico', deliverables: 'Documento de Diseño' },
        { name: 'Fase 3: Desarrollo', activities: 'Implementación core', deliverables: 'Código funcional' },
        { name: 'Fase 4: Integración', activities: 'Integración y pruebas', deliverables: 'Sistema integrado' },
        { name: 'Fase 5: Validación', activities: 'UAT y ajustes', deliverables: 'Aprobación UAT' },
        { name: 'Fase 6: Go-Live', activities: 'Despliegue y estabilización', deliverables: 'Sistema en producción' },
        { name: 'Fase 7: Cierre', activities: 'Documentación y handover', deliverables: 'Documentación final' },
    ] : [
        { name: 'Phase 1: Initiation', activities: 'Kick-off, scope definition', deliverables: 'Project Charter' },
        { name: 'Phase 2: Design', activities: 'Architecture, technical design', deliverables: 'Design Document' },
        { name: 'Phase 3: Development', activities: 'Core implementation', deliverables: 'Working code' },
        { name: 'Phase 4: Integration', activities: 'Integration and testing', deliverables: 'Integrated system' },
        { name: 'Phase 5: Validation', activities: 'UAT and adjustments', deliverables: 'UAT Approval' },
        { name: 'Phase 6: Go-Live', activities: 'Deployment and stabilization', deliverables: 'Production system' },
        { name: 'Phase 7: Closure', activities: 'Documentation and handover', deliverables: 'Final documentation' },
    ];

    // Distribute phases across totalWeeks
    const phasesToUse = defaultPhases.slice(0, Math.min(totalWeeks, defaultPhases.length));
    const weeksPerPhase = Math.ceil(totalWeeks / phasesToUse.length);

    return phasesToUse.map((phase, idx) => {
        const startWeek = idx * weeksPerPhase + 1;
        const endWeek = Math.min((idx + 1) * weeksPerPhase, totalWeeks);
        return {
            ...phase,
            weeks: startWeek === endWeek ? `Sem ${startWeek}` : `Sem ${startWeek}-${endWeek}`
        };
    });
};

/**
 * Preview type for showing changes before applying
 */
export interface ProposalSyncPreview {
    teamSection: string;
    wbsSection: string;
    originalTeamSection: string;
    originalWbsSection: string;
}

/**
 * Generate preview of changes without applying them
 */
export const generateSyncPreview = (
    currentMarkdown: string,
    cost: CostEstimation,
    language: string
): ProposalSyncPreview => {
    // Extract original sections
    const teamRegex = /##\s*\d*\.?\s*(?:Equipo Nubiral|Nubiral Team)[^#]*/is;
    const wbsRegex = /##\s*\d*\.?\s*(?:Cronograma|Desglose|Timeline|Execution)[^#]*/is;

    const originalTeamMatch = currentMarkdown.match(teamRegex);
    const originalWbsMatch = currentMarkdown.match(wbsRegex);

    return {
        teamSection: generateTeamMarkdown(cost, language),
        wbsSection: generateWBSMarkdown(cost, language),
        originalTeamSection: originalTeamMatch?.[0] || '[Section not found]',
        originalWbsSection: originalWbsMatch?.[0] || '[Section not found]'
    };
};

/**
 * Apply the sync - replace sections in proposal
 */
export const applySyncToProposal = (
    currentMarkdown: string,
    cost: CostEstimation,
    language: string
): string => {
    const teamSection = generateTeamMarkdown(cost, language);
    const wbsSection = generateWBSMarkdown(cost, language);

    let updated = replaceProposalSection(currentMarkdown, '(?:Equipo Nubiral|Nubiral Team)', teamSection);
    updated = replaceProposalSection(updated, '(?:Cronograma|Desglose de Actividades|Timeline|Execution Timeline)', wbsSection);

    return updated;
};
