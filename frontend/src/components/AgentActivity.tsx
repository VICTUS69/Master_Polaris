import React from 'react';
import {
  Cpu,
  Eye,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Play,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { AgentLog, AgentCycleResult } from '../types';

interface AgentActivityProps {
  logs: AgentLog[];
  approvalStatus?: AgentCycleResult['approval_status'];
  onOpenExplainability: () => void;
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  logs,
  approvalStatus,
  onOpenExplainability
}) => {
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'forecast':
        return <Eye className="w-3.5 h-3.5 text-cyan-400" />;
      case 'plan':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      case 'reject':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />;
      case 'replan':
        return <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
      case 'approve':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'alert':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Play className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getLogBorder = (type: string) => {
    switch (type) {
      case 'reject':
        return 'border-l-2 border-rose-500 bg-rose-950/20';
      case 'approve':
        return 'border-l-2 border-emerald-500 bg-emerald-950/20';
      case 'replan':
        return 'border-l-2 border-amber-500 bg-amber-950/20';
      case 'forecast':
        return 'border-l-2 border-cyan-500 bg-cyan-950/20';
      default:
        return 'border-l-2 border-polaris-700 bg-polaris-900/60';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-polaris-800 flex flex-col justify-between h-full">
      {/* Title & Agents Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">
            AI AGENTIC DECISION ENGINE
          </h2>
        </div>
        <button
          onClick={onOpenExplainability}
          className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition-colors"
        >
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          WHY DID THE AI DO THIS?
        </button>
      </div>

      {/* Autonomous Agent Status Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {/* Forecast Agent */}
        <div className="bg-polaris-900/90 rounded-xl p-2 border border-cyan-500/30 flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[9px] font-mono text-slate-400">FORECAST AGENT</div>
            <div className="text-[10px] font-bold font-mono text-cyan-300">
              {approvalStatus?.forecast_agent || 'ACTIVE'}
            </div>
          </div>
        </div>

        {/* Energy Manager Agent */}
        <div className="bg-polaris-900/90 rounded-xl p-2 border border-blue-500/30 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[9px] font-mono text-slate-400">ENERGY MANAGER</div>
            <div className="text-[10px] font-bold font-mono text-blue-300">
              {approvalStatus?.energy_manager || 'OPTIMIZING'}
            </div>
          </div>
        </div>

        {/* Safety Agent */}
        <div className="bg-polaris-900/90 rounded-xl p-2 border border-emerald-500/30 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[9px] font-mono text-slate-400">SAFETY AGENT</div>
            <div className="text-[10px] font-bold font-mono text-emerald-300">
              {approvalStatus?.safety_agent || 'VERIFIED'}
            </div>
          </div>
        </div>

        {/* Scenario Agent */}
        <div className="bg-polaris-900/90 rounded-xl p-2 border border-amber-500/30 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[9px] font-mono text-slate-400">SCENARIO AGENT</div>
            <div className="text-[10px] font-bold font-mono text-amber-300">MONITORING</div>
          </div>
        </div>
      </div>

      {/* Verifiable Loop Diagram */}
      <div className="py-1.5 px-3 bg-polaris-900/70 rounded-xl border border-polaris-800 text-[10px] font-mono text-slate-400 flex items-center justify-between overflow-x-auto mb-3">
        <span className="text-cyan-400 font-bold">OBSERVE</span>
        <span>→</span>
        <span className="text-cyan-400 font-bold">FORECAST</span>
        <span>→</span>
        <span className="text-blue-400 font-bold">PLAN</span>
        <span>→</span>
        <span className="text-amber-400 font-bold">SAFETY CHECK</span>
        <span>→</span>
        <span className="text-emerald-400 font-bold">EXECUTE</span>
      </div>

      {/* Streaming Event Trajectory Logs */}
      <div className="flex-1 max-h-56 overflow-y-auto space-y-2 pr-1">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`p-2.5 rounded-xl border border-polaris-800/80 ${getLogBorder(log.type)}`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                {getLogIcon(log.type)}
                {log.agent}
              </span>
              <span>{log.timestamp}</span>
            </div>
            <p className="text-xs font-mono text-slate-100 font-medium">{log.message}</p>
            {log.details && (
              <p className="text-[10px] font-sans text-slate-400 mt-1 leading-normal">
                {log.details}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
