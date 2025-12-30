import React, { useEffect, useRef, useMemo } from 'react';
import { AgentLog } from '../types';
import { Loader2, CheckCircle2, Terminal, BrainCircuit, Search, FilePenLine, Image as ImageIcon, BarChart3, ShieldCheck, Workflow } from 'lucide-react';

interface ProcessingStepProps {
  logs: AgentLog[];
}

// Define all pipeline phases with their detection patterns
const PIPELINE_PHASES = [
  {
    id: 'kyc',
    title: 'KYC Research',
    icon: Search,
    patterns: ['[ReAct Researcher]', 'Starting KYC Research', 'conducting research', 'Research complete'],
    completionPatterns: ['Research complete', 'KYC Infographic generated']
  },
  {
    id: 'kyc_visual',
    title: 'KYC Visual',
    icon: ImageIcon,
    patterns: ['[Visualizer] Generating KYC', 'KYC Infographic'],
    completionPatterns: ['KYC Infographic generated']
  },
  {
    id: 'business',
    title: 'Business Case',
    icon: BarChart3,
    patterns: ['[Business Analyst]', 'Analyzing Business Case', 'Deconstructing business'],
    completionPatterns: ['Business Case Analysis Complete', 'Business Infographic']
  },
  {
    id: 'business_visual',
    title: 'Biz Visual',
    icon: ImageIcon,
    patterns: ['[Visualizer] Generating Business', 'Business Infographic'],
    completionPatterns: ['Business Infographic generated']
  },
  {
    id: 'architecture',
    title: 'Architecture',
    icon: BrainCircuit,
    patterns: ['[ReAct Architect]', '[Stage 1/3]', '[Stage 2/3]', '[Stage 3/3]', 'Designing solution'],
    completionPatterns: ['Architecture Infographic', 'Design complete']
  },
  {
    id: 'arch_visual',
    title: 'Arch Visual',
    icon: ImageIcon,
    patterns: ['[Visualizer] Generating Architecture', 'Architecture Infographic'],
    completionPatterns: ['Architecture Infographic generated']
  },
  {
    id: 'proposal',
    title: 'Proposal',
    icon: FilePenLine,
    patterns: ['Generating Proposal', 'Drafting proposal', '[Writer]', 'Writing proposal'],
    completionPatterns: ['Proposal generated', 'SMART', 'Evaluation']
  },
  {
    id: 'audit',
    title: 'SMART Audit',
    icon: ShieldCheck,
    patterns: ['[SMART', 'Evaluation', 'Auditing', 'Quality pass'],
    completionPatterns: ['Audit complete', 'Proposal ready', 'optimization complete']
  }
];

type PhaseState = 'pending' | 'active' | 'completed';

const ProcessingStep: React.FC<ProcessingStepProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Compute phase states from all logs
  const phaseStates = useMemo(() => {
    const states: Record<string, PhaseState> = {};
    const allMessages = logs.map(l => l.message).join('\n');

    let lastActiveIndex = -1;

    PIPELINE_PHASES.forEach((phase, index) => {
      // Check if any completion pattern exists
      const isCompleted = phase.completionPatterns.some(p =>
        allMessages.toLowerCase().includes(p.toLowerCase())
      );

      // Check if any pattern matches (phase started)
      const isStarted = phase.patterns.some(p =>
        allMessages.toLowerCase().includes(p.toLowerCase())
      );

      if (isCompleted) {
        states[phase.id] = 'completed';
      } else if (isStarted) {
        states[phase.id] = 'active';
        lastActiveIndex = Math.max(lastActiveIndex, index);
      } else {
        states[phase.id] = 'pending';
      }
    });

    // Ensure only one phase is active (the latest one that started but not completed)
    let foundActive = false;
    for (let i = PIPELINE_PHASES.length - 1; i >= 0; i--) {
      const phase = PIPELINE_PHASES[i];
      if (states[phase.id] === 'active') {
        if (foundActive) {
          states[phase.id] = 'completed'; // Earlier active phases are now completed
        } else {
          foundActive = true;
        }
      }
    }

    return states;
  }, [logs]);

  // Calculate progress percentage
  const progressPercent = useMemo(() => {
    const completed = Object.values(phaseStates).filter(s => s === 'completed').length;
    const active = Object.values(phaseStates).filter(s => s === 'active').length;
    return Math.round(((completed + active * 0.5) / PIPELINE_PHASES.length) * 100);
  }, [phaseStates]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Progress Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-800">Agent Pipeline</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-600">{progressPercent}%</span>
        </div>
      </div>

      {/* Horizontal Pipeline Stepper */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between relative">
          {/* Progress Line Behind */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />

          {PIPELINE_PHASES.map((phase) => {
            const state = phaseStates[phase.id];
            const Icon = phase.icon;

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center relative z-10"
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${state === 'active'
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200 shadow-lg scale-110'
                    : state === 'completed'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                  }
                `}>
                  {state === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : state === 'active' ? (
                    <Icon className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`
                  mt-2 text-xs font-medium text-center max-w-[60px] leading-tight
                  ${state === 'active' ? 'text-blue-700 font-bold' : state === 'completed' ? 'text-green-700' : 'text-slate-400'}
                `}>
                  {phase.title}
                </span>
                {state === 'active' && (
                  <span className="absolute -bottom-5 text-[10px] text-blue-500 font-medium animate-pulse">
                    Processing...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Output */}
      <div className="bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 font-mono text-sm relative">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-200">Nubiral BSA Agent Runtime</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="p-6 h-[400px] overflow-y-auto space-y-2 scroll-smooth custom-console-scrollbar"
        >
          {logs.map((log) => (
            <div key={log.id} className={`flex items-start gap-3 animate-fade-in group hover:bg-white/5 p-0.5 rounded`}>
              <span className="text-slate-600 shrink-0 select-none w-20 text-right">
                {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <div className="flex-1 break-words">
                {log.type === 'thinking' && (
                  <span className="text-blue-400 font-bold mr-2 text-xs uppercase tracking-wider">Info &gt;</span>
                )}
                {log.type === 'success' && (
                  <span className="text-green-400 font-bold mr-2 text-xs uppercase tracking-wider">Done &gt;</span>
                )}
                {log.type === 'error' && (
                  <span className="text-red-500 font-bold mr-2 text-xs uppercase tracking-wider">Err &gt;</span>
                )}
                {log.type === 'info' && (
                  <span className="text-slate-500 font-bold mr-2 text-xs uppercase tracking-wider">Sys &gt;</span>
                )}
                <span className={`font-medium ${log.type === 'info' ? 'text-slate-300' :
                  log.type === 'thinking' ? 'text-blue-100' :
                    log.type === 'success' ? 'text-green-100' : 'text-red-200'
                  }`}>
                  {log.message}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 text-blue-500 animate-pulse mt-4 pl-24">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Processing</span>
            <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-blink"></span>
          </div>
        </div>
      </div>
      <style>{`
        .custom-console-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-console-scrollbar::-webkit-scrollbar-track {
          background: #020617;
        }
        .custom-console-scrollbar::-webkit-scrollbar-thumb {
          background-color: #1e293b;
          border-radius: 0px;
          border: 2px solid #020617;
        }
        .custom-console-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #334155;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .animate-blink {
            animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
};

export default ProcessingStep;