import type { Node, Edge } from '@xyflow/svelte';
import type {
  DiagnosticItem,
  CcxmlDocSettings,
  StateNodeData,
  GlobalHandlerNodeData,
  CcxmlAction
} from '../../types/ccxml';

export function validateCcxml(
  nodes: Node[],
  edges: Edge[],
  settings: CcxmlDocSettings
): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];

  // Check 1: Root document checks
  if (settings.version !== '1.0') {
    diagnostics.push({
      id: 'doc-version',
      severity: 'warning',
      message: `Document version is set to "${settings.version}". W3C CCXML 1.0 recommendation specifies version="1.0".`,
      specReference: 'CCXML 1.0 §6.1'
    });
  }

  if (nodes.length === 0) {
    diagnostics.push({
      id: 'doc-empty',
      severity: 'error',
      message: 'A CCXML document must contain at least one state or event transition.',
      specReference: 'CCXML 1.0 §6.2'
    });
    return diagnostics;
  }

  // Check 2: State Names uniqueness and validity
  const stateCounts = new Map<string, number>();
  const allStateNames = new Set<string>();
  const stateNodeIds = new Set<string>();
  let hasDisconnectedHandler = false;
  let hasErrorHandler = false;

  for (const node of nodes) {
    stateNodeIds.add(node.id);

    if (node.type === 'ccxml-state') {
      const data = node.data as StateNodeData;
      const stateName = data.stateName || node.id;

      if (!stateName || stateName.trim() === '') {
        diagnostics.push({
          id: `state-empty-name-${node.id}`,
          severity: 'error',
          nodeId: node.id,
          message: 'CCXML State element is missing a stateName identifier.',
          specReference: 'CCXML 1.0 §6.2.2'
        });
      } else {
        if (/\s/.test(stateName)) {
          diagnostics.push({
            id: `state-invalid-name-${node.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `State name "${stateName}" is invalid: must be an XML NMTOKEN (cannot contain spaces).`,
            specReference: 'XML 1.0 NMTOKEN'
          });
        }
        stateCounts.set(stateName, (stateCounts.get(stateName) || 0) + 1);
        allStateNames.add(stateName);
      }

      // Check transitions inside state
      const transitions = data.transitions || [];
      for (const t of transitions) {
        if (!t.event || t.event.trim() === '') {
          diagnostics.push({
            id: `trans-missing-event-${node.id}-${t.id}`,
            severity: 'error',
            nodeId: node.id,
            message: `Transition in state "${stateName}" is missing an event attribute.`,
            specReference: 'CCXML 1.0 §6.2.2'
          });
        }
        if (t.event === 'connection.disconnected') hasDisconnectedHandler = true;
        if (t.event.startsWith('error')) hasErrorHandler = true;

        // Check actions inside transition
        validateActionList(t.actions || [], node.id, diagnostics);
      }
    } else if (node.type === 'ccxml-global-handler') {
      const data = node.data as GlobalHandlerNodeData;
      if (data.event === 'connection.disconnected') hasDisconnectedHandler = true;
      if (data.event.startsWith('error')) hasErrorHandler = true;
      validateActionList(data.actions || [], node.id, diagnostics);
    }
  }

  // Duplicate state names check
  for (const [name, count] of stateCounts.entries()) {
    if (count > 1) {
      diagnostics.push({
        id: `duplicate-state-${name}`,
        severity: 'error',
        message: `Duplicate state name "${name}" found ${count} times. State names must be unique within the document.`,
        specReference: 'CCXML 1.0 §6.2.2'
      });
    }
  }

  // Check 3: Broken edge targets
  for (const edge of edges) {
    if (!stateNodeIds.has(edge.target)) {
      diagnostics.push({
        id: `broken-edge-${edge.id}`,
        severity: 'error',
        nodeId: edge.source,
        message: `Transition edge "${edge.id}" targets non-existent node "${edge.target}".`,
        specReference: 'CCXML 1.0 §6.2.2'
      });
    }
  }

  // Check 4: Telephony hung-call warning
  if (!hasDisconnectedHandler) {
    diagnostics.push({
      id: 'telephony-orphaned-call',
      severity: 'warning',
      message: 'No handler for "connection.disconnected" found. Recommended to catch disconnections to release telephony resources gracefully.',
      specReference: 'CCXML 1.0 §7.2'
    });
  }

  // Check 5: Error handling recommendation
  if (!hasErrorHandler) {
    diagnostics.push({
      id: 'telephony-missing-error-catch',
      severity: 'info',
      message: 'No handler for "error.*" detected. Consider adding a catch block for asynchronous telephony or dialog failures.',
      specReference: 'CCXML 1.0 §9.2'
    });
  }

  return diagnostics;
}

function validateActionList(actions: CcxmlAction[], nodeId: string, diagnostics: DiagnosticItem[]) {
  for (const act of actions) {
    if (act.type === 'createcall' && (!act.dest || act.dest.trim() === '')) {
      diagnostics.push({
        id: `action-createcall-missing-dest-${act.id}`,
        severity: 'error',
        nodeId,
        message: '<createcall> element is missing mandatory "dest" attribute.',
        specReference: 'CCXML 1.0 §7.1.1'
      });
    }
    if (act.type === 'dialogstart' && (!act.src || act.src.trim() === '')) {
      diagnostics.push({
        id: `action-dialogstart-missing-src-${act.id}`,
        severity: 'error',
        nodeId,
        message: '<dialogstart> element is missing mandatory "src" attribute.',
        specReference: 'CCXML 1.0 §8.1.1'
      });
    }
    if (act.type === 'join' && (!act.id1 || !act.id2)) {
      diagnostics.push({
        id: `action-join-missing-ids-${act.id}`,
        severity: 'error',
        nodeId,
        message: '<join> element requires both "id1" and "id2" attributes.',
        specReference: 'CCXML 1.0 §7.3.1'
      });
    }
    if (act.type === 'destroyconference' && (!act.conferenceid || act.conferenceid.trim() === '')) {
      diagnostics.push({
        id: `action-destroyconf-missing-id-${act.id}`,
        severity: 'error',
        nodeId,
        message: '<destroyconference> requires "conferenceid" attribute.',
        specReference: 'CCXML 1.0 §7.4.2'
      });
    }
  }
}
