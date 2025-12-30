
export type HyperScaler = 'AWS' | 'Azure' | 'GCP' | 'OCI';
export type ContextDensity = 'low' | 'medium' | 'high';

export interface ProposalRequest {
  companyName: string;
  businessCase: string;
  hyperScaler: HyperScaler;
  language: string;
  textModel: string;
  imageModel: string;
  contextDensity: ContextDensity;
  apiDelay: number;
}

export interface DetailedAnalysis {
  industryLandscape: string;
  challengesAndRisks: string[]; // Challenges, Prohibitions, Consequence of Inaction
  keyStakeholders: string[];
  hyperscalerAffinity: string; // Current leanings
  businessMaturity: string; // Vs Industry Leaders
  eaMaturity: string; // Enterprise Architecture & AI/GenAI Maturity
  genAiMaturity: string; // Specific GenAI focus
  competitors: { global: string[]; local: string[] };
  swot?: { strengths: string[], weaknesses: string[], opportunities: string[], threats: string[] };
  regulatoryConstraints?: string[];
}

export type Tab = 'kyc' | 'business' | 'design' | 'proposal' | 'evaluation' | 'cost' | 'metacognition' | 'logs';

export interface BusinessAnalysis {
  problemStatement: string;
  rootCauseAnalysis: string[];
  currentProcessFlaws: string[];
  expectedBusinessValue: {
    roi: string;
    efficiencyGains: string;
    otherBenefits: string[];
  };
  keyPainPoints: string[];
  userStories: string[];
  mermaidDiagram: string;
  expandedContent?: Record<string, string>;
}

export interface ResearchResult {
  summary: string;
  sources: { title: string; uri: string }[];
  strategicGoals: string[];
  detailedAnalysis: DetailedAnalysis; // New detailed field
  // Dictionary to store "Expanded" markdown content for specific keys (e.g. 'industryLandscape', 'competitors')
  expandedContent?: Record<string, string>;
}

export interface BusinessTechMap {
  businessGoal: string;
  technicalSolution: string;
  outcome: string;
}

export interface SolutionDesign {
  architectureOverview: string;
  keyComponents: string[];
  rationale: string;
  mermaidCode: string;
  thinkingProcess?: string; // Exposed rationale
  businessMapping?: BusinessTechMap[]; // Business alignment
  expandedContent?: Record<string, string>; // Support for Expand AI
  isApproved?: boolean; // New: User approval flag
}

export interface ProposalImages {
  coverImage?: string;
  kycInfographic?: string;
  businessInfographic?: string;      // NEW: Generated after Business Analysis
  architectureInfographic?: string;  // NEW: Generated after Solution Design
  costInfographic?: string;          // NEW: Generated after Cost Estimation
  metacognitionInfographic?: string; // NEW: Generated after Metacognition Analysis
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'thinking' | 'error' | 'paused';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Optional base64 data URI for image attachments
  timestamp: Date;
}

export type ExpandDensity = 'Low' | 'Medium' | 'High';

export interface ExpandConfig {
  instruction: string;
  density: ExpandDensity;
}

export enum AppStep {
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
}

export interface RoleAllocation {
  role: string;
  hourlyRate: number;
  allocations: { [week: string]: number }; // percentage 0-100
  stress?: {
    level: 'Low' | 'Medium' | 'High' | 'Extreme';
    score: number; // 1-10 (1=Chill, 10=Burnout)
    note: string; // Brief explanation
  };
}

export interface WeeklyPlan {
  totalWeeks: number;
  roles: RoleAllocation[];
  totalCost: number;
  reasoning: string; // Explanation of role selection and allocation vs timeline
  frictionAnalysis?: string; // For aggressive plans
}

export interface ProposalComparison {
  proposedWeeks: number;
  optimalWeeks: number;
  weeksDifference: number;
  costDifference: number;
  recommendation: string;
}

export interface CostEstimation {
  optimalPlan: WeeklyPlan;
  proposalComparison?: ProposalComparison;
  // Editability tracking
  isDirty?: boolean;
}

export interface CostSettings {
  fixedLeadershipAllocation: boolean;  // When true, auto-calculate SDM/TL at percentage
  leadershipPercentage: number;        // Default 12.5
}

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-10
  critique: string; // Detailed explanation of what is missing
  missingRequirements: string[]; // List of specific root causes not addressed
}

// ============ METACOGNITION ANALYSIS ============

export interface CustomerPerspective {
  statedGoals: string[];
  implicitAssumptions: string[];
  riskTolerance: 'Low' | 'Medium' | 'High';
  organizationalConstraints: string[];
  successDefinition: string;
}

export interface NubiralPerspective {
  deliveryStrengths: string[];
  potentialGaps: string[];
  resourceConsiderations: string[];
  commercialFactors: string[];
  experienceRelevance: string;
}

export interface ProposalPerspective {
  promisedOutcomes: string[];
  implicitCommitments: string[];
  scopeBoundaries: string[];
  dependencyAssumptions: string[];
}

export interface ConsonanceItem {
  dimension: string;
  customerView: string;
  proposalPromise: string;
  nubiralCapability: string;
  alignmentScore: 1 | 2 | 3 | 4 | 5; // 1=Conflict, 5=Perfect alignment
  notes: string;
}

export interface DissonanceAlert {
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  customerExpectation: string;
  reality: string;
  mitigationStrategy: string;
}

export interface TensionItem {
  tension: string;
  leftForce: string;
  rightForce: string;
  currentBalance: string;
  recommendation: string;
  checkpoints: string[];
}

export interface MetacognitionAnalysis {
  customerPerspective: CustomerPerspective;
  nubiralPerspective: NubiralPerspective;
  proposalPerspective: ProposalPerspective;
  consonanceMatrix: ConsonanceItem[];
  dissonanceAlerts: DissonanceAlert[];
  tensionManagement: TensionItem[];
  deliveryRecommendations: string[];
  groundingSources?: string[];
  expandedContent?: Record<string, string>;
}

// ============ SESSION MANAGER ============

export interface SavedSession {
  id: string; // UUID
  name: string;
  timestamp: number;
  lastModified: number;
  data: {
    request: ProposalRequest | null;
    research: ResearchResult | null;
    business: BusinessAnalysis | null;
    design: SolutionDesign | null;
    proposalMarkdown: string;
    costEstimation: CostEstimation | null;
    metacognition: MetacognitionAnalysis | null;
    images: ProposalImages;
    evaluationScore: string;
    step: AppStep;
    logs: AgentLog[];
    activeTab: Tab; // Restore the tab view
  }
}

export interface SessionSummary {
  id: string;
  name: string;
  timestamp: number;
  lastModified: number;
  previewText: string; // Short context e.g. "Retail - AWS"
}
