import type { Node, Edge } from '@xyflow/svelte';
import type {
  CcxmlDocSettings,
  StateNodeData,
  GlobalHandlerNodeData,
  DialogNodeData,
  TransferNodeData,
  ConferenceNodeData,
  CcxmlAction
} from '../../types/ccxml';

function escapeXml(unsafe: string = ''): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderAction(action: CcxmlAction, indent: string = '      '): string {
  switch (action.type) {
    case 'accept': {
      const conn = action.connectionid ? ` connectionid="${escapeXml(action.connectionid)}"` : '';
      return `${indent}<accept${conn}/>`;
    }
    case 'reject': {
      const conn = action.connectionid ? ` connectionid="${escapeXml(action.connectionid)}"` : '';
      const reason = action.reason ? ` reason="${escapeXml(action.reason)}"` : '';
      return `${indent}<reject${conn}${reason}/>`;
    }
    case 'redirect': {
      const conn = action.connectionid ? ` connectionid="${escapeXml(action.connectionid)}"` : '';
      const dest = action.dest ? ` dest="${escapeXml(action.dest)}"` : '';
      return `${indent}<redirect${conn}${dest}/>`;
    }
    case 'createcall': {
      const parts = [`dest="${escapeXml(action.dest || '')}"`];
      if (action.callerid) parts.push(`callerid="${escapeXml(action.callerid)}"`);
      if (action.connectionid) parts.push(`connectionid="${escapeXml(action.connectionid)}"`);
      if (action.timeout) parts.push(`timeout="${escapeXml(action.timeout)}"`);
      if (action.aai) parts.push(`aai="${escapeXml(action.aai)}"`);
      return `${indent}<createcall ${parts.join(' ')}/>`;
    }
    case 'disconnect': {
      const conn = action.connectionid ? ` connectionid="${escapeXml(action.connectionid)}"` : '';
      const reason = action.reason ? ` reason="${escapeXml(action.reason)}"` : '';
      return `${indent}<disconnect${conn}${reason}/>`;
    }
    case 'join': {
      const parts = [
        `id1="${escapeXml(action.id1 || '')}"`,
        `id2="${escapeXml(action.id2 || '')}"`
      ];
      if (action.duplex) parts.push(`duplex="${action.duplex}"`);
      return `${indent}<join ${parts.join(' ')}/>`;
    }
    case 'unjoin': {
      return `${indent}<unjoin id1="${escapeXml(action.id1 || '')}" id2="${escapeXml(action.id2 || '')}"/>`;
    }
    case 'dialogstart': {
      const parts = [`src="${escapeXml(action.src || '')}"`];
      if (action.connectionid) parts.push(`connectionid="${escapeXml(action.connectionid)}"`);
      if (action.dialogid) parts.push(`dialogid="${escapeXml(action.dialogid)}"`);
      if (action.dialogtype) parts.push(`type="${escapeXml(action.dialogtype)}"`);
      if (action.namelist) parts.push(`namelist="${escapeXml(action.namelist)}"`);
      if (action.parameters) parts.push(`parameters="${escapeXml(action.parameters)}"`);
      return `${indent}<dialogstart ${parts.join(' ')}/>`;
    }
    case 'dialogterminate': {
      const parts = [`dialogid="${escapeXml(action.dialogid || '')}"`];
      if (action.immediate !== undefined) parts.push(`immediate="${action.immediate}"`);
      return `${indent}<dialogterminate ${parts.join(' ')}/>`;
    }
    case 'dialogprepare': {
      const parts = [`src="${escapeXml(action.src || '')}"`];
      if (action.dialogid) parts.push(`dialogid="${escapeXml(action.dialogid)}"`);
      if (action.dialogtype) parts.push(`type="${escapeXml(action.dialogtype)}"`);
      return `${indent}<dialogprepare ${parts.join(' ')}/>`;
    }
    case 'createconference': {
      const parts = [`conferenceid="${escapeXml(action.conferenceid || 'conf_id')}"`];
      if (action.reservedconfids) parts.push(`reservedconfids="${escapeXml(action.reservedconfids)}"`);
      return `${indent}<createconference ${parts.join(' ')}/>`;
    }
    case 'destroyconference': {
      return `${indent}<destroyconference conferenceid="${escapeXml(action.conferenceid || '')}"/>`;
    }
    case 'var': {
      const expr = action.expr ? ` expr="${escapeXml(action.expr)}"` : '';
      return `${indent}<var name="${escapeXml(action.name || 'v')}"${expr}/>`;
    }
    case 'assign': {
      return `${indent}<assign name="${escapeXml(action.name || '')}" expr="${escapeXml(action.expr || '')}"/>`;
    }
    case 'script': {
      return `${indent}<script>\n${indent}  ${action.scriptContent || ''}\n${indent}</script>`;
    }
    case 'send': {
      const parts = [`event="${escapeXml(action.event || '')}"`];
      if (action.target) parts.push(`target="${escapeXml(action.target)}"`);
      if (action.targettype) parts.push(`targettype="${escapeXml(action.targettype)}"`);
      if (action.delay) parts.push(`delay="${escapeXml(action.delay)}"`);
      if (action.namelist) parts.push(`namelist="${escapeXml(action.namelist)}"`);
      if (action.sendid) parts.push(`sendid="${escapeXml(action.sendid)}"`);
      return `${indent}<send ${parts.join(' ')}/>`;
    }
    case 'cancel': {
      return `${indent}<cancel sendid="${escapeXml(action.sendid || '')}"/>`;
    }
    case 'log': {
      const label = action.label ? ` label="${escapeXml(action.label)}"` : '';
      const expr = action.expr ? ` expr="${escapeXml(action.expr)}"` : '';
      return `${indent}<log${label}${expr}/>`;
    }
    case 'exit': {
      const expr = action.expr ? ` expr="${escapeXml(action.expr)}"` : '';
      const namelist = action.namelist ? ` namelist="${escapeXml(action.namelist)}"` : '';
      return `${indent}<exit${expr}${namelist}/>`;
    }
    default:
      return '';
  }
}

export function generateCcxml(
  nodes: Node[],
  edges: Edge[],
  settings: CcxmlDocSettings
): string {
  const stateVar = settings.statevariable || 'state';

  // Build map of nodeId -> stateName
  const nodeStateMap = new Map<string, string>();
  for (const n of nodes) {
    if (n.type === 'ccxml-state') {
      const d = n.data as StateNodeData;
      nodeStateMap.set(n.id, d.stateName || n.id);
    } else if (n.type === 'ccxml-dialog') {
      const d = n.data as DialogNodeData;
      nodeStateMap.set(n.id, d.dialogName || n.id);
    } else if (n.type === 'ccxml-transfer') {
      const d = n.data as TransferNodeData;
      nodeStateMap.set(n.id, d.transferName || n.id);
    } else if (n.type === 'ccxml-conference') {
      const d = n.data as ConferenceNodeData;
      nodeStateMap.set(n.id, d.conferenceName || n.id);
    }
  }

  // Find initial state
  let initialStateName = 'init';
  const initialNode = nodes.find(
    (n) => n.type === 'ccxml-state' && (n.data as StateNodeData).isInitial
  );
  if (initialNode) {
    initialStateName = (initialNode.data as StateNodeData).stateName || initialNode.id;
  } else if (nodes.length > 0) {
    const firstState = nodes.find((n) => n.type === 'ccxml-state');
    if (firstState) {
      initialStateName = (firstState.data as StateNodeData).stateName || firstState.id;
    }
  }

  // Helper to find target state from an edge originating at a handle
  const findTargetState = (sourceNodeId: string, handleId?: string): string | undefined => {
    const edge = edges.find((e) => {
      if (e.source !== sourceNodeId) return false;
      if (handleId && e.sourceHandle) {
        return e.sourceHandle === handleId;
      }
      return true;
    });
    if (!edge) return undefined;
    return nodeStateMap.get(edge.target);
  };

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<ccxml version="${settings.version || '1.0'}" xmlns="${settings.xmlns || 'http://www.w3.org/2002/09/ccxml'}">`
  );

  // Global Metadata
  if (settings.metadata && settings.metadata.length > 0) {
    for (const meta of settings.metadata) {
      lines.push(`  <meta name="${escapeXml(meta.name)}" content="${escapeXml(meta.content)}"/>`);
    }
  }

  // Global State Variable
  let hasDeclaredStateVar = false;
  if (settings.globalVars && settings.globalVars.length > 0) {
    for (const v of settings.globalVars) {
      if (v.name === stateVar) {
        hasDeclaredStateVar = true;
        const expr = v.expr ? ` expr="${escapeXml(v.expr)}"` : ` expr="'${escapeXml(initialStateName)}'"`;
        lines.push(`  <var name="${escapeXml(v.name)}"${expr}/>`);
      } else {
        const expr = v.expr ? ` expr="${escapeXml(v.expr)}"` : '';
        lines.push(`  <var name="${escapeXml(v.name)}"${expr}/>`);
      }
    }
  }

  if (!hasDeclaredStateVar) {
    lines.push(`  <var name="${escapeXml(stateVar)}" expr="'${escapeXml(initialStateName)}'"/>`);
  }

  // Global Script
  if (settings.globalScript && settings.globalScript.trim() !== '') {
    lines.push('  <script>');
    lines.push(`    ${settings.globalScript.trim()}`);
    lines.push('  </script>');
  }

  // Event processor
  lines.push(`  <eventprocessor statevariable="${escapeXml(stateVar)}">`);

  // Render State Nodes
  for (const node of nodes) {
    if (node.type === 'ccxml-state') {
      const data = node.data as StateNodeData;
      const stateName = data.stateName || node.id;
      const transitions = data.transitions || [];

      lines.push(`    <!-- State: ${escapeXml(stateName)} -->`);

      for (const t of transitions) {
        const condAttr = t.cond ? ` cond="${escapeXml(t.cond)}"` : '';
        lines.push(`    <transition state="${escapeXml(stateName)}" event="${escapeXml(t.event)}"${condAttr}>`);

        // Render transition actions
        if (t.actions && t.actions.length > 0) {
          for (const act of t.actions) {
            const rendered = renderAction(act, '      ');
            if (rendered) lines.push(rendered);
          }
        }

        // Determine next state from edges or targetState
        const targetFromEdge = findTargetState(node.id, `trans-${t.id}`) || findTargetState(node.id, t.id);
        const nextState = targetFromEdge || t.targetState;

        if (nextState && nextState !== stateName) {
          lines.push(`      <assign name="${escapeXml(stateVar)}" expr="&apos;${escapeXml(nextState)}&apos;"/>`);
        }

        lines.push('    </transition>');
      }
    } else if (node.type === 'ccxml-global-handler') {
      const data = node.data as GlobalHandlerNodeData;
      const condAttr = data.cond ? ` cond="${escapeXml(data.cond)}"` : '';
      lines.push(`    <!-- Global Event: ${escapeXml(data.event)} -->`);
      lines.push(`    <transition event="${escapeXml(data.event)}"${condAttr}>`);
      if (data.actions && data.actions.length > 0) {
        for (const act of data.actions) {
          const rendered = renderAction(act, '      ');
          if (rendered) lines.push(rendered);
        }
      }
      lines.push('    </transition>');
    } else if (node.type === 'ccxml-dialog') {
      const data = node.data as DialogNodeData;
      const stateName = data.dialogName || node.id;
      const targetExit = findTargetState(node.id, 'exit') || data.onExitNext;
      const targetError = findTargetState(node.id, 'error') || data.onErrorNext;

      lines.push(`    <!-- Dialog State: ${escapeXml(stateName)} -->`);
      lines.push(`    <transition state="${escapeXml(stateName)}" event="dialog.started">`);
      lines.push(`      <log expr="'VoiceXML Dialog started successfully'"/>`);
      lines.push('    </transition>');

      lines.push(`    <transition state="${escapeXml(stateName)}" event="dialog.exit">`);
      if (targetExit) {
        lines.push(`      <assign name="${escapeXml(stateVar)}" expr="'${escapeXml(targetExit)}'"/>`);
      } else {
        lines.push('      <exit/>');
      }
      lines.push('    </transition>');

      if (targetError) {
        lines.push(`    <transition state="${escapeXml(stateName)}" event="error.dialog">`);
        lines.push(`      <assign name="${escapeXml(stateVar)}" expr="'${escapeXml(targetError)}'"/>`);
        lines.push('    </transition>');
      }
    } else if (node.type === 'ccxml-transfer') {
      const data = node.data as TransferNodeData;
      const stateName = data.transferName || node.id;
      const targetConnected = findTargetState(node.id, 'connected') || data.onConnectedNext;
      const targetFailed = findTargetState(node.id, 'failed') || data.onFailedNext;

      lines.push(`    <!-- Transfer State: ${escapeXml(stateName)} -->`);
      lines.push(`    <transition state="${escapeXml(stateName)}" event="connection.connected">`);
      lines.push(`      <join id1="${escapeXml(data.inConnectionid || 'in_callid')}" id2="${escapeXml(data.outConnectionid || 'out_callid')}" duplex="${data.duplex || 'full'}"/>`);
      if (targetConnected) {
        lines.push(`      <assign name="${escapeXml(stateVar)}" expr="'${escapeXml(targetConnected)}'"/>`);
      }
      lines.push('    </transition>');

      if (targetFailed) {
        lines.push(`    <transition state="${escapeXml(stateName)}" event="connection.failed">`);
        lines.push(`      <assign name="${escapeXml(stateVar)}" expr="'${escapeXml(targetFailed)}'"/>`);
        lines.push('    </transition>');
      }
    } else if (node.type === 'ccxml-conference') {
      const data = node.data as ConferenceNodeData;
      const stateName = data.conferenceName || node.id;
      const targetCreated = findTargetState(node.id, 'created') || data.onCreatedNext;

      lines.push(`    <!-- Conference State: ${escapeXml(stateName)} -->`);
      lines.push(`    <transition state="${escapeXml(stateName)}" event="conference.created">`);
      lines.push(`      <log expr="'Conference created successfully: ' + event$.conferenceid"/>`);
      if (targetCreated) {
        lines.push(`      <assign name="${escapeXml(stateVar)}" expr="'${escapeXml(targetCreated)}'"/>`);
      }
      lines.push('    </transition>');
    }
  }

  lines.push('  </eventprocessor>');
  lines.push('</ccxml>');

  return lines.join('\n');
}
