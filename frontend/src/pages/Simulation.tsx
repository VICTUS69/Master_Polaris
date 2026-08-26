import React from 'react';
import { DigitalTwin } from '../components/DigitalTwin';
import { SimulationControls } from '../components/SimulationControls';
import { AgentActivity } from '../components/AgentActivity';
import { BaselineComparison } from '../components/BaselineComparison';
import {
  SimulationTimestep,
  WeatherTelemetry,
  ScenarioDefinition,
  DualSimulationResult,
  AgentLog,
  AgentCycleResult
} from '../types';

interface SimulationPageProps {
  currentStep: SimulationTimestep | null;
  currentHour: number;
  maxHours: number;
  weather: WeatherTelemetry | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStep: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onScrubHour: (hour: number) => void;
  scenarios: ScenarioDefinition[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  isRunningSim: boolean;
  simResult: DualSimulationResult | null;
  agentLogs: AgentLog[];
  approvalStatus?: AgentCycleResult['approval_status'];
  onOpenExplainability: () => void;
  onOpenReport: () => void;
  stationName: string;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  currentStep,
  currentHour,
  maxHours,
  weather,
  isPlaying,
  onPlayPause,
  onReset,
  onStep,
  playbackSpeed,
  onSpeedChange,
  onScrubHour,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  isRunningSim,
  simResult,
  agentLogs,
  approvalStatus,
  onOpenExplainability,
  onOpenReport,
  stationName
}) => {
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);
  const scenarioName = selectedScenario?.name || 'Polar Storm';
  const isStorm = selectedScenarioId === 'polar_storm' || selectedScenarioId === 'combined_failure';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* 1. Centerpiece: Animated Digital Twin Polar Microgrid Visualizer */}
      <DigitalTwin
        currentStep={currentStep}
        weather={weather}
        scenarioName={scenarioName}
        isStorm={isStorm}
        stationName={stationName}
      />

      {/* 2. Simulation Clock Controls & Disaster Scenario Selector */}
      <SimulationControls
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onReset={onReset}
        onStep={onStep}
        playbackSpeed={playbackSpeed}
        onSpeedChange={onSpeedChange}
        currentHour={currentHour}
        maxHours={maxHours}
        onScrubHour={onScrubHour}
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={onSelectScenario}
        isRunningSim={isRunningSim}
      />

      {/* 3. Multi-Agent Activity Trajectory & Reasoning Hub */}
      <AgentActivity
        logs={agentLogs}
        approvalStatus={approvalStatus}
        onOpenExplainability={onOpenExplainability}
      />

      {/* 4. Dual-Track Comparison (Baseline SCADA vs POLARIS AI) */}
      <BaselineComparison
        simResult={simResult}
        onOpenReport={onOpenReport}
      />
    </div>
  );
};
