import type { Node, Edge } from '@xyflow/svelte';
import type {
  StateNodeData,
  GlobalHandlerNodeData,
  CcxmlAction
} from '../../types/ccxml';
import type {
  SimulatorState,
  SimulatedConnection,
  TelephonyLogEntry
} from '../../types/simulator';

// DTMF standard frequencies
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477]
};

let audioCtx: AudioContext | null = null;

export function playDtmfTone(key: string, durationMs: number = 160) {
  const freqs = DTMF_FREQS[key];
  if (!freqs) return;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.frequency.value = freqs[0];
    osc2.frequency.value = freqs[1];

    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(audioCtx.currentTime + durationMs / 1000);
    osc2.stop(audioCtx.currentTime + durationMs / 1000);
  } catch (err) {
    console.warn('AudioContext error:', err);
  }
}

export function playRingbackTone(durationMs: number = 800) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.frequency.value = 440;
    osc2.frequency.value = 480;

    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(audioCtx.currentTime + durationMs / 1000);
    osc2.stop(audioCtx.currentTime + durationMs / 1000);
  } catch (err) {
    // Ignore audio errors on headless environments
  }
}

export class CcxmlSimulator {
  private nodes: Node[] = [];
  private edges: Edge[] = [];
  private state: SimulatorState;
  private onStateChange: (state: SimulatorState) => void;
  private stateVar: string = 'state';

  constructor(onStateChange: (state: SimulatorState) => void) {
    this.onStateChange = onStateChange;
    this.state = this.getInitialState();
  }

  private getInitialState(): SimulatorState {
    return {
      isActive: false,
      currentState: 'init',
      activeNodeId: null,
      connections: {},
      conferences: {},
      activeDialog: null,
      variables: {
        state: 'init',
        session$: {
          id: 'ccxml_sess_' + Math.random().toString(36).substring(2, 8),
          uri: 'http://localhost:5173/session'
        }
      },
      eventQueue: [],
      logs: []
    };
  }

  public updateGraph(nodes: Node[], edges: Edge[], stateVar: string = 'state') {
    this.nodes = nodes;
    this.edges = edges;
    this.stateVar = stateVar;
  }

  public getState(): SimulatorState {
    return this.state;
  }

  private emitState() {
    this.onStateChange({ ...this.state });
  }

  private addLog(type: TelephonyLogEntry['type'], message: string, details?: Record<string, unknown>) {
    const entry: TelephonyLogEntry = {
      id: 'log_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    this.state.logs = [entry, ...this.state.logs.slice(0, 150)];
  }

  public startSession(initialStateName: string = 'init') {
    this.state = this.getInitialState();
    this.state.isActive = true;
    this.state.currentState = initialStateName;
    this.state.variables[this.stateVar] = initialStateName;

    // Locate initial node
    const initNode = this.nodes.find(
      (n) => n.type === 'ccxml-state' && (n.data as StateNodeData).stateName === initialStateName
    ) || this.nodes.find((n) => n.type === 'ccxml-state');

    if (initNode) {
      this.state.activeNodeId = initNode.id;
      this.state.currentState = (initNode.data as StateNodeData).stateName || initialStateName;
    }

    this.addLog('state', `CCXML session started. State set to "${this.state.currentState}"`);
    this.emitState();
  }

  public stopSession() {
    this.state.isActive = false;
    this.state.activeNodeId = null;
    this.addLog('info', 'CCXML session terminated.');
    this.emitState();
  }

  /**
   * Simulate inbound call arrival (connection.alerting)
   */
  public triggerInboundCall(callerId: string = '+15552345678', did: string = '+18005550100') {
    if (!this.state.isActive) {
      this.startSession();
    }

    playRingbackTone(600);
    const connId = 'conn_in_' + Math.random().toString(36).substring(2, 6);
    const conn: SimulatedConnection = {
      id: connId,
      direction: 'inbound',
      state: 'ALERTING',
      remote: callerId,
      local: did
    };

    this.state.connections[connId] = conn;
    this.addLog('event', `Incoming call alerting on ${connId} from ${callerId}`);

    this.dispatchEvent('connection.alerting', {
      connectionid: connId,
      connection: {
        id: connId,
        state: 'alerting',
        remote: callerId,
        local: did
      }
    });
  }

  /**
   * Primary CCXML Event Processing Algorithm (EHIA)
   */
  public dispatchEvent(eventName: string, eventData: Record<string, any> = {}) {
    this.addLog('event', `Processing event: ${eventName}`, eventData);

    // Build event$ structure compliant with CCXML 1.0 §4.2
    const eventObj = {
      name: eventName,
      ...eventData
    };
    this.state.variables.event$ = eventObj;

    // 1. Find matching transition in current active state
    let matchedTransition: any = null;
    let targetStateNodeId: string | null = null;
    let nextStateName: string | null = null;

    const currentNode = this.nodes.find((n) => n.id === this.state.activeNodeId);
    if (currentNode && currentNode.type === 'ccxml-state') {
      const data = currentNode.data as StateNodeData;
      for (const t of data.transitions || []) {
        if (this.matchEvent(t.event, eventName) && this.evaluateCond(t.cond)) {
          matchedTransition = t;
          break;
        }
      }
    }

    // 2. Fall back to global handlers if not caught in state
    if (!matchedTransition) {
      const globalNode = this.nodes.find((n) => {
        if (n.type !== 'ccxml-global-handler') return false;
        const d = n.data as GlobalHandlerNodeData;
        return this.matchEvent(d.event, eventName) && this.evaluateCond(d.cond);
      });
      if (globalNode) {
        matchedTransition = {
          actions: (globalNode.data as GlobalHandlerNodeData).actions || []
        };
      }
    }

    if (!matchedTransition) {
      this.addLog('info', `No transition caught event "${eventName}" in state "${this.state.currentState}".`);
      this.emitState();
      return;
    }

    this.addLog('action', `Matched transition for "${eventName}". Executing action block.`);

    // 3. Execute actions in matched transition
    for (const action of matchedTransition.actions || []) {
      this.executeAction(action);
    }

    // 4. Resolve next target state via edges or targetState attribute
    if (matchedTransition.id && currentNode) {
      const edge = this.edges.find(
        (e) => e.source === currentNode.id && (e.sourceHandle === `trans-${matchedTransition.id}` || e.sourceHandle === matchedTransition.id)
      );
      if (edge) {
        targetStateNodeId = edge.target;
        const targetNode = this.nodes.find((n) => n.id === edge.target);
        if (targetNode && targetNode.type === 'ccxml-state') {
          nextStateName = (targetNode.data as StateNodeData).stateName;
        }
      } else if (matchedTransition.targetState) {
        nextStateName = matchedTransition.targetState;
        const targetNode = this.nodes.find(
          (n) => n.type === 'ccxml-state' && (n.data as StateNodeData).stateName === nextStateName
        );
        if (targetNode) targetStateNodeId = targetNode.id;
      }
    }

    // Transition state
    if (nextStateName && nextStateName !== this.state.currentState) {
      this.state.currentState = nextStateName;
      this.state.variables[this.stateVar] = nextStateName;
      this.state.activeNodeId = targetStateNodeId || this.state.activeNodeId;
      this.addLog('state', `State transition: -> "${this.state.currentState}"`);
    }

    this.emitState();
  }

  private matchEvent(pattern: string, actual: string): boolean {
    if (!pattern || pattern === '*' || pattern === actual) return true;
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return actual.startsWith(prefix);
    }
    return false;
  }

  private evaluateCond(cond?: string): boolean {
    if (!cond || cond.trim() === '') return true;
    try {
      // Evaluate within sandbox with variables exposed
      const fn = new Function('state', 'event$', 'session$', 'variables', `with(variables) { return Boolean(${cond}); }`);
      return fn(this.state.currentState, this.state.variables.event$, this.state.variables.session$, this.state.variables);
    } catch (err: any) {
      this.addLog('error', `Error evaluating cond "${cond}": ${err.message}`);
      return false;
    }
  }

  private executeAction(action: CcxmlAction) {
    this.addLog('action', `Action: <${action.type}>`, action as any);

    switch (action.type) {
      case 'accept': {
        const connId = this.resolveExpr(action.connectionid) || Object.keys(this.state.connections)[0];
        if (connId && this.state.connections[connId]) {
          this.state.connections[connId].state = 'CONNECTED';
          this.addLog('info', `Call on connection ${connId} answered (<accept>)`);
          // Dispatch connection.connected
          setTimeout(() => {
            this.dispatchEvent('connection.connected', {
              connectionid: connId,
              connection: this.state.connections[connId]
            });
          }, 300);
        }
        break;
      }
      case 'reject': {
        const connId = this.resolveExpr(action.connectionid) || Object.keys(this.state.connections)[0];
        if (connId && this.state.connections[connId]) {
          this.state.connections[connId].state = 'DISCONNECTED';
          this.addLog('info', `Call on connection ${connId} rejected (<reject>)`);
          this.dispatchEvent('connection.disconnected', { connectionid: connId });
        }
        break;
      }
      case 'createcall': {
        const dest = this.resolveExpr(action.dest) || 'sip:agent@acme.com';
        const outConnId = 'conn_out_' + Math.random().toString(36).substring(2, 6);
        const outConn: SimulatedConnection = {
          id: outConnId,
          direction: 'outbound',
          state: 'ALERTING',
          remote: dest,
          local: '+18005550100'
        };
        this.state.connections[outConnId] = outConn;
        if (action.connectionid) {
          this.state.variables[action.connectionid] = outConnId;
        }
        this.addLog('info', `Placing outbound call to ${dest} (<createcall>) on ${outConnId}`);

        // Outbound call auto-answers after 800ms
        setTimeout(() => {
          if (this.state.connections[outConnId]) {
            this.state.connections[outConnId].state = 'CONNECTED';
            this.dispatchEvent('connection.connected', {
              connectionid: outConnId,
              connection: this.state.connections[outConnId]
            });
          }
        }, 800);
        break;
      }
      case 'disconnect': {
        const connId = this.resolveExpr(action.connectionid) || Object.keys(this.state.connections)[0];
        if (connId && this.state.connections[connId]) {
          this.state.connections[connId].state = 'DISCONNECTED';
          this.addLog('info', `Terminating connection ${connId} (<disconnect>)`);
          setTimeout(() => {
            this.dispatchEvent('connection.disconnected', { connectionid: connId });
          }, 200);
        }
        break;
      }
      case 'join': {
        const id1 = this.resolveExpr(action.id1);
        const id2 = this.resolveExpr(action.id2);
        this.addLog('info', `Bridging media streams: ${id1} <==> ${id2} (duplex: ${action.duplex || 'full'})`);
        break;
      }
      case 'dialogstart': {
        const src = this.resolveExpr(action.src) || 'dialog.vxml';
        const dialogId = 'dlg_' + Math.random().toString(36).substring(2, 6);
        this.state.activeDialog = {
          id: dialogId,
          src,
          connectionid: this.resolveExpr(action.connectionid) || 'conn_1',
          status: 'STARTED',
          startTime: Date.now()
        };
        if (action.dialogid) {
          this.state.variables[action.dialogid] = dialogId;
        }
        this.addLog('info', `VoiceXML Dialog started: ${src} (${dialogId})`);
        setTimeout(() => {
          this.dispatchEvent('dialog.started', { dialogid: dialogId });
        }, 400);
        break;
      }
      case 'dialogterminate': {
        if (this.state.activeDialog) {
          this.state.activeDialog.status = 'TERMINATED';
          this.addLog('info', `VoiceXML Dialog terminated: ${this.state.activeDialog.id}`);
          this.state.activeDialog = null;
        }
        break;
      }
      case 'createconference': {
        const confId = this.resolveExpr(action.conferenceid) || 'conf_' + Math.random().toString(36).substring(2, 6);
        this.state.conferences[confId] = {
          id: confId,
          name: confId,
          joinedConnections: []
        };
        this.addLog('info', `Conference bridge created: ${confId}`);
        setTimeout(() => {
          this.dispatchEvent('conference.created', { conferenceid: confId });
        }, 300);
        break;
      }
      case 'assign': {
        if (action.name) {
          const val = this.evalValue(action.expr);
          this.state.variables[action.name] = val;
          this.addLog('info', `Variable assign: ${action.name} = ${JSON.stringify(val)}`);
        }
        break;
      }
      case 'log': {
        const val = this.evalValue(action.expr);
        this.addLog('info', `[CCXML Log] ${val}`);
        break;
      }
      case 'exit': {
        this.addLog('info', 'CCXML Session Exit triggered (<exit/>)');
        this.stopSession();
        break;
      }
    }
  }

  private resolveExpr(exprOrId?: string): string {
    if (!exprOrId) return '';
    if (this.state.variables[exprOrId]) return String(this.state.variables[exprOrId]);
    return exprOrId.replace(/^['"]|['"]$/g, '');
  }

  private evalValue(expr?: string): any {
    if (!expr) return undefined;
    try {
      const fn = new Function('state', 'event$', 'session$', 'variables', `with(variables) { return (${expr}); }`);
      return fn(this.state.currentState, this.state.variables.event$, this.state.variables.session$, this.state.variables);
    } catch {
      return expr.replace(/^['"]|['"]$/g, '');
    }
  }

  /**
   * Complete running VoiceXML dialog with simulated values
   */
  public finishActiveDialog(values: Record<string, any> = {}) {
    if (!this.state.activeDialog) return;
    const dlgId = this.state.activeDialog.id;
    this.state.activeDialog.status = 'TERMINATED';
    this.state.activeDialog = null;
    this.dispatchEvent('dialog.exit', {
      dialogid: dlgId,
      values
    });
  }
}
