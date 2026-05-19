import { Inspector } from './inspector/Inspector.js';

interface Props {
  scenarioId: string;
}

export function RightSidebar({ scenarioId }: Props) {
  return <Inspector scenarioId={scenarioId} />;
}
