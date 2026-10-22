import type { Node, Edge } from '@xyflow/svelte';
import { DOMParser as XmldomParser } from '@xmldom/xmldom';
import type {
  CcxmlDocSettings,
  StateNodeData,
  GlobalHandlerNodeData,
  CcxmlTransition,
  CcxmlAction
} from '../../types/ccxml';

export interface ParseResult {
  nodes: Node[];
  edges: Edge[];
  settings: CcxmlDocSettings;
  error?: string;
}

function getDOMParser(): any {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser();
  }
  return new XmldomParser();
}

export function getDefaultSettings(): CcxmlDocSettings {
  return {
    version: '1.0',
    xmlns: 'http://www.w3.org/2002/09/ccxml',
    statevariable: 'state',
    globalVars: [
      { name: 'in_callid' },
      { name: 'out_callid' },
      { name: 'vxml_dialogid' }
    ],
    metadata: []
  };
}

function parseActions(parent: Element): CcxmlAction[] {
  const actions: CcxmlAction[] = [];
  const children = parent.childNodes;

  for (let i = 0; i < children.length; i++) {
    const node = children[i];
    if (node.nodeType !== 1) continue;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const id = 'act_' + Math.random().toString(36).substring(2, 7);

    switch (tag) {
      case 'accept':
        actions.push({ id, type: 'accept', connectionid: el.getAttribute('connectionid') || undefined });
        break;
      case 'reject':
        actions.push({
          id,
          type: 'reject',
          connectionid: el.getAttribute('connectionid') || undefined,
          reason: el.getAttribute('reason') || undefined
        });
        break;
      case 'redirect':
        actions.push({
          id,
          type: 'redirect',
          connectionid: el.getAttribute('connectionid') || undefined,
          dest: el.getAttribute('dest') || undefined
        });
        break;
      case 'createcall':
        actions.push({
          id,
          type: 'createcall',
          dest: el.getAttribute('dest') || undefined,
          callerid: el.getAttribute('callerid') || undefined,
          connectionid: el.getAttribute('connectionid') || undefined,
          timeout: el.getAttribute('timeout') || undefined,
          aai: el.getAttribute('aai') || undefined
        });
        break;
      case 'disconnect':
        actions.push({
          id,
          type: 'disconnect',
          connectionid: el.getAttribute('connectionid') || undefined,
          reason: el.getAttribute('reason') || undefined
        });
        break;
      case 'join':
        actions.push({
          id,
          type: 'join',
          id1: el.getAttribute('id1') || undefined,
          id2: el.getAttribute('id2') || undefined,
          duplex: (el.getAttribute('duplex') as any) || undefined
        });
        break;
      case 'unjoin':
        actions.push({
          id,
          type: 'unjoin',
          id1: el.getAttribute('id1') || undefined,
          id2: el.getAttribute('id2') || undefined
        });
        break;
      case 'dialogstart':
        actions.push({
          id,
          type: 'dialogstart',
          src: el.getAttribute('src') || undefined,
          connectionid: el.getAttribute('connectionid') || undefined,
          dialogid: el.getAttribute('dialogid') || undefined,
          dialogtype: el.getAttribute('type') || undefined,
          namelist: el.getAttribute('namelist') || undefined,
          parameters: el.getAttribute('parameters') || undefined
        });
        break;
      case 'dialogterminate':
        actions.push({
          id,
          type: 'dialogterminate',
          dialogid: el.getAttribute('dialogid') || undefined,
          immediate: el.getAttribute('immediate') === 'true'
        });
        break;
      case 'createconference':
        actions.push({
          id,
          type: 'createconference',
          conferenceid: el.getAttribute('conferenceid') || undefined,
          reservedconfids: el.getAttribute('reservedconfids') || undefined
        });
        break;
      case 'destroyconference':
        actions.push({
          id,
          type: 'destroyconference',
          conferenceid: el.getAttribute('conferenceid') || undefined
        });
        break;
      case 'var':
        actions.push({
          id,
          type: 'var',
          name: el.getAttribute('name') || '',
          expr: el.getAttribute('expr') || undefined
        });
        break;
      case 'assign':
        actions.push({
          id,
          type: 'assign',
          name: el.getAttribute('name') || '',
          expr: el.getAttribute('expr') || ''
        });
        break;
      case 'send':
        actions.push({
          id,
          type: 'send',
          event: el.getAttribute('event') || undefined,
          target: el.getAttribute('target') || undefined,
          targettype: el.getAttribute('targettype') || undefined,
          delay: el.getAttribute('delay') || undefined,
          namelist: el.getAttribute('namelist') || undefined,
          sendid: el.getAttribute('sendid') || undefined
        });
        break;
      case 'cancel':
        actions.push({
          id,
          type: 'cancel',
          sendid: el.getAttribute('sendid') || undefined
        });
        break;
      case 'log':
        actions.push({
          id,
          type: 'log',
          expr: el.getAttribute('expr') || undefined,
          label: el.getAttribute('label') || undefined
        });
        break;
      case 'exit':
        actions.push({
          id,
          type: 'exit',
          expr: el.getAttribute('expr') || undefined,
          namelist: el.getAttribute('namelist') || undefined
        });
        break;
    }
  }

  return actions;
}

export function parseCcxml(xmlString: string): ParseResult {
  const settings: CcxmlDocSettings = getDefaultSettings();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  if (!xmlString || xmlString.trim() === '') {
    return { nodes, edges, settings, error: 'Empty CCXML content' };
  }

  try {
    const parser = getDOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    const parserError = doc.getElementsByTagName('parsererror');
    if (parserError && parserError.length > 0) {
      return {
        nodes,
        edges,
        settings,
        error: parserError[0].textContent || 'XML Parsing Error'
      };
    }

    const ccxmlEl = doc.getElementsByTagName('ccxml')[0];
    if (!ccxmlEl) {
      return { nodes, edges, settings, error: 'Missing root <ccxml> element' };
    }

    settings.version = (ccxmlEl.getAttribute('version') as any) || '1.0';
    settings.xmlns = ccxmlEl.getAttribute('xmlns') || 'http://www.w3.org/2002/09/ccxml';

    // Global variables
    const varEls = ccxmlEl.childNodes;
    settings.globalVars = [];
    for (let i = 0; i < varEls.length; i++) {
      const el = varEls[i] as Element;
      if (el.nodeType === 1 && el.tagName.toLowerCase() === 'var') {
        const name = el.getAttribute('name');
        if (name) {
          settings.globalVars.push({
            name,
            expr: el.getAttribute('expr') || undefined
          });
        }
      }
    }

    // Global script
    const scriptEls = ccxmlEl.getElementsByTagName('script');
    if (scriptEls.length > 0 && scriptEls[0].parentNode === ccxmlEl) {
      settings.globalScript = scriptEls[0].textContent?.trim() || '';
    }

    // Eventprocessor
    const epEl = ccxmlEl.getElementsByTagName('eventprocessor')[0];
    let stateVar = 'state';
    if (epEl) {
      stateVar = epEl.getAttribute('statevariable') || 'state';
      settings.statevariable = stateVar;
    }

    // Find transitions
    const transitionEls = epEl ? epEl.getElementsByTagName('transition') : [];
    const stateGroups = new Map<string, CcxmlTransition[]>();
    const globalTransitions: Array<{ id: string; event: string; cond?: string; actions: CcxmlAction[] }> = [];

    for (let i = 0; i < transitionEls.length; i++) {
      const tEl = transitionEls[i];
      const state = tEl.getAttribute('state');
      const event = tEl.getAttribute('event') || '*';
      const cond = tEl.getAttribute('cond') || undefined;
      const transId = 't_' + Math.random().toString(36).substring(2, 7);
      const actions = parseActions(tEl);

      // Check for state assignment in actions
      let targetState: string | undefined = undefined;
      for (const act of actions) {
        if (act.type === 'assign' && act.name === stateVar && act.expr) {
          // Clean quotes around target state name e.g. "'dialog_active'" -> "dialog_active"
          targetState = act.expr.replace(/^['"]|['"]$/g, '');
        }
      }

      const transitionObj: CcxmlTransition = {
        id: transId,
        event,
        cond,
        targetState,
        actions
      };

      if (state) {
        if (!stateGroups.has(state)) {
          stateGroups.set(state, []);
        }
        stateGroups.get(state)!.push(transitionObj);
      } else {
        globalTransitions.push({
          id: transId,
          event,
          cond,
          actions
        });
      }
    }

    // Build State Nodes
    let xPos = 60;
    let yPos = 100;
    const stateIdMap = new Map<string, string>(); // stateName -> nodeId

    let isFirst = true;
    for (const [stateName, transitions] of stateGroups.entries()) {
      const nodeId = `node_${stateName}`;
      stateIdMap.set(stateName, nodeId);

      const stateNode: Node = {
        id: nodeId,
        type: 'ccxml-state',
        position: { x: xPos, y: yPos },
        data: {
          label: stateName.toUpperCase(),
          stateName,
          isInitial: isFirst,
          transitions
        } as StateNodeData
      };

      nodes.push(stateNode);
      isFirst = false;
      xPos += 360;
      if (xPos > 1200) {
        xPos = 60;
        yPos += 380;
      }
    }

    // Build Global Handler Nodes
    for (const gt of globalTransitions) {
      const nodeId = `global_${gt.event.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const globalNode: Node = {
        id: nodeId,
        type: 'ccxml-global-handler',
        position: { x: xPos, y: yPos },
        data: {
          label: `Catch: ${gt.event}`,
          event: gt.event,
          cond: gt.cond,
          actions: gt.actions
        } as GlobalHandlerNodeData
      };
      nodes.push(globalNode);
      xPos += 360;
    }

    // Connect edges based on transition targetState
    for (const node of nodes) {
      if (node.type === 'ccxml-state') {
        const data = node.data as StateNodeData;
        for (const t of data.transitions) {
          if (t.targetState && stateIdMap.has(t.targetState)) {
            const targetNodeId = stateIdMap.get(t.targetState)!;
            edges.push({
              id: `edge_${node.id}_${t.id}`,
              source: node.id,
              sourceHandle: `trans-${t.id}`,
              target: targetNodeId,
              label: t.event,
              animated: true
            });
          }
        }
      }
    }

    return { nodes, edges, settings };
  } catch (err: any) {
    return { nodes, edges, settings, error: err.message || 'Failed to parse CCXML' };
  }
}
