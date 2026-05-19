import {
  Background,
  Controls as FlowControls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { Link, useParams } from 'react-router-dom';
import { LeftSidebar } from '../components/LeftSidebar.js';
import { RightSidebar } from '../components/RightSidebar.js';
import { TopBar } from '../components/TopBar.js';
import { useScenarioStore } from '../state/scenario-store.js';

export function ScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const scenario = useScenarioStore((s) => (scenarioId ? s.scenarios[scenarioId] : undefined));

  if (!scenario) {
    return (
      <main className="flex h-full items-center justify-center text-fg-muted">
        <div className="text-center space-y-3">
          <p>Scenario not found.</p>
          <Link to="/" className="text-accent underline-offset-2 hover:underline">
            Back to start
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="grid h-full grid-rows-[48px_1fr] grid-cols-[280px_1fr_320px]">
      <div className="col-span-3 border-b border-border bg-bg">
        <TopBar scenarioId={scenario.id} scenarioName={scenario.name} />
      </div>
      <aside className="border-r border-border overflow-y-auto bg-bg">
        <LeftSidebar />
      </aside>
      <section className="bg-bg-elev relative">
        <ReactFlowProvider>
          <ReactFlow nodes={[]} edges={[]} fitView proOptions={{ hideAttribution: true }}>
            <Background gap={20} size={1} />
            <FlowControls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </ReactFlowProvider>
      </section>
      <aside className="border-l border-border overflow-y-auto bg-bg">
        <RightSidebar />
      </aside>
    </div>
  );
}
