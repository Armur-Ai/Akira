import type { NodeType } from '@akira/schema';
import {
  Bot,
  Brain,
  Database,
  KeyRound,
  Lock,
  type LucideIcon,
  Network,
  Plug,
  Server,
  User,
  Wrench,
} from 'lucide-react';

const ICONS: Record<NodeType, LucideIcon> = {
  human: User,
  agent: Bot,
  model: Brain,
  tool: Wrench,
  data: Database,
  service: Server,
  'mcp-server': Plug,
  network: Network,
  credential: KeyRound,
  secret: Lock,
};

export function nodeIcon(type: NodeType): LucideIcon {
  return ICONS[type];
}
