// Telephony and CCXML Call Control Simulation Models

export type ConnectionState = 'IDLE' | 'ALERTING' | 'CONNECTED' | 'DISCONNECTED';

export interface SimulatedConnection {
  id: string;
  direction: 'inbound' | 'outbound';
  state: ConnectionState;
  remote: string; // Caller ID or destination URI
  local: string;  // System DID / SIP endpoint
  isMuted?: boolean;
}

export interface SimulatedConference {
  id: string;
  name: string;
  joinedConnections: string[];
}

export interface SimulatedDialog {
  id: string;
  src: string;
  connectionid: string;
  status: 'PREPARING' | 'STARTED' | 'TERMINATING' | 'TERMINATED';
  startTime: number;
}

export interface TelephonyLogEntry {
  id: string;
  timestamp: string;
  type: 'event' | 'action' | 'state' | 'info' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface SimulatorState {
  isActive: boolean;
  currentState: string;
  activeNodeId: string | null;
  connections: Record<string, SimulatedConnection>;
  conferences: Record<string, SimulatedConference>;
  activeDialog: SimulatedDialog | null;
  variables: Record<string, any>;
  eventQueue: Array<{ event: string; data?: any }>;
  logs: TelephonyLogEntry[];
}
