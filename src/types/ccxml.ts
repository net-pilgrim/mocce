// CCXML 1.0 (Call Control XML) Types and Data Models
// Compliant with W3C CCXML Version 1.0 Recommendation

export type CcxmlNodeType =
  | 'ccxml-state'
  | 'ccxml-global-handler'
  | 'ccxml-dialog'
  | 'ccxml-transfer'
  | 'ccxml-conference';

export interface VarDeclaration {
  name: string;
  expr?: string;
}

export interface CcxmlAction {
  id: string;
  type:
    | 'accept'
    | 'reject'
    | 'redirect'
    | 'createcall'
    | 'disconnect'
    | 'join'
    | 'unjoin'
    | 'dialogstart'
    | 'dialogterminate'
    | 'dialogprepare'
    | 'createconference'
    | 'destroyconference'
    | 'assign'
    | 'var'
    | 'script'
    | 'send'
    | 'cancel'
    | 'log'
    | 'exit';
  // Common action attributes
  connectionid?: string;
  reason?: string;
  dest?: string;
  callerid?: string;
  timeout?: string;
  aai?: string;
  id1?: string;
  id2?: string;
  duplex?: 'full' | 'half';
  src?: string;
  dialogid?: string;
  dialogtype?: string;
  namelist?: string;
  parameters?: string;
  immediate?: boolean;
  conferenceid?: string;
  reservedconfids?: string;
  name?: string;
  expr?: string;
  scriptContent?: string;
  event?: string;
  target?: string;
  targettype?: string;
  delay?: string;
  sendid?: string;
  label?: string;
}

export interface CcxmlTransition {
  id: string;
  event: string; // e.g. "connection.alerting", "connection.connected", "dialog.exit", "error.*"
  cond?: string; // Optional ECMAScript expression e.g. "event$.values.route === 'sales'"
  targetState?: string; // State transitioned to
  actions: CcxmlAction[];
}

export interface CcxmlDocSettings {
  version: '1.0';
  xmlns: string;
  statevariable: string; // default is "state"
  globalVars: VarDeclaration[];
  globalScript?: string;
  metadata?: Array<{ name: string; content: string }>;
}

export interface BaseCcxmlNodeData {
  label: string;
  isSimulatingActive?: boolean;
  [key: string]: unknown;
}

export interface StateNodeData extends BaseCcxmlNodeData {
  stateName: string;
  isInitial?: boolean;
  entryActions?: CcxmlAction[];
  transitions: CcxmlTransition[];
}

export interface GlobalHandlerNodeData extends BaseCcxmlNodeData {
  event: string;
  cond?: string;
  actions: CcxmlAction[];
}

export interface DialogNodeData extends BaseCcxmlNodeData {
  dialogName: string;
  src: string;
  connectionid?: string;
  dialogid?: string;
  namelist?: string;
  onStartedNext?: string;
  onExitNext?: string;
  onErrorNext?: string;
}

export interface TransferNodeData extends BaseCcxmlNodeData {
  transferName: string;
  dest: string;
  callerid?: string;
  inConnectionid?: string;
  outConnectionid?: string;
  duplex?: 'full' | 'half';
  onConnectedNext?: string;
  onFailedNext?: string;
}

export interface ConferenceNodeData extends BaseCcxmlNodeData {
  conferenceName: string;
  conferenceidVar?: string;
  reservedconfids?: string;
  onCreatedNext?: string;
  onDestroyedNext?: string;
}

export type AnyCcxmlNodeData =
  | StateNodeData
  | GlobalHandlerNodeData
  | DialogNodeData
  | TransferNodeData
  | ConferenceNodeData;

export interface DiagnosticItem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  nodeId?: string;
  message: string;
  specReference?: string;
}
