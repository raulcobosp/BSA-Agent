import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
// @ts-ignore
import { marked } from 'marked';
import { Download, RefreshCw, Check, Search, BrainCircuit, FileText, ExternalLink, Server, Lightbulb, Target, Globe, Award, Loader2, MessageSquarePlus, Send, Zap, Users, BarChart3, ShieldAlert, Terminal, AlertTriangle, Sparkles, FileType, FileCode, RotateCcw, Settings, Bot, Image as ImageIcon, Clock, Layers, PlayCircle, Maximize2, FilePenLine, X, Edit3, Smile, Meh, Frown, Flame, Trash2, Plus, ArrowUpRight } from 'lucide-react';
import { ResearchResult, SolutionDesign, ProposalImages, AgentLog, ContextDensity, ExpandConfig, BusinessAnalysis, CostEstimation, CostSettings, MetacognitionAnalysis } from '../types';
import ChatWidget from './ChatWidget';
import SmartExpandPopover from './SmartExpandPopover';
import { HOURLY_RATES } from '../config/rates';

interface ResultStepProps {
    markdown: string;
    research: ResearchResult | null;
    business: BusinessAnalysis | null;
    design: SolutionDesign | null;
    evaluation: string;
    images?: ProposalImages | null;
    logs: AgentLog[];
    onReset: () => void;
    onRefineDesign?: (feedback: string) => void;
    onRefineProposal?: (feedback: string) => void;
    onExpandKYC?: (section: string, config: ExpandConfig) => void;
    onExpandBusiness?: (section: string, config: ExpandConfig) => void;
    onExpandDesign?: (section: string, config: ExpandConfig) => void;
    onExpandProposal?: (section: string, config: ExpandConfig) => void;
    onUpdateContent?: (type: 'kyc' | 'business' | 'design', section: string, content: string | null) => void;
    onUpdateProposal?: (newMarkdown: string) => void;
    onManualAudit?: () => void;
    onRegenerateImage?: (type: 'cover' | 'concept' | 'infographic' | 'business_technical', instruction?: string) => Promise<void>;
    onUpdateDesign?: (design: Partial<SolutionDesign>) => Promise<void>;
    isRefining?: boolean;
    currentModels?: { text: string; image: string };
    onUpdateModels?: (text: string, image: string) => void;
    currentDelay?: number;
    onUpdateDelay?: (seconds: number) => void;
    contextDensity?: ContextDensity;
    costEstimation?: CostEstimation | null;
    onEstimateCost?: () => void;
    onRefineCost?: (instruction: string) => void;
    onSaveCostEstimation?: (estimation: CostEstimation) => void;
    onRegenerateInfographic?: (type: 'kyc' | 'business' | 'architecture' | 'cost' | 'metacognition') => void;
    costSettings?: CostSettings;
    onUpdateCostSettings?: (settings: CostSettings) => void;
    onUpdateDensity?: (density: ContextDensity) => void;
    onGenerateProposal?: () => void;
    language?: string;
    metacognitionAnalysis?: MetacognitionAnalysis | null;
    onAnalyzeMetacognition?: () => void;
    onExpandMetacognition?: (section: string, config: ExpandConfig) => void;
    onRegenerateDesign?: () => Promise<void>;
    // Sync Cost -> Proposal
    syncPreview?: { teamSection: string; wbsSection: string; originalTeamSection: string; originalWbsSection: string } | null;
    onShowSyncPreview?: () => void;
    onApplySync?: () => void;
    onCancelSync?: () => void;
}

type Tab = 'kyc' | 'business' | 'design' | 'proposal' | 'evaluation' | 'cost' | 'metacognition' | 'logs';

const ResultStep: React.FC<ResultStepProps> = ({
    markdown,
    research,
    business,
    design,
    evaluation,
    costEstimation,
    images,
    logs,
    onReset,
    onRefineDesign,
    onRefineProposal,
    onExpandKYC,
    onExpandBusiness,
    onExpandDesign,
    onExpandProposal,
    onUpdateContent,
    onUpdateProposal,
    onManualAudit,
    onRegenerateImage,
    onUpdateDesign,
    onEstimateCost,
    onRefineCost,
    onSaveCostEstimation,
    onRegenerateInfographic,
    costSettings,
    onUpdateCostSettings,
    isRefining = false,
    currentModels,
    onUpdateModels,
    currentDelay = 0,
    onUpdateDelay,
    contextDensity = 'high',
    onUpdateDensity,
    onGenerateProposal,
    language = "English",
    metacognitionAnalysis,
    onAnalyzeMetacognition,
    onExpandMetacognition,
    onRegenerateDesign,
    syncPreview,
    onShowSyncPreview,
    onApplySync,
    onCancelSync
}) => {
    // UI Translations
    const t = {
        English: {
            planA: "Plan A: Standard Timeline",
            weeks: "Weeks",
            total: "Total",
            reasoning: "Architect's Reasoning",
            role: "Role",
            rate: "Rate/Hr",
            planB: "Plan B: Aggressive Timeline",
            reduction: "30% Reduction",
            friction: "Risk & Friction Analysis",
            generateEstimator: "Generate Estimation Agent",
            hours: "Total Hours",
            blended: "Blended Rate",
            metaConsonanceDesc: "Evaluates the degree of alignment between customer expectations and the proposed solution.",
            metaDissonanceDesc: "Highlights critical gaps where expectations diverge from delivery reality.",
            metaTensionDesc: "Analyzes competing forces (e.g., Speed vs. Quality) that must be managed for success."
        },
        Spanish: {
            planA: "Plan A: Cronograma Estándar",
            weeks: "Semanas",
            total: "Precio",
            reasoning: "Razonamiento del Arquitecto",
            role: "Rol",
            rate: "Tarifa/Hr",
            planB: "Plan B: Cronograma Agresivo",
            reduction: "Reducción del 30%",
            friction: "Análisis de Riesgos y Fricción",
            generateEstimator: "Generar Agente de Estimación",
            hours: "Horas Totales",
            blended: "Tarifa Promedio",
            metaConsonanceDesc: "Evalúa el grado de alineación entre las expectativas del cliente y la solución propuesta.",
            metaDissonanceDesc: "Destaca brechas críticas donde las expectativas divergen de la realidad de entrega.",
            metaTensionDesc: "Analiza las fuerzas en competencia (ej. Velocidad vs. Calidad) que deben gestionarse para el éxito."
        },
        Portuguese: {
            planA: "Plano A: Cronograma Padrão",
            weeks: "Semanas",
            total: "Preço",
            reasoning: "Raciocínio do Arquiteto",
            role: "Função",
            rate: "Taxa/Hr",
            planB: "Plano B: Cronograma Agressivo",
            reduction: "Redução de 30%",
            friction: "Análise de Riscos e Atrito",
            generateEstimator: "Gerar Agente de Estimativa",
            hours: "Horas Totais",
            blended: "Taxa Mista",
            metaConsonanceDesc: "Avalia o grau de alinhamento entre as expectativas do cliente e a solução proposta.",
            metaDissonanceDesc: "Destaca lacunas críticas onde as expectativas divergem da realidade de entrega.",
            metaTensionDesc: "Analisa forças concorrentes (ex: Velocidade vs. Qualidade) que devem ser gerenciadas para o sucesso."
        },
        French: {
            planA: "Plan A: Calendrier Standard",
            weeks: "Semaines",
            total: "Prix",
            reasoning: "Raisonnement de l'Architecte",
            role: "Rôle",
            rate: "Taux/Hr",
            planB: "Plan B: Calendrier Agressif",
            reduction: "Réduction de 30%",
            friction: "Analyse des Risques et Frictions",
            generateEstimator: "Générer l'Agent d'Estimation",
            hours: "Heures Totales",
            blended: "Taux Mixte",
            metaConsonanceDesc: "Évalue le degré d'alignement entre les attentes du client et la solution proposée.",
            metaDissonanceDesc: "Met en évidence les écarts critiques où les attentes divergent de la réalité.",
            metaTensionDesc: "Analyse les forces concurrentes (ex: Vitesse vs Qualité) qui doivent être gérées pour réussir."
        },
        German: {
            planA: "Plan A: Standardzeitplan",
            weeks: "Wochen",
            total: "Preis",
            reasoning: "Begründung des Architekten",
            role: "Rolle",
            rate: "Rate/Std",
            planB: "Plan B: Aggressiver Zeitplan",
            reduction: "30% Reduzierung",
            friction: "Risiko- und Reibungsanalyse",
            generateEstimator: "Schätzungsagent Generieren",
            hours: "Gesamtstunden",
            blended: "Mischsatz"
        }
    };

    // Helper to get text safely
    const getText = (key: keyof typeof t.English) => {
        const lang = (language && t[language as keyof typeof t]) ? language : 'English';
        // @ts-ignore
        return t[lang][key];
    };

    const [activeTab, setActiveTab] = useState<Tab>('kyc');
    const [copied, setCopied] = useState(false);
    const [htmlCopied, setHtmlCopied] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const logScrollRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Track which section/image is currently expanding/regenerating
    const [expandingSection, setExpandingSection] = useState<string | null>(null);

    // Editable Cost Estimation State
    const [editedCost, setEditedCost] = useState<CostEstimation | null>(null);
    const [costIsDirty, setCostIsDirty] = useState(false);

    // Initialize editedCost when costEstimation changes
    useEffect(() => {
        if (costEstimation && !editedCost) {
            setEditedCost(JSON.parse(JSON.stringify(costEstimation)));
            setCostIsDirty(false);
        }
    }, [costEstimation]);

    // Helper: Update allocation for a role
    const updateAllocation = (roleIdx: number, weekKey: number, value: number) => {
        if (!editedCost) return;
        const updated = JSON.parse(JSON.stringify(editedCost)) as CostEstimation;
        if (updated.optimalPlan?.roles?.[roleIdx]) {
            updated.optimalPlan.roles[roleIdx].allocations[weekKey] = Math.min(100, Math.max(0, value));
        }
        setEditedCost(updated);
        setCostIsDirty(true);
    };

    // Helper: Delete a role
    const deleteRole = (roleIdx: number) => {
        if (!editedCost) return;
        const updated = JSON.parse(JSON.stringify(editedCost)) as CostEstimation;
        if (updated.optimalPlan?.roles) {
            updated.optimalPlan.roles.splice(roleIdx, 1);
        }
        setEditedCost(updated);
        setCostIsDirty(true);
    };

    // Helper: Add a new role
    const addRole = (roleName: string, hourlyRate: number) => {
        if (!editedCost) return;
        const updated = JSON.parse(JSON.stringify(editedCost)) as CostEstimation;
        const weeks = updated.optimalPlan?.totalWeeks || 8;
        const allocations: { [key: string]: number } = {};
        for (let i = 1; i <= weeks; i++) allocations[String(i)] = 0;

        updated.optimalPlan.roles.push({
            role: roleName,
            hourlyRate: hourlyRate,
            allocations: allocations,
            stress: { level: 'Low', score: 2, note: 'Newly added role' }
        });
        setEditedCost(updated);
        setCostIsDirty(true);
    };

    // Helper: Save changes and trigger regeneration
    const handleSaveEdits = () => {
        if (editedCost && onSaveCostEstimation) {
            onSaveCostEstimation(editedCost);
            setCostIsDirty(false);
        }
    };

    const triggerBusinessExpand = (section: string, config: ExpandConfig) => {
        if (onExpandBusiness && !isRefining) {
            setExpandingSection(section);
            onExpandBusiness(section, config);
        }
    };

    const triggerDesignExpand = (section: string, config: ExpandConfig) => {
        if (onExpandDesign && !isRefining) {
            setExpandingSection(section);
            onExpandDesign(section, config);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs' && logScrollRef.current) {
            logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
        }
    }, [logs, activeTab]);

    useEffect(() => {
        // If expanding/improving finished (isRefining becomes false), clear state
        if (!isRefining) {
            setExpandingSection(null);
        }
    }, [isRefining]);

    // Close settings on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setShowSettings(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleCopyMarkdown = () => {
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyForDocs = () => {
        // Select the rendered article content
        const article = document.querySelector('article.prose');
        if (article) {
            const range = document.createRange();
            range.selectNode(article);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
            try {
                document.execCommand('copy');
                setHtmlCopied(true);
                setTimeout(() => setHtmlCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy rich text', err);
            }
            window.getSelection()?.removeAllRanges();
        }
    };

    const handleDownloadHTML = async () => {
        // Convert markdown to HTML using marked
        const contentHtml = marked.parse(markdown);

        // Create a standalone HTML file structure with CSS and Mermaid support
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nubiral BSA Proposal</title>
    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f8fafc; padding: 40px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 60px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .mermaid { margin: 20px 0; display: flex; justify-content: center; background: #f8fafc; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container prose prose-slate max-w-none">
        ${contentHtml}
    </div>
    
    <!-- Mermaid JS Logic for auto-rendering -->
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ startOnLoad: true });
        
        // Find markdown code blocks that are meant to be mermaid and convert them
        document.querySelectorAll('pre code.language-mermaid').forEach(el => {
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = el.textContent;
            el.parentElement.replaceWith(div);
        });
        
        // Re-run mermaid after replacement
        setTimeout(() => {
            mermaid.run();
        }, 100);
    </script>
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'technical_proposal_report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPlaybook = () => {
        if (!metacognitionAnalysis) return;

        const date = new Date().toLocaleDateString();

        let htmlContent = `
            <h1 style="text-align: center; color: #1e293b; margin-bottom: 10px;">Delivery Playbook</h1>
            <h2 style="text-align: center; color: #64748b; font-size: 1.25rem; font-weight: normal; margin-bottom: 40px;">Cognitive Alignment Analysis • ${date}</h2>
        `;

        // Infographic
        if (images?.metacognitionInfographic) {
            htmlContent += `
                <div style="margin-bottom: 40px; text-align: center;">
                    <img src="${images.metacognitionInfographic}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
                    <p style="color: #64748b; font-size: 0.875rem; margin-top: 10px; font-style: italic;">Cognitive Alignment Map</p>
                </div>
            `;
        }

        // Consonance Matrix
        htmlContent += `
            <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 40px;">1. Consonance Matrix (Alignment)</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f8fafc; text-align: left;">
                        <th style="padding: 12px; border: 1px solid #e2e8f0;">Dimension</th>
                        <th style="padding: 12px; border: 1px solid #e2e8f0;">Score</th>
                        <th style="padding: 12px; border: 1px solid #e2e8f0;">Evidence</th>
                    </tr>
                </thead>
                <tbody>
                    ${metacognitionAnalysis.consonanceMatrix.map(item => `
                        <tr>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; font-weight: 500;">${item.dimension}</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0;">${item.alignmentScore}/5</td>
                            <td style="padding: 12px; border: 1px solid #e2e8f0; color: #475569;">${item.notes}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Dissonance Alerts
        htmlContent += `
            <h3 style="color: #ef4444; border-bottom: 2px solid #fee2e2; padding-bottom: 10px; margin-top: 40px;">2. Dissonance Alerts (Risks)</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                ${metacognitionAnalysis.dissonanceAlerts.map(alert => `
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px;">
                        <div style="color: #991b1b; font-weight: bold; font-size: 0.75rem; text-transform: uppercase;">${alert.severity} Risk</div>
                        <h4 style="margin: 8px 0; color: #7f1d1d; font-size: 1.1rem;">${alert.description}</h4>
                        <div style="font-size: 0.875rem; color: #450a0a; line-height: 1.5;">
                            <p style="margin: 4px 0;"><strong>Expectation:</strong> ${alert.customerExpectation}</p>
                            <p style="margin: 4px 0;"><strong>Reality:</strong> ${alert.reality}</p>
                            <p style="margin: 12px 0 0 0; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1);"><strong>Mitigation:</strong> ${alert.mitigationStrategy}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Tension Management
        htmlContent += `
             <h3 style="color: #3b82f6; border-bottom: 2px solid #dbeafe; padding-bottom: 10px; margin-top: 40px;">3. Tension Management</h3>
             <div style="margin-top: 20px;">
                ${metacognitionAnalysis.tensionManagement.map(tension => `
                    <div style="border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 16px; page-break-inside: avoid;">
                        <h4 style="margin: 0 0 10px 0; color: #0f172a;">${tension.tension}</h4>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">
                            <span>${tension.leftForce}</span>
                            <span>${tension.rightForce}</span>
                        </div>
                        <p style="margin: 0; padding-left: 12px; border-left: 3px solid #3b82f6; font-style: italic; color: #334155;">
                            "${tension.recommendation}"
                        </p>
                    </div>
                `).join('')}
             </div>
        `;

        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nubiral Delivery Playbook</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: white; padding: 40px; color: #334155; }
        .container { max-width: 800px; margin: 0 auto; }
        @media print {
            body { padding: 0; }
            .container { max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        ${htmlContent}
    </div>
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'delivery_playbook.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const triggerExpand = (section: string, config: ExpandConfig) => {
        if (onExpandKYC && !isRefining) {
            setExpandingSection(section);
            onExpandKYC(section, config);
        }
    };

    const triggerProposalExpand = (section: string, config: ExpandConfig) => {
        if (onExpandProposal && !isRefining) {
            setExpandingSection(section);
            onExpandProposal(section, config);
        }
    };

    const triggerRegenerateImage = (type: 'cover' | 'concept' | 'infographic' | 'business_technical') => {
        if (onRegenerateImage && !isRefining) {
            setExpandingSection(`regen-${type}`);
            onRegenerateImage(type);
        }
    };

    const triggerMetacognitionExpand = (section: string, config: ExpandConfig) => {
        if (onExpandMetacognition && !isRefining) {
            setExpandingSection(section);
            onExpandMetacognition(section, config);
        }
    };

    const handleModelChange = (key: 'text' | 'image', value: string) => {
        if (onUpdateModels && currentModels) {
            const newText = key === 'text' ? value : currentModels.text;
            const newImage = key === 'image' ? value : currentModels.image;
            onUpdateModels(newText, newImage);
        }
    };

    // Helper for density slider
    const densityValues: ContextDensity[] = ['low', 'medium', 'high'];
    const densityIndex = densityValues.indexOf(contextDensity);

    const handleDensityChange = (val: number) => {
        if (onUpdateDensity) {
            onUpdateDensity(densityValues[val]);
        }
    };

    // ... (rest of the file content until render methods) ...


    const handleUpdateProposalSection = (section: string, content: string | null) => {
        if (onUpdateProposal) {
            const escapedSection = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`^(#{1,6})\\s+${escapedSection}\\s*$`, 'im');

            let newMarkdown = markdown;
            const match = markdown.match(regex);

            if (match && match.index !== undefined) {
                const startIndex = match.index;
                const nextHeaderRegex = new RegExp(`^#{1,6}\\s+`, 'im');
                let endIndex = markdown.length;
                const nextMatch = markdown.substring(startIndex + match[0].length).match(nextHeaderRegex);
                if (nextMatch && nextMatch.index !== undefined) {
                    endIndex = startIndex + match[0].length + nextMatch.index;
                }

                if (content === null) {
                    // Delete the section
                    newMarkdown = markdown.substring(0, startIndex) + markdown.substring(endIndex);
                } else {
                    // Replace the section content
                    newMarkdown = markdown.substring(0, startIndex + match[0].length) + `\n\n${content}\n\n` + markdown.substring(endIndex);
                }
            }
            onUpdateProposal(newMarkdown);
        }

    };

    return (
        <div className="max-w-6xl mx-auto space-y-4 h-full flex flex-col relative">

            {/* NUBIRAL EXPERT CHAT WIDGET - Always available in results */}
            <ChatWidget
                research={research}
                design={design}
                markdown={markdown}
                costEstimation={costEstimation}
                logs={logs}
                onRegenerateImage={onRegenerateImage} // Pass to chat
                onExpandKYC={onExpandKYC}
                onUpdateDesign={onUpdateDesign}
            />

            {/* Header Actions */}{/* Decoupled Agent Output header removed */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Settings Button */}
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`flex items-center justify-center p-2 rounded-lg transition-colors border ${showSettings ? 'bg-slate-200 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                            title="Agent Model Settings"
                        >
                            <Settings className="w-4 h-4 text-slate-600" />
                        </button>
                        {showSettings && currentModels && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-5 z-50 animate-fade-in">
                                <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                                    <Settings className="w-4 h-4" /> Agent Configuration
                                </h3>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                            <Bot className="w-3 h-3" /> Reasoning Model
                                        </label>
                                        <select
                                            value={currentModels.text}
                                            onChange={(e) => handleModelChange('text', e.target.value)}
                                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Thinking)</option>
                                            <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Fast)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Image Model
                                        </label>
                                        <select
                                            value={currentModels.image}
                                            onChange={(e) => handleModelChange('image', e.target.value)}
                                            className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fast)</option>
                                            <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro Image (High Quality)</option>
                                        </select>
                                    </div>

                                    {/* Context Density Slider */}
                                    {onUpdateDensity !== undefined && (
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <Layers className="w-3 h-3" /> Information Filtering
                                                </div>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${contextDensity === 'high' ? 'bg-red-100 text-red-600' : contextDensity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {contextDensity.toUpperCase()}
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="1"
                                                value={densityIndex}
                                                onChange={(e) => handleDensityChange(parseInt(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                                                <span>Summary</span>
                                                <span>Brief</span>
                                                <span>Detailed</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 italic mt-1 bg-slate-50 p-1 rounded">
                                                Controls how much raw research data is passed to the Architect agent.
                                            </div>
                                        </div>
                                    )}

                                    {/* API Rate Limit Delay Slider */}
                                    {onUpdateDelay !== undefined && (
                                        <div className="border-t border-slate-100 pt-3">
                                            <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> API Pause (Rate Limit)
                                                </div>
                                                <span className="text-blue-600 font-mono">{currentDelay}s</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                step="0.5"
                                                value={currentDelay}
                                                onChange={(e) => onUpdateDelay(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                                                <span>Fast (0s)</span>
                                                <span>Slow (10s)</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-[10px] text-slate-400 mt-2 bg-slate-50 p-2 rounded">
                                        * Changes apply to next regeneration action.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium text-xs md:text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        New
                    </button>

                    {markdown && (
                        <>
                            {/* Trigger Global Update of Proposal */}
                            <button
                                onClick={() => onRefineProposal?.("Please update the proposal based on all current upstream artifacts (Research, Business Case, and Design).")}
                                disabled={isRefining}
                                className="flex items-center gap-2 px-3 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors font-medium text-xs md:text-sm disabled:opacity-50"
                                title="Synchronize proposal with latest changes"
                            >
                                {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                                Update Proposal
                            </button>

                            {/* Manual SMART Audit Trigger */}
                            <button
                                onClick={onManualAudit}
                                disabled={isRefining}
                                className="flex items-center gap-2 px-3 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors font-medium text-xs md:text-sm disabled:opacity-50"
                            >
                                {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                Run SMART Audit
                            </button>

                            {/* Copy for Docs Removed per request */}

                            {/* Download HTML */}

                            {/* Download HTML */}
                            <button
                                onClick={handleDownloadHTML}
                                className="flex items-center gap-2 px-3 py-2 text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors font-medium text-xs md:text-sm"
                            >
                                <FileCode className="w-4 h-4" />
                                Export HTML
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-slate-200/50 p-1.5 rounded-xl flex gap-1 overflow-x-auto shrink-0">
                <TabButton
                    active={activeTab === 'kyc'}
                    onClick={() => setActiveTab('kyc')}
                    icon={Search}
                    label="KYC Research"
                    ready={!!research}
                />
                <TabButton
                    active={activeTab === 'business'}
                    onClick={() => setActiveTab('business')}
                    icon={Target}
                    label="Business Case"
                    ready={!!business}
                />
                <TabButton
                    active={activeTab === 'design'}
                    onClick={() => setActiveTab('design')}
                    icon={BrainCircuit}
                    label="Solution Architecture"
                    ready={!!design}
                />
                <TabButton
                    active={activeTab === 'proposal'}
                    onClick={() => setActiveTab('proposal')}
                    icon={FileText}
                    label="Final Proposal"
                    ready={!!markdown}
                />
                <TabButton
                    active={activeTab === 'evaluation'}
                    onClick={() => setActiveTab('evaluation')}
                    icon={Award}
                    label="SMART Audit"
                    ready={!!evaluation}
                />
                <TabButton
                    active={activeTab === 'cost'}
                    onClick={() => setActiveTab('cost')}
                    icon={BarChart3}
                    label="Execution Cost"
                    ready={!!costEstimation || !!markdown} // Available if we have a proposal to estimate from
                />
                <TabButton
                    active={activeTab === 'metacognition'}
                    onClick={() => setActiveTab('metacognition')}
                    icon={BrainCircuit}
                    label="Metacognition"
                    ready={!!costEstimation} // Available after cost estimation
                />
                <TabButton
                    active={activeTab === 'logs'}
                    onClick={() => setActiveTab('logs')}
                    icon={Terminal}
                    label="Agent Logs"
                    ready={true}
                />
            </div>

            {/* Content Area - Fixed height viewport with internal scrolling */}
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 h-[75vh] flex flex-col overflow-hidden relative text-slate-900">

                {/* KYC Tab Content - Expanded */}
                {activeTab === 'kyc' && research && (
                    <div className="h-full overflow-y-auto p-8 space-y-8 animate-fade-in custom-scrollbar">

                        {/* FULL-WIDTH KYC INFOGRAPHIC COVER */}
                        {images?.kycInfographic && (
                            <div className="w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 relative group">
                                <img src={images.kycInfographic} alt="KYC Infographic" className="w-full h-auto object-cover" />
                                <RegenerateButton
                                    onClick={() => onRegenerateInfographic?.('kyc')}
                                    isRegenerating={expandingSection === 'regen-kyc'}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Company Intelligence Infographic
                                </div>
                            </div>
                        )}

                        {/* 1. Summary & Overview */}
                        <div className="prose max-w-none">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-blue-500" />
                                    Overview & Landscape
                                </h3>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 text-slate-700 leading-relaxed italic border-l-4 border-l-blue-500 mb-4">
                                "{research.summary}"
                            </div>

                            {/* Industry Landscape Section */}
                            <ExpandableSection
                                title="Industry Landscape"
                                defaultContent={research.detailedAnalysis.industryLandscape || "Industry data currently unavailable."}
                                expandedContent={research.expandedContent?.['Industry Landscape']}
                                onExpand={(config) => triggerExpand('Industry Landscape', config)}
                                isExpanding={expandingSection === 'Industry Landscape'}
                                type="kyc"
                                sectionKey="Industry Landscape"
                                onUpdate={onUpdateContent}
                            />
                        </div>

                        {/* 2. Challenges & Risks (Deep Dive) */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-red-50/50 rounded-xl p-6 border border-red-100 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5" />
                                        Challenges & Risks
                                    </h3>
                                    <SmartExpandPopover
                                        title="Deep Dive: Challenges & Risks"
                                        onExpand={(config) => triggerExpand('Challenges & Risks', config)}
                                        isLoading={expandingSection === 'Challenges & Risks'}
                                    />
                                </div>

                                {research.expandedContent?.['Challenges & Risks'] ? (
                                    <div className="prose prose-sm prose-red max-w-none">
                                        <MarkdownWithMermaid content={research.expandedContent['Challenges & Risks']} />
                                    </div>
                                ) : (
                                    <>
                                        <ul className="space-y-2 mb-4">
                                            {research.detailedAnalysis?.challengesAndRisks && research.detailedAnalysis.challengesAndRisks.length > 0 ? (
                                                research.detailedAnalysis.challengesAndRisks.map((item, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-red-900/80">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                                                        {item}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="text-sm text-red-400 italic">No specific challenges data available.</li>
                                            )}
                                        </ul>
                                        {/* Regulatory Constraints */}
                                        {research.detailedAnalysis?.regulatoryConstraints && research.detailedAnalysis.regulatoryConstraints.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-red-200">
                                                <h4 className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">Regulatory Prohibitions & Constraints</h4>
                                                <ul className="space-y-1">
                                                    {research.detailedAnalysis.regulatoryConstraints.map((item, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-xs text-red-800 font-medium">
                                                            <AlertTriangle className="w-3 h-3" /> {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Strategic Goals
                                    </h3>
                                    <SmartExpandPopover
                                        title="Deep Dive: Strategic Goals"
                                        onExpand={(config) => triggerExpand('Strategic Goals', config)}
                                        isLoading={expandingSection === 'Strategic Goals'}
                                    />
                                </div>
                                {research.expandedContent?.['Strategic Goals'] ? (
                                    <div className="prose prose-sm prose-blue max-w-none">
                                        <MarkdownWithMermaid content={research.expandedContent['Strategic Goals']} />
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {research.strategicGoals.length > 0 ? (
                                            research.strategicGoals.map((goal, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-blue-900/80">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                                                    {goal}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-blue-400 italic">No specific strategic goals identified.</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* 3. SWOT Analysis */}
                        {research.detailedAnalysis?.swot && (
                            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-slate-800">SWOT Analysis</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <div className="font-bold text-green-800 text-sm mb-2">Strengths</div>
                                        {research.detailedAnalysis.swot.strengths?.length > 0 ? (
                                            <ul className="list-disc list-inside text-xs text-slate-700">
                                                {research.detailedAnalysis.swot.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        ) : <span className="text-xs text-slate-400 italic">No data</span>}
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg">
                                        <div className="font-bold text-red-800 text-sm mb-2">Weaknesses</div>
                                        {research.detailedAnalysis.swot.weaknesses?.length > 0 ? (
                                            <ul className="list-disc list-inside text-xs text-slate-700">
                                                {research.detailedAnalysis.swot.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        ) : <span className="text-xs text-slate-400 italic">No data</span>}
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <div className="font-bold text-blue-800 text-sm mb-2">Opportunities</div>
                                        {research.detailedAnalysis.swot.opportunities?.length > 0 ? (
                                            <ul className="list-disc list-inside text-xs text-slate-700">
                                                {research.detailedAnalysis.swot.opportunities.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        ) : <span className="text-xs text-slate-400 italic">No data</span>}
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-lg">
                                        <div className="font-bold text-orange-800 text-sm mb-2">Threats</div>
                                        {research.detailedAnalysis.swot.threats?.length > 0 ? (
                                            <ul className="list-disc list-inside text-xs text-slate-700">
                                                {research.detailedAnalysis.swot.threats.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        ) : <span className="text-xs text-slate-400 italic">No data</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Maturity & Stakeholders */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-purple-500" />
                                    Maturity Assessment
                                </h4>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <span className="block text-xs text-slate-500 uppercase font-semibold">Business Maturity</span>
                                        <div className="text-slate-800">{research.detailedAnalysis?.businessMaturity || 'Assessing...'}</div>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-slate-500 uppercase font-semibold">EA & GenAI Maturity</span>
                                        <div className="text-slate-800">{research.detailedAnalysis?.eaMaturity || 'Assessing...'}</div>
                                        {research.detailedAnalysis?.genAiMaturity && (
                                            <div className="text-xs text-purple-600 mt-1">
                                                <strong>GenAI Specific:</strong> {research.detailedAnalysis.genAiMaturity}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-indigo-500" />
                                        Key Stakeholders
                                    </h4>
                                    <SmartExpandPopover
                                        title="Deep Dive: Stakeholders"
                                        onExpand={(config) => triggerExpand('Key Stakeholders', config)}
                                        isLoading={expandingSection === 'Key Stakeholders'}
                                    />
                                </div>
                                {research.expandedContent?.['Key Stakeholders'] ? (
                                    <div className="prose prose-sm max-w-none text-xs">
                                        <MarkdownWithMermaid content={research.expandedContent['Key Stakeholders']} />
                                    </div>
                                ) : (
                                    <ul className="text-sm space-y-2">
                                        {research.detailedAnalysis?.keyStakeholders && research.detailedAnalysis.keyStakeholders.length > 0 ? (
                                            research.detailedAnalysis.keyStakeholders.map((s, i) => (
                                                <li key={i} className="text-slate-700 pb-1 border-b border-slate-50 last:border-0">{s}</li>
                                            ))
                                        ) : <li className="text-slate-400 italic">Identifying...</li>}
                                    </ul>
                                )}
                            </div>

                            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                    Hyperscaler Affinity
                                </h4>
                                <p className="text-sm text-slate-700">
                                    {research.detailedAnalysis?.hyperscalerAffinity || 'Analyzing Cloud Strategy...'}
                                </p>
                            </div>
                        </div>

                        {/* 5. Competition */}
                        {research.detailedAnalysis?.competitors && (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-slate-800">Competitive Landscape</h3>
                                    <SmartExpandPopover
                                        title="Deep Dive: Competitors"
                                        onExpand={(config) => triggerExpand('Competitors', config)}
                                        isLoading={expandingSection === 'Competitors'}
                                    />
                                </div>
                                {research.expandedContent?.['Competitors'] ? (
                                    <div className="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-slate-200">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code(props) {
                                                    const { children, className, node, ...rest } = props
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    if (match && match[1] === 'mermaid') {
                                                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                                                    }
                                                    return <code {...rest} className={className}>{children}</code>
                                                }
                                            }}
                                        >
                                            {research.expandedContent['Competitors']}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Global Competitors</span>
                                            <div className="flex flex-wrap gap-2">
                                                {research.detailedAnalysis.competitors.global.length > 0 ? (
                                                    research.detailedAnalysis.competitors.global.map((c, i) => (
                                                        <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm">{c}</span>
                                                    ))
                                                ) : <span className="text-xs text-slate-400 italic">None identified</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Local/Regional Competitors</span>
                                            <div className="flex flex-wrap gap-2">
                                                {research.detailedAnalysis.competitors.local.length > 0 ? (
                                                    research.detailedAnalysis.competitors.local.map((c, i) => (
                                                        <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm">{c}</span>
                                                    ))
                                                ) : <span className="text-xs text-slate-400 italic">None identified</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ExternalLink className="w-5 h-5 text-green-500" />
                                Sources (Grounding)
                            </h3>
                            <ul className="space-y-2">
                                {research.sources.map((source, idx) => (
                                    <li key={idx}>
                                        <a
                                            href={source.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline group"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-600"></span>
                                            {source.title}
                                            <ExternalLink className="w-3 h-3 opacity-50" />
                                        </a>
                                    </li>
                                ))}
                                {research.sources.length === 0 && (
                                    <p className="text-slate-400 italic">No public sources directly cited.</p>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Business Case Tab Content */}
                {activeTab === 'business' && business && (
                    <div className="h-full overflow-y-auto p-8 space-y-8 animate-fade-in custom-scrollbar">

                        {/* 1. Problem & ROI Header */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                                    <Target className="w-6 h-6 text-emerald-600" />
                                    Business Analysis & ROI
                                </h3>
                                {/* We use triggerBusinessExpand via SmartExpandPopover */}
                                {/* Note: We'll put expanders on subsections for better granularity */}
                            </div>

                            <div className="prose prose-sm max-w-none mb-6">
                                <h4 className="text-emerald-800 font-semibold mb-2">Core Problem Statement</h4>
                                <p className="text-emerald-900/80 italic text-lg leading-relaxed border-l-4 border-emerald-400 pl-4">
                                    "{business.problemStatement}"
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 mt-6 border-t border-emerald-200/50 pt-6">
                                <div>
                                    <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Estimated ROI</span>
                                    <span className="text-2xl font-bold text-emerald-800">{business.expectedBusinessValue.roi || "TBD"}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Efficiency Gains</span>
                                    <span className="text-lg font-semibold text-emerald-800">{business.expectedBusinessValue.efficiencyGains || "Calculating..."}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Benefits</span>
                                    <div className="flex flex-wrap gap-2">
                                        {business.expectedBusinessValue.otherBenefits.map((b, i) => (
                                            <span key={i} className="text-xs bg-white text-emerald-700 px-2 py-1 rounded border border-emerald-200">{b}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Deep Dive: Root Causes */}
                        <ExpandableSection
                            title="Root Cause Analysis"
                            defaultContent={business.rootCauseAnalysis.length > 0 ? business.rootCauseAnalysis.join('\n') : "Identifying root causes..."}
                            expandedContent={business.expandedContent?.['Root Cause Analysis']}
                            onExpand={(config) => triggerBusinessExpand('Root Cause Analysis', config)}
                            isExpanding={expandingSection === 'Root Cause Analysis'}
                            type="business"
                            sectionKey="Root Cause Analysis"
                            onUpdate={onUpdateContent}
                        />

                        {/* 3. Deep Dive: User Stories */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    User Stories & Requirements
                                </h3>
                                <SmartExpandPopover
                                    title="Deep Dive: User Stories"
                                    onExpand={(config) => triggerBusinessExpand('User Stories', config)}
                                    isLoading={expandingSection === 'User Stories'}
                                />
                            </div>

                            {business.expandedContent?.['User Stories'] ? (
                                <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <MarkdownWithMermaid content={business.expandedContent['User Stories']} />
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {business.userStories.length > 0 ? (
                                        business.userStories.map((story, i) => (
                                            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-indigo-400 shrink-0"></div>
                                                <span>{story}</span>
                                            </div>
                                        ))
                                    ) : <span className="text-slate-400 italic">No user stories generated.</span>}
                                </div>
                            )}
                        </div>

                        {/* 4. Process Flaws & Pain Points */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-5 bg-red-50 rounded-xl border border-red-100">
                                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Current Process Flaws
                                </h4>
                                <ul className="space-y-2">
                                    {business.currentProcessFlaws.map((flaw, i) => (
                                        <li key={i} className="text-sm text-red-900/80 flex gap-2">
                                            <span className="text-red-400">•</span> {flaw}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-5 bg-orange-50 rounded-xl border border-orange-100">
                                <h4 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Key Pain Points
                                </h4>
                                <ul className="space-y-2">
                                    {business.keyPainPoints.map((pain, i) => (
                                        <li key={i} className="text-sm text-orange-900/80 flex gap-2">
                                            <span className="text-orange-400">•</span> {pain}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* 5. Mermaid Diagram (Problem Hierarchy) */}
                        {business.mermaidDiagram && (
                            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm overflow-x-auto">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Problem Hierarchy Map</h3>
                                <MermaidDiagram chart={business.mermaidDiagram} />
                            </div>
                        )}

                        {/* Business Infographic */}
                        {images?.businessInfographic && (
                            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm mt-6 relative group">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Business Case Visualization</h3>
                                <img src={images.businessInfographic} alt="Business Infographic" className="w-full h-auto rounded-lg" />
                                <RegenerateButton
                                    onClick={() => onRegenerateInfographic?.('business')}
                                    isRegenerating={expandingSection === 'regen-business'}
                                />
                            </div>
                        )}

                    </div>
                )}

                {/* Design Tab Content */}
                {activeTab === 'design' && design ? (
                    <div className="flex flex-col h-full animate-fade-in">
                        {/* Scrollable Design Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                            {/* Architecture Content */}
                            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-bold text-slate-800">
                                        Solutions Architecture
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Generated based on current Business Case and Constraints
                                    </p>
                                </div>
                                {onRegenerateDesign && (
                                    <button
                                        onClick={onRegenerateDesign}
                                        disabled={isRefining}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Re-run the Design Agent with current context"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isRefining ? 'animate-spin' : ''}`} />
                                        Rerun Analysis (Update)
                                    </button>
                                )}
                            </div>

                            <div className="prose prose-sm prose-slate max-w-none mb-8">
                                {design?.architectureOverview ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {design.architectureOverview}
                                    </ReactMarkdown>
                                ) : (
                                    <p className="text-slate-400 italic">Architecture overview pending...</p>
                                )}
                            </div>

                            {/* Architecture Expanded Content */}
                            {design.expandedContent && Object.entries(design.expandedContent).map(([key, content]) => (
                                <div key={key} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-blue-500" />
                                            {key}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onUpdateContent && onUpdateContent('kyc', key, null)} // Placeholder, we should use a proper design update
                                                className="p-1 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete Section"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <SmartExpandPopover
                                                title={`Refine: ${key}`}
                                                onExpand={(config) => triggerDesignExpand(key, config)}
                                                isLoading={expandingSection === key}
                                            />
                                        </div>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-slate-700">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code(props) {
                                                    const { children, className, node, ...rest } = props
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    if (match && match[1] === 'mermaid') {
                                                        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                                                    }
                                                    return <code {...rest} className={className}>{children}</code>
                                                }
                                            }}
                                        >
                                            {content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}

                            {/* Business Mapping Table */}
                            {design.businessMapping && design.businessMapping.length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-sm text-slate-700 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Business Goal Alignment
                                    </div>
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="px-4 py-2">Business Goal / Pain Point</th>
                                                <th className="px-4 py-2">Technical Solution</th>
                                                <th className="px-4 py-2">Expected Outcome</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {design.businessMapping.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 font-medium text-slate-800">{item.businessGoal}</td>
                                                    <td className="px-4 py-3 text-blue-600 font-mono text-xs">{item.technicalSolution}</td>
                                                    <td className="px-4 py-3 text-slate-600">{item.outcome}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Mermaid Diagram Visualization */}
                            {design.mermaidCode && (
                                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm overflow-x-auto mt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Architecture Diagram</h3>
                                        {!design.isApproved && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onRefineDesign?.("The diagram needs more detail, please refine it further.")}
                                                    className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                                                >
                                                    Refine Diagram
                                                </button>
                                                <button
                                                    onClick={() => onUpdateDesign?.({ ...design, isApproved: true })}
                                                    className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 flex items-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" /> Approve Diagram
                                                </button>
                                            </div>
                                        )}
                                        {design.isApproved && (
                                            <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded flex items-center gap-1 font-medium">
                                                <Check className="w-3 h-3" /> Approved
                                            </span>
                                        )}
                                    </div>
                                    <MermaidDiagram chart={design.mermaidCode} />
                                </div>
                            )}



                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Server className="w-5 h-5 text-purple-500" />
                                    Key Cloud Components
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {design.keyComponents.map((comp, idx) => (
                                        <span key={idx} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-medium shadow-sm flex items-center gap-2 hover:border-purple-300 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                            {comp}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Manual Proposal Trigger */}
                            {!markdown && (
                                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 mt-8">
                                    <h4 className="text-yellow-800 font-bold mb-2 flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Ready to write the proposal?
                                    </h4>
                                    <p className="text-sm text-yellow-700 mb-4">
                                        Review the architecture above. If the design is correct, proceed to generate the full document.
                                    </p>
                                    <button
                                        onClick={onGenerateProposal}
                                        disabled={isRefining}
                                        className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                        {isRefining ? 'Generating...' : 'Generate Proposal Document'}
                                    </button>
                                </div>
                            )}

                            {/* Regenerate Proposal (when architecture changed after first proposal) */}
                            {markdown && (
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-8">
                                    <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5" />
                                        Architecture Updated?
                                    </h4>
                                    <p className="text-sm text-blue-700 mb-4">
                                        If you've made changes to the architecture above, you can regenerate the proposal to reflect those updates.
                                    </p>
                                    <button
                                        onClick={onGenerateProposal}
                                        disabled={isRefining}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <RefreshCw className={`w-5 h-5 ${isRefining ? 'animate-spin' : ''}`} />
                                        {isRefining ? 'Regenerating...' : 'Regenerate Proposal with New Architecture'}
                                    </button>
                                </div>
                            )}

                            <div className="mt-8">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5" />
                                        Architect's Notes (Internal Monologue)
                                    </h3>
                                    <SmartExpandPopover
                                        title="Improve Notes with AI"
                                        onExpand={(config) => onRefineDesign?.(config.instruction)}
                                        isLoading={isRefining}
                                        buttonLabel="Improve with AI"
                                    />
                                </div>
                                <div className="prose prose-sm max-w-none text-yellow-900/80">
                                    <MarkdownWithMermaid content={design.thinkingProcess || design.rationale} />
                                </div>
                            </div>

                            {/* Architecture Infographic */}
                            {images?.architectureInfographic && (
                                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm mt-6 relative group">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Architecture Visualization</h3>
                                    <img src={images.architectureInfographic} alt="Architecture Infographic" className="w-full h-auto rounded-lg" />
                                    <RegenerateButton
                                        onClick={() => onRegenerateInfographic?.('architecture')}
                                        isRegenerating={expandingSection === 'regen-architecture'}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Design Feedback Loop - Fixed at Bottom */}
                        {onRefineDesign && (
                            <FeedbackSection
                                title="Refine Solution Design"
                                placeholder="E.g., Change the database to PostgreSQL, add a caching layer with Redis, or emphasize cost optimization..."
                                onSubmit={onRefineDesign}
                                isRefining={isRefining}
                            />
                        )}
                    </div>
                ) : activeTab === 'design' && <LoadingState message="Architecting Solution & Generating Diagrams..." />}

                {/* Proposal Tab Content */}
                {activeTab === 'proposal' && markdown ? (
                    <div className="flex flex-col h-full animate-fade-in">
                        {/* Scrollable Proposal Content */}
                        <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                            <article className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-a:text-blue-600 prose-strong:text-slate-800 text-slate-800">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    urlTransform={(url) => url}
                                    components={{
                                        // Inject Expand buttons on headers
                                        h1: ({ node, ...props }) => <HeaderWithExpand {...props} level={1} onExpand={triggerProposalExpand} isExpanding={expandingSection} onUpdate={onUpdateProposal ? handleUpdateProposalSection : undefined} proposalMarkdown={markdown} />,
                                        h2: ({ node, ...props }) => <HeaderWithExpand {...props} level={2} onExpand={triggerProposalExpand} isExpanding={expandingSection} onUpdate={onUpdateProposal ? handleUpdateProposalSection : undefined} proposalMarkdown={markdown} />,
                                        h3: ({ node, ...props }) => <HeaderWithExpand {...props} level={3} onExpand={triggerProposalExpand} isExpanding={expandingSection} onUpdate={onUpdateProposal ? handleUpdateProposalSection : undefined} proposalMarkdown={markdown} />,

                                        code(props) {
                                            const { children, className, node, ...rest } = props
                                            const match = /language-(\w+)/.exec(className || '')
                                            if (match && match[1] === 'mermaid') {
                                                return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />
                                            }
                                            return <code {...rest} className={className}>{children}</code>
                                        },
                                        img(props) {
                                            // Find which image type this is based on Alt Text roughly or src matching
                                            // NOTE: This is a hacky way to inject the button in the Markdown renderer. 
                                            // ReactMarkdown components don't easily allow wrapping the <img> in a relative div for the button.
                                            // Instead, we will rely on the "KYC Infographic" being in the KYC tab, 
                                            // And "Cover/Concept" usually at top of proposal.

                                            // Let's check alt text to identify
                                            const alt = props.alt || '';
                                            let type: 'cover' | 'concept' | null = null;
                                            if (alt.includes('Cover')) type = 'cover';


                                            if (type && onRegenerateImage) {
                                                return (
                                                    <span className="relative group inline-block w-full">
                                                        <img {...props} className="rounded-xl shadow-lg my-6 w-full object-cover max-h-[400px] border border-slate-200" />
                                                        <span className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <RegenerateButton
                                                                onClick={() => triggerRegenerateImage(type!)}
                                                                isRegenerating={expandingSection === `regen-${type}`}
                                                            />
                                                        </span>
                                                    </span>
                                                );
                                            }
                                            return <img {...props} className="rounded-xl shadow-lg my-6 w-full object-cover max-h-[400px] border border-slate-200" />
                                        }
                                    }}
                                >
                                    {markdown}
                                </ReactMarkdown>
                            </article>

                            {/* Architecture Infographic in Proposal */}
                            {images?.architectureInfographic && (
                                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm mt-8 relative group">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Architecture Visualization</h3>
                                    <img src={images.architectureInfographic} alt="Architecture Infographic" className="w-full h-auto rounded-lg" />
                                    <RegenerateButton
                                        onClick={() => onRegenerateInfographic?.('architecture')}
                                        isRegenerating={expandingSection === 'regen-architecture'}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Proposal Feedback Loop - Fixed at Bottom */}
                        {onRefineProposal && (
                            <FeedbackSection
                                title="Refine Proposal Text"
                                placeholder="E.g., Expand on the executive summary, make the tone more formal, or add a specific deliverable for training..."
                                onSubmit={onRefineProposal}
                                isRefining={isRefining}
                            />
                        )}
                    </div>
                ) : activeTab === 'proposal' && <LoadingState message="Drafting Proposal & Embedding Assets..." />}

                {/* Evaluation Tab Content */}
                {activeTab === 'evaluation' && evaluation ? (
                    <div className="h-full overflow-y-auto p-8 md:p-12 animate-fade-in custom-scrollbar">
                        {/* ... Evaluation content ... */}
                        <div className="bg-slate-50 border-l-4 border-purple-600 p-4 mb-8">
                            <h3 className="font-bold text-purple-900">SMART Audit Protocol</h3>
                            <p className="text-sm text-purple-700">This evaluation was generated by an independent agentic process validating against industry standards.</p>
                        </div>
                        <article className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-800 prose-td:text-slate-800 prose-th:text-slate-900">
                            <MarkdownWithMermaid content={evaluation} />
                        </article>
                    </div>
                ) : activeTab === 'evaluation' && <LoadingState message="Auditing Proposal against SMART Criteria..." />}

                {/* METACOGNITION Tab Content */}
                {activeTab === 'metacognition' && (
                    <div className="h-full overflow-y-auto p-8 space-y-8 animate-fade-in custom-scrollbar">
                        {!metacognitionAnalysis ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                                <div className="p-6 bg-indigo-50 rounded-full">
                                    <BrainCircuit className="w-16 h-16 text-indigo-600" />
                                </div>
                                <div className="max-w-md space-y-2">
                                    <h3 className="text-xl font-bold text-slate-900">Cognitive Alignment Analysis</h3>
                                    <p className="text-slate-600">
                                        Analyze the cognitive consonance and dissonance between the Customer's vision, Nubiral's delivery capabilities, and the Proposal's promise.
                                    </p>
                                </div>
                                <button
                                    onClick={onAnalyzeMetacognition}
                                    disabled={isRefining}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none"
                                >
                                    {isRefining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    Run Metacognition Analysis (ReAct)
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={onAnalyzeMetacognition}
                                        disabled={isRefining}
                                        className="flex items-center gap-2 px-3 py-2 text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors font-medium text-xs md:text-sm disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRefining ? 'animate-spin' : ''}`} />
                                        Rerun Analysis
                                    </button>
                                    <button
                                        onClick={handleDownloadPlaybook}
                                        className="flex items-center gap-2 px-3 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors font-medium text-xs md:text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export Delivery Playbook
                                    </button>
                                </div>

                                {/* Infographic */}
                                {images?.metacognitionInfographic && (
                                    <div className="w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 relative group">
                                        <img src={images.metacognitionInfographic} alt="Metacognition Infographic" className="w-full h-auto object-cover" />
                                        <RegenerateButton
                                            onClick={() => {
                                                if (onRegenerateInfographic && !isRefining) {
                                                    setExpandingSection('regen-metacognition');
                                                    onRegenerateInfographic('metacognition');
                                                }
                                            }}
                                            isRegenerating={expandingSection === 'regen-metacognition'}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            Cognitive Alignment Map
                                        </div>
                                    </div>
                                )}

                                {/* Consonance Matrix */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Target className="w-6 h-6 text-green-500" />
                                        Consonance Matrix (Alignment)
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-2">{getText('metaConsonanceDesc')}</p>
                                    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="p-4 w-1/4">Dimension</th>
                                                    <th className="p-4 w-1/6 text-center">Score (1-5)</th>
                                                    <th className="p-4">Evidence</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {metacognitionAnalysis.consonanceMatrix.map((item, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                        <td className="p-4 font-medium text-slate-900">{item.dimension}</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${item.alignmentScore >= 4 ? 'bg-green-100 text-green-700' : item.alignmentScore >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                                {item.alignmentScore}/5
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-600">{item.notes}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Dissonance Alerts */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <ShieldAlert className="w-6 h-6 text-red-500" />
                                        Dissonance Alerts (Risks)
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-2">{getText('metaDissonanceDesc')}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {metacognitionAnalysis.dissonanceAlerts.map((alert, i) => (
                                            <div key={i} className={`p-4 rounded-lg border-l-4 shadow-sm ${alert.severity === 'Critical' ? 'bg-red-50 border-red-500 text-red-900' : alert.severity === 'High' ? 'bg-orange-50 border-orange-500 text-orange-900' : 'bg-yellow-50 border-yellow-500 text-yellow-900'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-sm uppercase tracking-wide opacity-80">{alert.severity} Risk</h4>
                                                </div>
                                                <p className="font-semibold text-lg mb-2">{alert.description}</p>
                                                <div className="space-y-2 text-sm opacity-90">
                                                    <p><strong>Expectation:</strong> {alert.customerExpectation}</p>
                                                    <p><strong>Reality:</strong> {alert.reality}</p>
                                                    <div className="mt-2 pt-2 border-t border-black/10">
                                                        <strong>Mitigation:</strong> {alert.mitigationStrategy}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tension Management */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <RotateCcw className="w-6 h-6 text-blue-500" />
                                        Tension Management
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-2">{getText('metaTensionDesc')}</p>
                                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                        <div className="space-y-6">
                                            {metacognitionAnalysis.tensionManagement.map((tension, i) => (
                                                <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                    <h4 className="font-bold text-slate-900 mb-2">{tension.tension}</h4>
                                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">
                                                        <span>{tension.leftForce}</span>
                                                        <span>{tension.rightForce}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3 relative">
                                                        <div className="absolute top-0 bottom-0 w-2 bg-blue-500 rounded-full" style={{ left: '50%', transform: 'translateX(-50%)' }}></div>
                                                    </div>
                                                    <p className="text-sm text-slate-700 italic border-l-2 border-blue-400 pl-3">
                                                        "{tension.recommendation}"
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Perspectives Analysis (Expandable) */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Users className="w-6 h-6 text-indigo-500" />
                                        Perspective Analysis
                                    </h3>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        {/* Customer Perspective */}
                                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-100 relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-teal-800">Customer</h4>
                                                <SmartExpandPopover
                                                    title="Expand Customer Perspective"
                                                    onExpand={(config) => triggerMetacognitionExpand('Customer Perspective', config)}
                                                    isLoading={expandingSection === 'Customer Perspective'}
                                                />
                                            </div>
                                            {metacognitionAnalysis.expandedContent?.['Customer Perspective'] ? (
                                                <div className="prose prose-sm prose-teal max-w-none mt-2 text-xs">
                                                    <MarkdownWithMermaid content={metacognitionAnalysis.expandedContent['Customer Perspective']} />
                                                </div>
                                            ) : (
                                                <ul className="list-disc list-inside text-sm text-teal-900 space-y-1">
                                                    {(Array.isArray(metacognitionAnalysis.customerPerspective.statedGoals) ? metacognitionAnalysis.customerPerspective.statedGoals : []).slice(0, 4).map((g: string, i: number) => <li key={i}>{g}</li>)}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Nubiral Perspective */}
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-purple-800">Nubiral</h4>
                                                <SmartExpandPopover
                                                    title="Expand Nubiral Perspective"
                                                    onExpand={(config) => triggerMetacognitionExpand('Nubiral Perspective', config)}
                                                    isLoading={expandingSection === 'Nubiral Perspective'}
                                                />
                                            </div>
                                            {metacognitionAnalysis.expandedContent?.['Nubiral Perspective'] ? (
                                                <div className="prose prose-sm prose-purple max-w-none mt-2 text-xs">
                                                    <MarkdownWithMermaid content={metacognitionAnalysis.expandedContent['Nubiral Perspective']} />
                                                </div>
                                            ) : (
                                                <ul className="list-disc list-inside text-sm text-purple-900 space-y-1">
                                                    {(Array.isArray(metacognitionAnalysis.nubiralPerspective.deliveryStrengths) ? metacognitionAnalysis.nubiralPerspective.deliveryStrengths : []).slice(0, 4).map((s: string, i: number) => <li key={i}>{s}</li>)}
                                                </ul>
                                            )}
                                        </div>

                                        {/* Proposal Perspective */}
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-blue-800">Proposal</h4>
                                                <SmartExpandPopover
                                                    title="Expand Proposal Perspective"
                                                    onExpand={(config) => triggerMetacognitionExpand('Proposal Perspective', config)}
                                                    isLoading={expandingSection === 'Proposal Perspective'}
                                                />
                                            </div>
                                            {metacognitionAnalysis.expandedContent?.['Proposal Perspective'] ? (
                                                <div className="prose prose-sm prose-blue max-w-none mt-2 text-xs">
                                                    <MarkdownWithMermaid content={metacognitionAnalysis.expandedContent['Proposal Perspective']} />
                                                </div>
                                            ) : (
                                                <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
                                                    {(Array.isArray(metacognitionAnalysis.proposalPerspective.promisedOutcomes) ? metacognitionAnalysis.proposalPerspective.promisedOutcomes : []).slice(0, 4).map((o: string, i: number) => <li key={i}>{o}</li>)}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* LOGS Tab Content */}
                {activeTab === 'logs' && (
                    <div className="bg-slate-900 h-full overflow-hidden flex flex-col font-mono text-xs">
                        <div className="flex items-center gap-2 p-3 bg-slate-800 border-b border-slate-700 text-slate-400">
                            <Terminal className="w-4 h-4" />
                            <span>agent_runtime.log</span>
                        </div>
                        <div ref={logScrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-2 font-mono">
                                    <span className="text-slate-500 shrink-0">
                                        [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                    </span>
                                    <div>
                                        {log.type === 'thinking' && <span className="text-blue-400 font-bold mr-2">THINKING &gt;&gt;</span>}
                                        {log.type === 'success' && <span className="text-green-400 font-bold mr-2">SUCCESS &gt;&gt;</span>}
                                        {log.type === 'error' && <span className="text-red-400 font-bold mr-2">ERROR &gt;&gt;</span>}
                                        <span className="text-slate-300">{log.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cost Estimation Tab */}
                {activeTab === 'cost' && (
                    <div className="h-full overflow-y-auto p-8 space-y-8 animate-fade-in custom-scrollbar">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <BarChart3 className="w-6 h-6 text-green-600" />
                                </div>
                                Execution Cost Estimation
                            </h2>
                            <div className="flex items-center gap-4">
                                {/* SDM/TL Fixed Allocation Toggle */}
                                {costSettings && onUpdateCostSettings && (
                                    <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            checked={costSettings.fixedLeadershipAllocation}
                                            onChange={(e) => onUpdateCostSettings({
                                                ...costSettings,
                                                fixedLeadershipAllocation: e.target.checked
                                            })}
                                            className="rounded text-green-600 focus:ring-green-500"
                                        />
                                        <span>Fix SDM/TL at {costSettings.leadershipPercentage}% of team</span>
                                    </label>
                                )}
                                {!costEstimation && (
                                    <button
                                        onClick={onEstimateCost}
                                        disabled={isRefining}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        Calculate Cost Estimation
                                    </button>
                                )}
                                {/* Save Edits Button */}
                                {costIsDirty && (
                                    <button
                                        onClick={handleSaveEdits}
                                        disabled={isRefining}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 animate-pulse"
                                    >
                                        {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Save & Recalculate
                                    </button>
                                )}
                                {/* Rerun Cost Estimation - Uses latest proposal data */}
                                {costEstimation && (
                                    <button
                                        onClick={onEstimateCost}
                                        disabled={isRefining}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Recalculate cost using the latest version of the proposal"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isRefining ? 'animate-spin' : ''}`} />
                                        Rerun with Latest Proposal
                                    </button>
                                )}
                                {/* Sync Cost to Proposal - Update Team & WBS sections */}
                                {costEstimation && markdown && onShowSyncPreview && (
                                    <button
                                        onClick={onShowSyncPreview}
                                        disabled={isRefining}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Update Nubiral Team and WBS sections in the proposal with data from cost estimation"
                                    >
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                        Sync Team & WBS to Proposal
                                    </button>
                                )}
                            </div>
                        </div>

                        {!costEstimation ? (
                            <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-600 mb-2">No Estimation Generated Yet</h3>
                                <p className="text-slate-500 max-w-md mx-auto mb-6">
                                    Generate a detailed weekly execution plan and cost analysis based on the roles and timeline defined in the proposal.
                                </p>
                                <button
                                    onClick={onEstimateCost}
                                    disabled={isRefining}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Zap className="w-4 h-4" />
                                    {getText('generateEstimator')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {/* Standard Plan */}
                                {(() => {
                                    const stdHours = costEstimation?.optimalPlan?.roles?.reduce((acc, role) => acc + Object.values(role.allocations).reduce((sum, val) => sum + (val / 100) * 40, 0), 0) || 0;
                                    const stdPrice = (costEstimation?.optimalPlan?.totalCost || 0);
                                    const stdRate = stdHours ? stdPrice / stdHours : 0;

                                    return (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-slate-700">{getText('planA')} ({costEstimation?.optimalPlan?.totalWeeks || 0} {getText('weeks')})</h3>
                                                <div className="flex gap-4">
                                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-2">
                                                        {stdHours.toLocaleString('en-US', { maximumFractionDigits: 0 })}h
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-2">
                                                        {getText('blended')}: ${stdRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-xl font-bold text-green-700 bg-green-50 px-4 py-1 rounded-lg border border-green-100">
                                                        {getText('total')}: ${stdPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Architect Reasoning for Standard Plan */}
                                            {costEstimation?.optimalPlan?.reasoning && (
                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700">
                                                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-blue-600" />
                                                        {getText('reasoning')}
                                                    </h4>
                                                    <ReactMarkdown className="prose prose-sm max-w-none text-slate-600">
                                                        {editedCost?.optimalPlan?.reasoning || costEstimation.optimalPlan.reasoning}
                                                    </ReactMarkdown>
                                                </div>
                                            )}

                                            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                                        <tr>
                                                            <th className="px-2 py-3 font-semibold w-8"></th>
                                                            <th className="px-4 py-3 font-semibold">{getText('role')}</th>
                                                            <th className="px-4 py-3 font-semibold text-right">{getText('rate')}</th>
                                                            {Array.from({ length: editedCost?.optimalPlan?.totalWeeks || costEstimation?.optimalPlan?.totalWeeks || 0 }, (_, i) => (
                                                                <th key={i} className="px-2 py-3 text-center min-w-[50px]">W{i + 1}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(editedCost?.optimalPlan?.roles || costEstimation?.optimalPlan?.roles)?.map((role, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 group">
                                                                <td className="px-2 py-2">
                                                                    <button
                                                                        onClick={() => deleteRole(idx)}
                                                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                                                        title="Remove role"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-slate-800">
                                                                    <div className="flex items-center gap-2">
                                                                        <StressIndicator stress={role.stress} />
                                                                        <span>{role.role}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right text-slate-500 font-mono">${role.hourlyRate}</td>
                                                                {Array.from({ length: editedCost?.optimalPlan?.totalWeeks || costEstimation?.optimalPlan?.totalWeeks || 0 }, (_, i) => {
                                                                    const alloc = role.allocations?.[i + 1] || 0;
                                                                    let bgClass = "bg-transparent border-slate-200";
                                                                    if (alloc === 100) bgClass = "bg-green-500 text-white border-green-600";
                                                                    else if (alloc >= 75) bgClass = "bg-green-400 text-white border-green-500";
                                                                    else if (alloc >= 50) bgClass = "bg-green-300 text-slate-800 border-green-400";
                                                                    else if (alloc >= 25) bgClass = "bg-green-200 text-slate-800 border-green-300";
                                                                    else if (alloc > 0) bgClass = "bg-green-100 text-slate-600 border-green-200";

                                                                    return (
                                                                        <td key={i} className="px-1 py-2 text-center">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                step="25"
                                                                                value={alloc}
                                                                                onChange={(e) => updateAllocation(idx, i + 1, parseInt(e.target.value) || 0)}
                                                                                className={`w-12 text-xs py-1 px-1 rounded border text-center font-mono ${bgClass} focus:ring-2 focus:ring-blue-400 focus:outline-none`}
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                    );
                                })()}
                                {/* Add Role Button */}
                                <AddRoleButton onAddRole={addRole} />
                                {/* Agentic Improvement */}
                                <RefinementInput
                                    onSend={onRefineCost}
                                    isSending={isRefining}
                                    type="Cost Estimation plan"
                                    placeholder="Example: 'Shift 2 Backend devs to start in Week 1' or 'Extend Standard Plan by 2 weeks for more QA'"
                                />

                                {/* Cost Infographic */}
                                {images?.costInfographic && (
                                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm mt-6 relative group">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Cost Visualization</h3>
                                        <img src={images.costInfographic} alt="Cost Infographic" className="w-full h-auto rounded-lg" />
                                        <RegenerateButton
                                            onClick={() => onRegenerateInfographic?.('cost')}
                                            isRegenerating={expandingSection === 'regen-cost'}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Sync Preview Modal */}
            {syncPreview && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <ArrowUpRight className="w-6 h-6" />
                                <div>
                                    <h2 className="font-bold text-lg">Sync Cost → Proposal</h2>
                                    <p className="text-indigo-200 text-sm">Preview changes before applying</p>
                                </div>
                            </div>
                            <button onClick={onCancelSync} className="text-white/80 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Team Section Preview */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Section 4: Nubiral Team
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <span className="text-xs font-bold text-red-600 uppercase">Current (Will be replaced)</span>
                                        <div className="mt-2 text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {syncPreview.originalTeamSection.substring(0, 500)}...
                                        </div>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <span className="text-xs font-bold text-green-600 uppercase">New (From Cost Estimation)</span>
                                        <div className="mt-2 text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {syncPreview.teamSection.substring(0, 500)}...
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* WBS Section Preview */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-500" />
                                    Section 5: Execution Timeline (WBS)
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <span className="text-xs font-bold text-red-600 uppercase">Current (Will be replaced)</span>
                                        <div className="mt-2 text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {syncPreview.originalWbsSection.substring(0, 500)}...
                                        </div>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <span className="text-xs font-bold text-green-600 uppercase">New (From Cost Estimation)</span>
                                        <div className="mt-2 text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                            {syncPreview.wbsSection.substring(0, 500)}...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={onCancelSync}
                                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onApplySync}
                                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Apply Changes to Proposal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
        }
`}</style>
        </div >
    );
};

// --- Helper Components ---

const StressIndicator = ({ stress }: { stress?: any }) => {
    if (!stress) return <div className="w-6 h-6" />; // Placeholder alignment

    let Icon = Smile;
    let color = "text-green-500";
    let bgColor = "bg-green-100";

    if (stress.level === 'Medium' || (stress.score >= 4 && stress.score < 7)) { Icon = Meh; color = "text-yellow-600"; bgColor = "bg-yellow-100"; }
    else if (stress.level === 'High' || (stress.score >= 7 && stress.score < 9)) { Icon = Frown; color = "text-orange-500"; bgColor = "bg-orange-100"; }
    else if (stress.level === 'Extreme' || stress.score >= 9) { Icon = Flame; color = "text-red-600"; bgColor = "bg-red-100"; }

    return (
        <div className="group relative">
            <div className={`p-1 rounded-full ${bgColor} ${color} cursor-help transition-transform hover:scale-110`}>
                <Icon className="w-4 h-4" />
            </div>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all pointer-events-none border border-slate-700">
                <div className="font-bold border-b border-slate-600 pb-2 mb-2 flex justify-between items-center">
                    <span className="flex items-center gap-2">
                        <Icon className="w-3 h-3" />
                        {stress.level || (stress.score > 8 ? 'Extreme' : 'Review')} Load
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] bg-slate-700 border border-slate-600`}>Score: {stress.score}/10</span>
                </div>
                <div className="leading-relaxed text-slate-300">{stress.note}</div>
            </div>
        </div>
    );
};

const HeaderWithExpand = ({ children, level, onExpand, isExpanding, onUpdate, proposalMarkdown }: any) => {
    const headerText = React.Children.toArray(children).reduce((acc: string, child: any) => {
        return acc + (typeof child === 'string' ? child : '');
    }, '') as string;

    const Tag = `h${level}` as React.ElementType;
    const isThisExpanding = isExpanding === headerText;
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    const handleEdit = () => {
        if (!proposalMarkdown) return;

        // Split markdown into lines for easier processing
        const lines = proposalMarkdown.split(/\r?\n/);

        // Find the line index where this header starts
        let startIndex = -1;
        const headerPattern = new RegExp(`^#{${level}}\\s+.*${headerText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');

        for (let i = 0; i < lines.length; i++) {
            if (headerPattern.test(lines[i])) {
                startIndex = i;
                break;
            }
        }

        if (startIndex === -1) {
            setEditContent("");
            setIsEditing(true);
            return;
        }

        // Find the end: next heading at SAME level or HIGHER (fewer #), or end of document
        let endIndex = lines.length;
        const sameOrHigherPattern = new RegExp(`^#{1,${level}}\\s+`);

        for (let i = startIndex + 1; i < lines.length; i++) {
            if (sameOrHigherPattern.test(lines[i])) {
                endIndex = i;
                break;
            }
        }

        // Extract content (skip the header line itself)
        const sectionLines = lines.slice(startIndex + 1, endIndex);
        setEditContent(sectionLines.join('\n').trim());
        setIsEditing(true);
    };

    const handleSave = () => {
        if (onUpdate) {
            onUpdate(headerText, editContent);
        }
        setIsEditing(false);
    };

    return (
        <div className="group relative flex flex-col mt-8 mb-4">
            <div className="flex items-center justify-between">
                <Tag className="font-bold text-slate-900 m-0 w-full border-b border-transparent group-hover:border-slate-100 pb-1">
                    {children}
                </Tag>
                <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4 ${isThisExpanding || isEditing ? 'opacity-100' : ''}`}>
                    {onUpdate && !isEditing && (
                        <>
                            <button
                                onClick={handleEdit}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit Section Content"
                            >
                                <FilePenLine className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete the section: ${headerText}?`)) {
                                        onUpdate(headerText, null);
                                    }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Section"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                    {onExpand && !isEditing && (
                        <SmartExpandPopover
                            title={`Expand: ${headerText}`}
                            onExpand={(config) => onExpand(headerText, config)}
                            isLoading={!!isThisExpanding}
                        />
                    )}
                </div>
            </div>

            {isEditing && (
                <div className="mt-2 bg-white p-2 border border-blue-200 rounded-lg shadow-sm w-full">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-40 p-2 text-sm text-slate-700 focus:outline-none resize-y font-sans"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                            <Check className="w-3 h-3" /> Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ExpandableSection: React.FC<{
    title: string;
    defaultContent: string;
    expandedContent?: string;
    onExpand: (config: ExpandConfig) => void;
    isExpanding: boolean;
    type: 'kyc' | 'business' | 'design';
    sectionKey: string;
    onUpdate?: (type: 'kyc' | 'business' | 'design', section: string, content: string | null) => void;
}> = ({ title, defaultContent, expandedContent, onExpand, isExpanding, type, sectionKey, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(expandedContent || defaultContent);

    useEffect(() => {
        if (!isEditing) {
            setEditContent(expandedContent || defaultContent);
        }
    }, [expandedContent, defaultContent, isEditing]);

    const handleSave = () => {
        if (onUpdate) {
            onUpdate(type, sectionKey, editContent);
        }
        setIsEditing(false);
    };

    const handleEdit = () => {
        setEditContent(expandedContent || defaultContent);
        setIsEditing(true);
    };

    return (
        <div className="mt-4 group/section">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{title}</h4>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <>
                            <button
                                onClick={handleEdit}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit Content"
                            >
                                <FilePenLine className="w-3.5 h-3.5" />
                            </button>
                            {expandedContent && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you want to delete this expanded content?")) {
                                            if (onUpdate) onUpdate(type, sectionKey, null);
                                        }
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                    title="Delete Expansion"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </>
                    )}
                    <SmartExpandPopover
                        title={`Deep Dive: ${title}`}
                        onExpand={onExpand}
                        isLoading={isExpanding}
                    />
                </div>
            </div>

            {isEditing ? (
                <div className="bg-white p-2 border border-blue-200 rounded-lg shadow-sm">
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-40 p-2 text-sm text-slate-700 focus:outline-none resize-y font-sans"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                            <Check className="w-3 h-3" /> Save
                        </button>
                    </div>
                </div>
            ) : expandedContent ? (
                <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded border border-slate-200 relative group-hover/section:border-blue-200 transition-colors">
                    <MarkdownWithMermaid content={expandedContent} />
                </div>
            ) : (
                <p className="text-sm text-slate-600">{defaultContent}</p>
            )}
        </div>
    );
};

// Removed ExpandButton as it is replaced by SmartExpandPopover
// const ExpandButton ... 

const RegenerateButton: React.FC<{ onClick: () => void; isRegenerating: boolean }> = ({ onClick, isRegenerating }) => (
    <button
        onClick={onClick}
        disabled={isRegenerating}
        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-700 shadow-md hover:bg-white hover:text-blue-600 transition-all z-10"
        title="Regenerate this image"
    >
        {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
    </button>
);

// Add Role Button with selectable roles from HOURLY_RATES
const AddRoleButton: React.FC<{ onAddRole: (roleName: string, hourlyRate: number) => void }> = ({ onAddRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');

    // Use all roles from config, excluding Solution Architect (BSA handles that)
    const availableRoles = Object.entries(HOURLY_RATES)
        .filter(([name]) => !name.toLowerCase().includes('solution architect'))
        .map(([name, rate]) => ({ name, rate }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleAdd = () => {
        const role = availableRoles.find(r => r.name === selectedRole);
        if (role) {
            onAddRole(role.name, role.rate);
            setSelectedRole('');
            setIsOpen(false);
        }
    };

    return (
        <div className="mt-4">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 rounded-lg border border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Role
                </button>
            ) : (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Select a role...</option>
                        {availableRoles.map(role => (
                            <option key={role.name} value={role.name}>
                                {role.name} (${role.rate}/hr)
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAdd}
                        disabled={!selectedRole}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                        Add
                    </button>
                    <button
                        onClick={() => { setIsOpen(false); setSelectedRole(''); }}
                        className="text-slate-400 hover:text-slate-600 p-2"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

const FeedbackSection: React.FC<{
    title: string;
    placeholder: string;
    onSubmit: (text: string) => void;
    isRefining: boolean;
}> = ({ title, placeholder, onSubmit, isRefining }) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (!text.trim()) return;
        onSubmit(text);
        setText('');
    };

    return (
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-6 z-10">
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-blue-500" />
                {title} (Agentic Refinement)
            </h4>
            <div className="flex gap-2">
                <textarea
                    disabled={isRefining}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none disabled:bg-slate-100 disabled:text-slate-400"
                    rows={2}
                />
                <button
                    disabled={!text.trim() || isRefining}
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg px-4 flex items-center justify-center transition-colors"
                >
                    {isRefining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
            {isRefining && <p className="text-xs text-blue-600 mt-2 animate-pulse">Agent is updating artifacts and re-evaluating quality...</p>}
        </div>
    );
};

const LoadingState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-pulse">
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-blue-500" />
        <p className="text-lg font-medium text-slate-600">{message}</p>
        <p className="text-sm mt-2">Please wait while the agent completes this step.</p>
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; ready: boolean }> = ({ active, onClick, icon: Icon, label, ready }) => (
    <button
        onClick={onClick}
        disabled={!ready}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200
      ${active
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                : ready
                    ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    : 'text-slate-300 cursor-not-allowed'
            }`}
    >
        {ready ? (
            <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
        ) : (
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
        )}
        {label}
    </button>
);

// Robust Mermaid Component
const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
    const [svg, setSvg] = useState<string>('');
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        const renderChart = async () => {
            if (!chart) return;
            try {
                // Initialize strictly
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose'
                });

                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                // render returns { svg } which is a string. 
                // We do NOT append to body manually to avoid removeChild errors from React re-renders interfering.
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
                setError(false);
            } catch (e) {
                console.error("Mermaid error:", e);
                setError(true);
            }
        };
        renderChart();
    }, [chart]);

    if (error) {
        return (
            <div className="text-red-500 text-xs p-2 border border-red-200 bg-red-50 rounded font-mono whitespace-pre-wrap">
                Diagram Error (Invalid Syntax)
            </div>
        );
    }

    if (!svg) {
        return <div className="h-24 flex items-center justify-center text-slate-300 text-sm">Loading Diagram...</div>;
    }

    return (
        <div
            className="flex justify-center p-4 bg-white rounded-lg overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

/**
 * MarkdownWithMermaid - ReactMarkdown wrapper that properly renders Mermaid diagrams
 * Detects code blocks with 'mermaid' language OR common mermaid diagram types
 */
const MarkdownWithMermaid: React.FC<{ content: string; className?: string }> = ({ content, className = "" }) => {
    // Helper to detect if code content looks like a mermaid diagram
    const isMermaidContent = (content: string) => {
        const mermaidStarters = ['pie', 'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'gitGraph', 'mindmap', 'timeline'];
        const trimmed = content.trim();
        return mermaidStarters.some(s => trimmed.startsWith(s));
    };

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className={className}
            components={{
                code(props) {
                    const { children, className: codeClassName, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(codeClassName || '');
                    const codeContent = String(children).replace(/\n$/, '');

                    // Check for explicit mermaid tag OR auto-detect mermaid content
                    if ((match && match[1] === 'mermaid') || (!match && isMermaidContent(codeContent))) {
                        return <MermaidDiagram chart={codeContent} />;
                    }
                    return <code {...rest} className={codeClassName}>{children}</code>;
                }
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

const RefinementInput: React.FC<{
    onSend?: (text: string) => void;
    isSending: boolean;
    type: string;
    placeholder: string;
}> = ({ onSend, isSending, type, placeholder }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim() || !onSend) return;
        onSend(text);
        setText('');
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Refine {type} (Agentic)
            </h4>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isSending}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || isSending}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Refine
                </button>
            </div>
            {isSending && <div className="text-xs text-purple-600 mt-2 animate-pulse">Agent is updating plan...</div>}
        </div>
    );
};


export default ResultStep;
