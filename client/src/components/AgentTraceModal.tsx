import React from "react";
import {
  X,
  Sparkles,
  ShieldAlert,
  FlaskConical,
  FileText,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
} from "lucide-react";
import { PullRequest } from "../types";

interface AgentTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pullRequest: PullRequest;
}

export const AgentTraceModal: React.FC<AgentTraceModalProps> = ({
  isOpen,
  onClose,
  pullRequest: pr,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  IBM Bob 2.0 Agent Mode Execution Trace
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  Parallel Threads
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                PR #{pr.prNumber} • {pr.repo} • Completed in 1.01 seconds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Architecture flow banner */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-2">
                <span>SUPERVISOR: Bob 2.0 Dispatcher</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                  {pr.engineUsed === "ibm_bob_shell"
                    ? "Engine: IBM Bob Shell CLI (bob run)"
                    : "Engine: Local deterministic heuristics"}
                </span>
              </span>
              <span className="text-emerald-400">3 Parallel Subagents</span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Instead of reviewing code sequentially in a single thread (taking
              20-30 mins manually), Bob 2.0 executes 3 specialized subagents
              simultaneously, then streams evidence to Jev for structured risk
              scoring.
            </p>
          </div>

          {/* 3 Subagents */}
          <div className="space-y-4">
            {pr.subagentTraces.map((trace) => {
              const isSecurity = trace.name.includes("Security");
              const isTest = trace.name.includes("Test");

              return (
                <div
                  key={trace.name}
                  className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSecurity
                            ? "bg-rose-50 text-rose-500"
                            : isTest
                            ? "bg-blue-50 text-blue-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {isSecurity ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : isTest ? (
                          <FlaskConical className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 text-xs">
                        {trace.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {trace.durationMs}ms
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          trace.status === "flagged"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {trace.status}
                      </span>
                    </div>
                  </div>

                  {/* Logs */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1 font-mono text-[11px] text-slate-700 border border-slate-100">
                    {trace.logSummary.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-slate-400 select-none">›</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Jev Decision Engine Card */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  J
                </div>
                <span className="font-bold text-slate-900">
                  Jev Decision Engine (TypeSafe AI)
                </span>
              </div>
              <span className="text-xs font-bold text-blue-700">
                Calculated Decision
              </span>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Jev takes Bob's findings and executes a deterministic risk matrix
              without hallucinating narrative text.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Security Weight
                </span>
                <span className="text-xs font-bold text-slate-800">50%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Test Delta Weight
                </span>
                <span className="text-xs font-bold text-slate-800">35%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Blast Radius
                </span>
                <span className="text-xs font-bold text-slate-800">15%</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-blue-200 text-slate-800 text-xs font-mono">
              Final Verdict:{" "}
              <strong className="text-rose-600">
                {pr.riskLevel} Risk (Score: {pr.riskScore}/10)
              </strong>
              . Block automated release until unit tests and header spoofing are
              resolved.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Estimated Human Time Saved:{" "}
            <strong className="text-slate-800 font-bold">~22 minutes</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
