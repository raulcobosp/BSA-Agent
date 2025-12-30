# Nubiral BSA – System Specification

> **Technical Architecture & Implementation Reference**  
> Version 2.0 | December 2024

---

## 1. System Architecture Overview

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend (React + TypeScript)"]
        UI[App.tsx - Orchestrator]
        IS[InputStep.tsx]
        PS[ProcessingStep.tsx]
        RS[ResultStep.tsx]
        SM[SessionManager.tsx]
        CW[ChatWidget.tsx]
    end

    subgraph Services["⚙️ Service Layer"]
        GS[geminiService.ts]
        SS[sessionService.ts]
        LU[logoUtils.ts]
    end

    subgraph Prompts["📝 Prompt Engineering"]
        KP[kyc.ts]
        BP[business.ts]
        AP[architect.ts]
        PP[proposal.ts]
        EP[evaluator.ts]
        CP[cost.ts]
        VP[validator.ts]
        IP[infographics.ts]
        MP[metacognition.ts]
    end

    subgraph External["🌐 External APIs"]
        GM[Google Gemini API]
        GS_API[Google Search Grounding]
        CB[Clearbit Logo API]
    end

    subgraph Storage["💾 Persistence"]
        IDB[(IndexedDB)]
    end

    UI --> IS & PS & RS & SM & CW
    RS --> GS
    GS --> Prompts
    GS --> GM & GS_API
    LU --> CB
    SS --> IDB
```

---

## 2. Agent Pipeline Architecture

The system implements a **multi-agent orchestration pattern** where specialized AI agents process sequentially, each building on artifacts from previous stages.

```mermaid
flowchart LR
    subgraph Phase1["Phase 1: Research"]
        KYC[🔍 KYC Agent<br/>conductResearch]
        KYC_IMG[📷 KYC Infographic]
    end

    subgraph Phase2["Phase 2: Analysis"]
        BIZ[📊 Business Analyst<br/>analyzeBusinessCase]
        BIZ_IMG[📷 Business Infographic]
    end

    subgraph Phase3["Phase 3: Design"]
        ARCH[🏗️ Architect Agent<br/>designSolution]
        VAL[✓ Validator<br/>validateSolutionDesign]
        ARCH_IMG[📷 Architecture Infographic]
    end

    subgraph Phase4["Phase 4: Costing"]
        COST[💰 Cost Estimator<br/>generateCostEstimation]
        COST_IMG[📷 Cost Infographic]
    end

    subgraph Phase5["Phase 5: Metacognition"]
        META[🧠 Metacognition<br/>analyzeMetacognition]
        META_IMG[📷 Meta Infographic]
    end

    subgraph Phase6["Phase 6: Generation & Audit"]
        PROP[📄 Proposal Writer<br/>generateProposal]
        COVER[📷 Cover Image]
        AUDIT[✅ SMART Auditor<br/>evaluateProposal]
        SCORE{Score ≥ 90?}
        REFINE[🔄 Auto-Correction<br/>extractImprovements]
        FINAL[📋 Final Proposal]
    end

    KYC --> KYC_IMG --> BIZ
    BIZ --> BIZ_IMG --> ARCH
    ARCH <--> VAL
    ARCH --> ARCH_IMG --> COST
    COST --> COST_IMG --> META
    META --> META_IMG --> PROP
    PROP --> COVER --> AUDIT
    AUDIT --> SCORE
    SCORE -->|No| REFINE
    REFINE --> PROP
    SCORE -->|Yes| FINAL
```

---

## 2.1 SMART Evaluation Loop Detail

The **SMART Auditor** is a critical quality gate that ensures proposals meet professional standards:

```mermaid
flowchart TD
    A[📄 Generated Proposal] --> B[✅ SMART Auditor]
    B --> C[Calculate Score 0-100]
    C --> D{Score ≥ 90?}
    D -->|No| E[Extract Critical Issues]
    E --> F[Generate Improvement Feedback]
    F --> G[🔄 Regenerate Proposal<br/>with Corrections]
    G --> B
    D -->|Yes| H{Critical Issues?}
    H -->|Yes| E
    H -->|No| I[✅ Quality Approved]
    I --> J[📋 Final Proposal]
```

**SMART Criteria Evaluated:**

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Specific** | 20% | Clear objectives, defined deliverables |
| **Measurable** | 20% | Quantifiable KPIs, success metrics |
| **Achievable** | 20% | Realistic scope, resource alignment |
| **Relevant** | 20% | Business need alignment, ROI justification |
| **Time-bound** | 20% | Defined milestones, timeline clarity |

**Loop Termination Conditions:**
- Score ≥ 90 AND no critical issues → Approved
- Maximum 2 refinement iterations → Forced approval with warnings



## 3. Data Model (TypeScript Interfaces)

### 3.1 Core Request/Response Types

```mermaid
classDiagram
    class ProposalRequest {
        +string companyName
        +string businessCase
        +HyperScaler hyperScaler
        +string language
        +string textModel
        +string imageModel
        +ContextDensity contextDensity
        +number apiDelay
    }

    class ResearchResult {
        +string summary
        +Source[] sources
        +string[] strategicGoals
        +DetailedAnalysis detailedAnalysis
        +Record expandedContent
    }

    class BusinessAnalysis {
        +string problemStatement
        +string[] rootCauseAnalysis
        +string[] currentProcessFlaws
        +BusinessValue expectedBusinessValue
        +string[] keyPainPoints
        +string[] userStories
        +string mermaidDiagram
    }

    class SolutionDesign {
        +string architectureOverview
        +string[] keyComponents
        +string rationale
        +string mermaidCode
        +string thinkingProcess
        +BusinessTechMap[] businessMapping
        +boolean isApproved
    }

    ProposalRequest --> ResearchResult : produces
    ResearchResult --> BusinessAnalysis : informs
    BusinessAnalysis --> SolutionDesign : drives
```

### 3.2 Cost Estimation Model

```mermaid
classDiagram
    class CostEstimation {
        +WeeklyPlan optimalPlan
        +ProposalComparison proposalComparison
        +boolean isDirty
    }

    class WeeklyPlan {
        +number totalWeeks
        +RoleAllocation[] roles
        +number totalCost
        +string reasoning
        +string frictionAnalysis
    }

    class RoleAllocation {
        +string role
        +number hourlyRate
        +Object allocations
        +StressIndicator stress
    }

    class StressIndicator {
        +Level level
        +number score
        +string note
    }

    CostEstimation --> WeeklyPlan
    WeeklyPlan --> RoleAllocation
    RoleAllocation --> StressIndicator
```

### 3.3 Metacognition Model

```mermaid
classDiagram
    class MetacognitionAnalysis {
        +CustomerPerspective customerPerspective
        +NubiralPerspective nubiralPerspective
        +ProposalPerspective proposalPerspective
        +ConsonanceItem[] consonanceMatrix
        +DissonanceAlert[] dissonanceAlerts
        +TensionItem[] tensionManagement
        +string[] deliveryRecommendations
    }

    class ConsonanceItem {
        +string dimension
        +string customerView
        +string proposalPromise
        +string nubiralCapability
        +number alignmentScore
        +string notes
    }

    class DissonanceAlert {
        +Severity severity
        +string description
        +string customerExpectation
        +string reality
        +string mitigationStrategy
    }

    MetacognitionAnalysis --> ConsonanceItem
    MetacognitionAnalysis --> DissonanceAlert
```

---

## 4. Service Layer Functions

### 4.1 geminiService.ts (42 Exported Functions)

| Category | Function | Purpose |
|----------|----------|---------|
| **Research** | `conductResearch` | KYC via Google Search grounding |
| | `researchArchitectServices` | Cloud service lookup |
| **Analysis** | `analyzeBusinessCase` | Problem/ROI analysis |
| | `expandBusinessSection` | Deep-dive expansion |
| **Design** | `designSolution` | Architecture generation |
| | `validateSolutionDesign` | Logic validation loop |
| | `refineDesign` | User-directed refinement |
| **Costing** | `generateCostEstimation` | Role allocation |
| | `refineCostEstimation` | Iterative refinement |
| **Metacognition** | `analyzeMetacognition` | Stakeholder analysis |
| | `expandMetacognitionSection` | Section expansion |
| **Proposal** | `generateProposal` | Markdown document |
| | `evaluateProposal` | SMART audit scoring |
| **Images** | `generateKYCInfographic` | Research visualization |
| | `generateBusinessInfographic` | Business case visual |
| | `generateArchitectureInfographic` | Architecture diagram |
| | `generateCostInfographic` | Cost breakdown visual |
| | `generateMetacognitionInfographic` | Stakeholder map |
| | `generateCoverWithLogos` | Cover + logo compositing |

### 4.2 sessionService.ts (IndexedDB)

| Function | Purpose |
|----------|---------|
| `openDB()` | Initialize/open IndexedDB |
| `saveSession(session)` | Create or update session |
| `loadSession(id)` | Retrieve full session |
| `listSessions()` | Get all session summaries |
| `deleteSession(id)` | Remove session |

---

## 5. Context Density Filtering

The system implements a **context filter** that simulates human information handoff:

```mermaid
graph TD
    A[Full Context] --> B{Density Setting}
    B -->|High| C[Complete Detail<br/>All fields included]
    B -->|Medium| D[Brief Summary<br/>Key items only]
    B -->|Low| E[Executive Summary<br/>Minimal context]
```

| Level | Token Impact | Use Case |
|-------|--------------|----------|
| High | ~8000 tokens | Complex enterprise projects |
| Medium | ~4000 tokens | Standard proposals |
| Low | ~2000 tokens | Quick drafts, rate limit management |

---

## 6. Image Generation Pipeline

```mermaid
flowchart LR
    subgraph Input["Input Context"]
        CTX[Structured Data]
        PROMPT[Prompt Template]
    end

    subgraph Generation["Gemini Vision"]
        GEN[generateImageFromPrompt]
    end

    subgraph Output["Output"]
        B64[Base64 PNG]
    end

    subgraph Compositing["Logo Compositing"]
        COVER[Cover Image]
        CUST_LOGO[Customer Logo<br/>Clearbit API]
        NUB_LOGO[Nubiral Logo<br/>assets/nubiral.png]
        COMP[compositeLogosOnCover]
    end

    CTX --> PROMPT --> GEN --> B64
    COVER --> COMP
    CUST_LOGO --> COMP
    NUB_LOGO --> COMP
    COMP --> B64
```

---

## 7. State Management

### 7.1 Application State (App.tsx)

```typescript
// Core State
const [step, setStep] = useState<AppStep>(AppStep.INPUT);
const [currentRequest, setCurrentRequest] = useState<ProposalRequest | null>(null);

// Agent Artifacts
const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
const [businessAnalysis, setBusinessAnalysis] = useState<BusinessAnalysis | null>(null);
const [solutionDesign, setSolutionDesign] = useState<SolutionDesign | null>(null);
const [costEstimation, setCostEstimation] = useState<CostEstimation | null>(null);
const [metacognitionAnalysis, setMetacognitionAnalysis] = useState<MetacognitionAnalysis | null>(null);
const [proposalImages, setProposalImages] = useState<ProposalImages | null>(null);
const [resultMarkdown, setResultMarkdown] = useState<string>('');

// Session Management
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
```

### 7.2 Persistence Schema (IndexedDB)

```mermaid
erDiagram
    SESSION {
        string id PK
        string name
        number timestamp
        number lastModified
    }
    SESSION_DATA {
        ProposalRequest request
        ResearchResult research
        BusinessAnalysis business
        SolutionDesign design
        string proposalMarkdown
        CostEstimation costEstimation
        MetacognitionAnalysis metacognition
        ProposalImages images
        string evaluationScore
        AppStep step
        AgentLog[] logs
        Tab activeTab
    }
    SESSION ||--|| SESSION_DATA : contains
```

---

## 8. UI Component Architecture

```mermaid
flowchart TB
    subgraph App["App.tsx (State Manager)"]
        direction TB
        Header[Global Header<br/>Save/Sessions]
        Router{Step Router}
    end

    subgraph Views["View Components"]
        IS[InputStep<br/>Request Form]
        PS[ProcessingStep<br/>Agent Console]
        RS[ResultStep<br/>Multi-Tab Results]
    end

    subgraph ResultTabs["ResultStep Tabs"]
        KYC[KYC Tab]
        BIZ[Business Tab]
        ARCH[Architecture Tab]
        PROP[Proposal Tab]
        COST[Cost Tab]
        META[Metacognition Tab]
        LOGS[Logs Tab]
    end

    subgraph Overlays["Overlay Components"]
        SM[SessionManager<br/>Left Sidebar]
        CW[ChatWidget<br/>Expert Assistant]
    end

    App --> Header
    App --> Router
    Router -->|INPUT| IS
    Router -->|PROCESSING| PS
    Router -->|RESULT| RS
    RS --> ResultTabs
    App --> SM
    RS --> CW
```

---

## 9. Rate Limiting & Error Handling

```mermaid
flowchart TD
    A[API Call] --> B{Success?}
    B -->|Yes| C[Return Result]
    B -->|No| D{Retry Count < 2?}
    D -->|Yes| E[Wait 1.5s]
    E --> A
    D -->|No| F[Log Error]
    F --> G[Return Fallback/Throw]

    H[Execution Delay] --> I{Delay > 0?}
    I -->|Yes| J[sleep delay seconds]
    J --> A
    I -->|No| A
```

---

## 10. Security Considerations

| Aspect | Implementation |
|--------|----------------|
| API Key | Environment variable (.env.local) |
| Data Storage | Client-side only (IndexedDB) |
| Network | HTTPS to Google APIs |
| Images | Base64 encoded, no external hosting |
| Session Data | Local browser storage, no server sync |

---

## 11. Performance Characteristics

| Metric | Typical Value |
|--------|---------------|
| Full pipeline execution | 60-120 seconds |
| Single image generation | 5-15 seconds |
| Session save/load | < 500ms |
| Context filtering (Low) | ~60% token reduction |

---

## 12. Extension Points

| Extension | Implementation Path |
|-----------|---------------------|
| New Hyperscaler | Add to `HyperScaler` type + prompts |
| New Language | Add translations to `ResultStep.tsx` |
| New AI Model | Update `config/models.ts` |
| New Agent | Create prompt in `/prompts/`, add function to `geminiService.ts` |
| New Infographic | Add type to `ProposalImages`, create generator function |

---

<p align="center">
<strong>Nubiral BSA System Specification v2.0</strong>
</p>
