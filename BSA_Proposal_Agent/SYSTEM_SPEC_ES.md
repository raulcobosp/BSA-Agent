# Nubiral BSA – Especificación del Sistema

> **Referencia de Arquitectura Técnica e Implementación**  
> Versión 2.0 | Diciembre 2024

---

## 1. Arquitectura General del Sistema

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend (React + TypeScript)"]
        UI[App.tsx - Orquestador]
        IS[InputStep.tsx]
        PS[ProcessingStep.tsx]
        RS[ResultStep.tsx]
        SM[SessionManager.tsx]
        CW[ChatWidget.tsx]
    end

    subgraph Services["⚙️ Capa de Servicios"]
        GS[geminiService.ts]
        SS[sessionService.ts]
        LU[logoUtils.ts]
    end

    subgraph Prompts["📝 Ingeniería de Prompts"]
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

    subgraph External["🌐 APIs Externas"]
        GM[API Google Gemini]
        GS_API[Google Search Grounding]
        CB[API Clearbit Logo]
    end

    subgraph Storage["💾 Persistencia"]
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

## 2. Arquitectura del Pipeline de Agentes

El sistema implementa un **patrón de orquestación multi-agente** donde agentes de IA especializados procesan secuencialmente, cada uno construyendo sobre artefactos de etapas anteriores.

```mermaid
flowchart LR
    subgraph Fase1["Fase 1: Investigación"]
        KYC[🔍 Agente KYC<br/>conductResearch]
        KYC_IMG[📷 Infografía KYC]
    end

    subgraph Fase2["Fase 2: Análisis"]
        BIZ[📊 Analista de Negocio<br/>analyzeBusinessCase]
        BIZ_IMG[📷 Infografía Negocio]
    end

    subgraph Fase3["Fase 3: Diseño"]
        ARCH[🏗️ Agente Arquitecto<br/>designSolution]
        VAL[✓ Validador<br/>validateSolutionDesign]
        ARCH_IMG[📷 Infografía Arquitectura]
    end

    subgraph Fase4["Fase 4: Costeo"]
        COST[💰 Estimador de Costos<br/>generateCostEstimation]
        COST_IMG[📷 Infografía Costos]
    end

    subgraph Fase5["Fase 5: Metacognición"]
        META[🧠 Metacognición<br/>analyzeMetacognition]
        META_IMG[📷 Infografía Meta]
    end

    subgraph Fase6["Fase 6: Generación y Auditoría"]
        PROP[📄 Escritor de Propuesta<br/>generateProposal]
        COVER[📷 Imagen Portada]
        AUDIT[✅ Auditor SMART<br/>evaluateProposal]
        SCORE{¿Puntaje ≥ 90?}
        REFINE[🔄 Auto-Corrección<br/>extractImprovements]
        FINAL[📋 Propuesta Final]
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
    SCORE -->|Sí| FINAL
```

---

## 2.1 Detalle del Bucle de Evaluación SMART

El **Auditor SMART** es una puerta de calidad crítica que asegura que las propuestas cumplan estándares profesionales:

```mermaid
flowchart TD
    A[📄 Propuesta Generada] --> B[✅ Auditor SMART]
    B --> C[Calcular Puntaje 0-100]
    C --> D{¿Puntaje ≥ 90?}
    D -->|No| E[Extraer Problemas Críticos]
    E --> F[Generar Retroalimentación de Mejora]
    F --> G[🔄 Regenerar Propuesta<br/>con Correcciones]
    G --> B
    D -->|Sí| H{¿Problemas Críticos?}
    H -->|Sí| E
    H -->|No| I[✅ Calidad Aprobada]
    I --> J[📋 Propuesta Final]
```

**Criterios SMART Evaluados:**

| Criterio | Peso | Descripción |
|----------|------|-------------|
| **Specific** (Específico) | 20% | Objetivos claros, entregables definidos |
| **Measurable** (Medible) | 20% | KPIs cuantificables, métricas de éxito |
| **Achievable** (Alcanzable) | 20% | Alcance realista, alineación de recursos |
| **Relevant** (Relevante) | 20% | Alineación con necesidad de negocio, justificación ROI |
| **Time-bound** (Temporal) | 20% | Hitos definidos, claridad de cronograma |

**Condiciones de Terminación del Bucle:**
- Puntaje ≥ 90 Y sin problemas críticos → Aprobado
- Máximo 2 iteraciones de refinamiento → Aprobación forzada con advertencias



## 3. Modelo de Datos (Interfaces TypeScript)

### 3.1 Tipos de Solicitud/Respuesta

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

    ProposalRequest --> ResearchResult : produce
    ResearchResult --> BusinessAnalysis : informa
    BusinessAnalysis --> SolutionDesign : impulsa
```

### 3.2 Modelo de Estimación de Costos

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

### 3.3 Modelo de Metacognición

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

## 4. Funciones de la Capa de Servicios

### 4.1 geminiService.ts (42 Funciones Exportadas)

| Categoría | Función | Propósito |
|-----------|---------|-----------|
| **Investigación** | `conductResearch` | KYC vía Google Search grounding |
| | `researchArchitectServices` | Búsqueda de servicios cloud |
| **Análisis** | `analyzeBusinessCase` | Análisis de problema/ROI |
| | `expandBusinessSection` | Expansión profunda |
| **Diseño** | `designSolution` | Generación de arquitectura |
| | `validateSolutionDesign` | Bucle de validación lógica |
| | `refineDesign` | Refinamiento dirigido por usuario |
| **Costeo** | `generateCostEstimation` | Asignación de roles |
| | `refineCostEstimation` | Refinamiento iterativo |
| **Metacognición** | `analyzeMetacognition` | Análisis de stakeholders |
| | `expandMetacognitionSection` | Expansión de sección |
| **Propuesta** | `generateProposal` | Documento Markdown |
| | `evaluateProposal` | Puntuación auditoría SMART |
| **Imágenes** | `generateKYCInfographic` | Visualización de investigación |
| | `generateBusinessInfographic` | Visual de caso de negocio |
| | `generateArchitectureInfographic` | Diagrama de arquitectura |
| | `generateCostInfographic` | Visual de desglose de costos |
| | `generateMetacognitionInfographic` | Mapa de stakeholders |
| | `generateCoverWithLogos` | Portada + composición de logos |

### 4.2 sessionService.ts (IndexedDB)

| Función | Propósito |
|---------|-----------|
| `openDB()` | Inicializar/abrir IndexedDB |
| `saveSession(session)` | Crear o actualizar sesión |
| `loadSession(id)` | Recuperar sesión completa |
| `listSessions()` | Obtener resúmenes de sesiones |
| `deleteSession(id)` | Eliminar sesión |

---

## 5. Filtrado de Densidad de Contexto

El sistema implementa un **filtro de contexto** que simula el traspaso de información humano:

```mermaid
graph TD
    A[Contexto Completo] --> B{Configuración de Densidad}
    B -->|Alta| C[Detalle Completo<br/>Todos los campos incluidos]
    B -->|Media| D[Resumen Breve<br/>Solo elementos clave]
    B -->|Baja| E[Resumen Ejecutivo<br/>Contexto mínimo]
```

| Nivel | Impacto en Tokens | Caso de Uso |
|-------|-------------------|-------------|
| Alto | ~8000 tokens | Proyectos empresariales complejos |
| Medio | ~4000 tokens | Propuestas estándar |
| Bajo | ~2000 tokens | Borradores rápidos, gestión de límites |

---

## 6. Pipeline de Generación de Imágenes

```mermaid
flowchart LR
    subgraph Entrada["Contexto de Entrada"]
        CTX[Datos Estructurados]
        PROMPT[Plantilla de Prompt]
    end

    subgraph Generacion["Gemini Vision"]
        GEN[generateImageFromPrompt]
    end

    subgraph Salida["Salida"]
        B64[PNG Base64]
    end

    subgraph Composicion["Composición de Logos"]
        COVER[Imagen Portada]
        CUST_LOGO[Logo Cliente<br/>API Clearbit]
        NUB_LOGO[Logo Nubiral<br/>assets/nubiral.png]
        COMP[compositeLogosOnCover]
    end

    CTX --> PROMPT --> GEN --> B64
    COVER --> COMP
    CUST_LOGO --> COMP
    NUB_LOGO --> COMP
    COMP --> B64
```

---

## 7. Gestión de Estado

### 7.1 Estado de la Aplicación (App.tsx)

```typescript
// Estado Principal
const [step, setStep] = useState<AppStep>(AppStep.INPUT);
const [currentRequest, setCurrentRequest] = useState<ProposalRequest | null>(null);

// Artefactos de Agentes
const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
const [businessAnalysis, setBusinessAnalysis] = useState<BusinessAnalysis | null>(null);
const [solutionDesign, setSolutionDesign] = useState<SolutionDesign | null>(null);
const [costEstimation, setCostEstimation] = useState<CostEstimation | null>(null);
const [metacognitionAnalysis, setMetacognitionAnalysis] = useState<MetacognitionAnalysis | null>(null);
const [proposalImages, setProposalImages] = useState<ProposalImages | null>(null);
const [resultMarkdown, setResultMarkdown] = useState<string>('');

// Gestión de Sesiones
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
```

### 7.2 Esquema de Persistencia (IndexedDB)

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
    SESSION ||--|| SESSION_DATA : contiene
```

---

## 8. Arquitectura de Componentes UI

```mermaid
flowchart TB
    subgraph App["App.tsx (Gestor de Estado)"]
        direction TB
        Header[Cabecera Global<br/>Guardar/Sesiones]
        Router{Router de Pasos}
    end

    subgraph Views["Componentes de Vista"]
        IS[InputStep<br/>Formulario de Solicitud]
        PS[ProcessingStep<br/>Consola de Agente]
        RS[ResultStep<br/>Resultados Multi-Tab]
    end

    subgraph ResultTabs["Pestañas de ResultStep"]
        KYC[Pestaña KYC]
        BIZ[Pestaña Negocio]
        ARCH[Pestaña Arquitectura]
        PROP[Pestaña Propuesta]
        COST[Pestaña Costos]
        META[Pestaña Metacognición]
        LOGS[Pestaña Logs]
    end

    subgraph Overlays["Componentes Overlay"]
        SM[SessionManager<br/>Barra Lateral Izquierda]
        CW[ChatWidget<br/>Asistente Experto]
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

## 9. Limitación de Tasa y Manejo de Errores

```mermaid
flowchart TD
    A[Llamada API] --> B{¿Éxito?}
    B -->|Sí| C[Retornar Resultado]
    B -->|No| D{¿Reintentos < 2?}
    D -->|Sí| E[Esperar 1.5s]
    E --> A
    D -->|No| F[Registrar Error]
    F --> G[Retornar Fallback/Lanzar Error]

    H[Delay de Ejecución] --> I{¿Delay > 0?}
    I -->|Sí| J[sleep delay segundos]
    J --> A
    I -->|No| A
```

---

## 10. Consideraciones de Seguridad

| Aspecto | Implementación |
|---------|----------------|
| API Key | Variable de entorno (.env.local) |
| Almacenamiento de Datos | Solo lado cliente (IndexedDB) |
| Red | HTTPS hacia APIs de Google |
| Imágenes | Codificadas en Base64, sin hosting externo |
| Datos de Sesión | Almacenamiento local del navegador, sin sincronización con servidor |

---

## 11. Características de Rendimiento

| Métrica | Valor Típico |
|---------|--------------|
| Ejecución completa del pipeline | 60-120 segundos |
| Generación de imagen individual | 5-15 segundos |
| Guardar/cargar sesión | < 500ms |
| Filtrado de contexto (Bajo) | ~60% reducción de tokens |

---

## 12. Puntos de Extensión

| Extensión | Ruta de Implementación |
|-----------|------------------------|
| Nuevo Hyperscaler | Agregar al tipo `HyperScaler` + prompts |
| Nuevo Idioma | Agregar traducciones a `ResultStep.tsx` |
| Nuevo Modelo IA | Actualizar `config/models.ts` |
| Nuevo Agente | Crear prompt en `/prompts/`, agregar función a `geminiService.ts` |
| Nueva Infografía | Agregar tipo a `ProposalImages`, crear función generadora |

---

<p align="center">
<strong>Especificación del Sistema Nubiral BSA v2.0</strong>
</p>
