import type { Node, Edge } from '@xyflow/svelte';
import type { CcxmlDocSettings, StateNodeData, GlobalHandlerNodeData } from '../../types/ccxml';
import { getDefaultSettings } from '../ccxml/parser';

export interface CcxmlTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  settings: CcxmlDocSettings;
}

export const TEMPLATES: CcxmlTemplate[] = [
  {
    id: 'inbound-vxml-dialog',
    name: 'VoiceXML Inbound Dialog Runner',
    description: 'Standard telephony pattern: accept incoming call, launch VoiceXML IVR dialog, and terminate on completion.',
    settings: {
      ...getDefaultSettings(),
      globalVars: [
        { name: 'in_callid' },
        { name: 'vxml_dialogid' }
      ]
    },
    nodes: [
      {
        id: 'state_init',
        type: 'ccxml-state',
        position: { x: 50, y: 120 },
        data: {
          label: 'INIT STATE',
          stateName: 'init',
          isInitial: true,
          transitions: [
            {
              id: 't_alerting',
              event: 'connection.alerting',
              targetState: 'starting_dialog',
              actions: [
                { id: 'a1', type: 'assign', name: 'in_callid', expr: 'event$.connectionid' },
                { id: 'a2', type: 'accept', connectionid: 'in_callid' },
                { id: 'a3', type: 'log', expr: "'Incoming call accepted from ' + event$.connection.remote" }
              ]
            }
          ]
        } as StateNodeData
      },
      {
        id: 'state_dialog',
        type: 'ccxml-state',
        position: { x: 440, y: 120 },
        data: {
          label: 'IN DIALOG',
          stateName: 'starting_dialog',
          transitions: [
            {
              id: 't_connected',
              event: 'connection.connected',
              targetState: 'in_dialog',
              actions: [
                {
                  id: 'a4',
                  type: 'dialogstart',
                  src: "'http://example.com/ivr/main.vxml'",
                  connectionid: 'in_callid',
                  dialogid: 'vxml_dialogid'
                }
              ]
            },
            {
              id: 't_exit',
              event: 'dialog.exit',
              targetState: 'wrapup',
              actions: [
                { id: 'a5', type: 'log', expr: "'VoiceXML dialog completed normally'" },
                { id: 'a6', type: 'disconnect', connectionid: 'in_callid' }
              ]
            }
          ]
        } as StateNodeData
      },
      {
        id: 'state_wrapup',
        type: 'ccxml-state',
        position: { x: 830, y: 120 },
        data: {
          label: 'WRAPUP / EXIT',
          stateName: 'wrapup',
          transitions: [
            {
              id: 't_term',
              event: 'connection.disconnected',
              actions: [
                { id: 'a7', type: 'log', expr: "'Call disconnected. CCXML session exiting.'" },
                { id: 'a8', type: 'exit' }
              ]
            }
          ]
        } as StateNodeData
      },
      {
        id: 'global_catch_error',
        type: 'ccxml-global-handler',
        position: { x: 440, y: 460 },
        data: {
          label: 'Global Error Catcher',
          event: 'error.*',
          actions: [
            { id: 'a9', type: 'log', expr: "'System error caught: ' + event$.name + ' - ' + event$.reason" },
            { id: 'a10', type: 'disconnect', connectionid: 'in_callid' },
            { id: 'a11', type: 'exit' }
          ]
        } as GlobalHandlerNodeData
      }
    ],
    edges: [
      {
        id: 'e_init_dialog',
        source: 'state_init',
        sourceHandle: 'trans-t_alerting',
        target: 'state_dialog',
        label: 'connection.alerting'
      },
      {
        id: 'e_dialog_wrapup',
        source: 'state_dialog',
        sourceHandle: 'trans-t_exit',
        target: 'state_wrapup',
        label: 'dialog.exit'
      }
    ]
  },
  {
    id: 'consultation-transfer',
    name: 'Two-Party Consultation Transfer',
    description: 'Bridges caller to a live agent: accepts inbound call, initiates outbound leg via <createcall>, and bridges audio via <join>.',
    settings: {
      ...getDefaultSettings(),
      globalVars: [
        { name: 'in_callid' },
        { name: 'out_callid' },
        { name: 'agent_uri', expr: "'tel:+18005550199'" }
      ]
    },
    nodes: [
      {
        id: 'state_c_init',
        type: 'ccxml-state',
        position: { x: 50, y: 100 },
        data: {
          label: 'INIT STATE',
          stateName: 'init',
          isInitial: true,
          transitions: [
            {
              id: 't_c_alert',
              event: 'connection.alerting',
              targetState: 'consulting',
              actions: [
                { id: 'ca1', type: 'assign', name: 'in_callid', expr: 'event$.connectionid' },
                { id: 'ca2', type: 'accept', connectionid: 'in_callid' }
              ]
            }
          ]
        } as StateNodeData
      },
      {
        id: 'state_c_consult',
        type: 'ccxml-state',
        position: { x: 440, y: 100 },
        data: {
          label: 'DIALING AGENT',
          stateName: 'consulting',
          transitions: [
            {
              id: 't_c_conn',
              event: 'connection.connected',
              cond: 'event$.connectionid === in_callid',
              actions: [
                {
                  id: 'ca3',
                  type: 'createcall',
                  dest: 'agent_uri',
                  connectionid: 'out_callid',
                  timeout: "'30s'"
                }
              ]
            },
            {
              id: 't_c_agent_conn',
              event: 'connection.connected',
              cond: 'event$.connectionid === out_callid',
              targetState: 'bridged',
              actions: [
                {
                  id: 'ca4',
                  type: 'join',
                  id1: 'in_callid',
                  id2: 'out_callid',
                  duplex: 'full'
                },
                { id: 'ca5', type: 'log', expr: "'Caller and agent audio bridged successfully'" }
              ]
            }
          ]
        } as StateNodeData
      },
      {
        id: 'state_c_bridged',
        type: 'ccxml-state',
        position: { x: 840, y: 100 },
        data: {
          label: 'BRIDGED CONVERSATION',
          stateName: 'bridged',
          transitions: [
            {
              id: 't_c_disconn',
              event: 'connection.disconnected',
              actions: [
                { id: 'ca6', type: 'disconnect', connectionid: 'in_callid' },
                { id: 'ca7', type: 'disconnect', connectionid: 'out_callid' },
                { id: 'ca8', type: 'exit' }
              ]
            }
          ]
        } as StateNodeData
      }
    ],
    edges: [
      {
        id: 'e_c_init_consult',
        source: 'state_c_init',
        sourceHandle: 'trans-t_c_alert',
        target: 'state_c_consult',
        label: 'connection.alerting'
      },
      {
        id: 'e_c_consult_bridge',
        source: 'state_c_consult',
        sourceHandle: 'trans-t_c_agent_conn',
        target: 'state_c_bridged',
        label: 'agent connected'
      }
    ]
  },
  {
    id: 'conference-bridge',
    name: 'Multi-Party Audio Conference',
    description: 'Creates a telephony audio conference bridge and dynamically joins incoming participants.',
    settings: {
      ...getDefaultSettings(),
      globalVars: [
        { name: 'conf_id', expr: "'acme_conf_room'" },
        { name: 'participant_count', expr: '0' }
      ]
    },
    nodes: [
      {
        id: 'state_conf_init',
        type: 'ccxml-state',
        position: { x: 50, y: 120 },
        data: {
          label: 'CONFERENCE SETUP',
          stateName: 'setup_conference',
          isInitial: true,
          transitions: [
            {
              id: 't_conf_start',
              event: 'ccxml.loaded',
              actions: [
                { id: 'cfa1', type: 'createconference', conferenceid: 'conf_id' }
              ]
            },
            {
              id: 't_conf_ready',
              event: 'conference.created',
              targetState: 'conference_active',
              actions: [
                { id: 'cfa2', type: 'log', expr: "'Audio conference room ready: ' + conf_id" }
              ]
            }
          ]
        } as StateNodeData
      },
      {
        id: 'state_conf_active',
        type: 'ccxml-state',
        position: { x: 450, y: 120 },
        data: {
          label: 'CONFERENCE ACTIVE',
          stateName: 'conference_active',
          transitions: [
            {
              id: 't_caller_join',
              event: 'connection.alerting',
              actions: [
                { id: 'cfa3', type: 'accept', connectionid: 'event$.connectionid' }
              ]
            },
            {
              id: 't_caller_bridge',
              event: 'connection.connected',
              actions: [
                { id: 'cfa4', type: 'join', id1: 'event$.connectionid', id2: 'conf_id', duplex: 'full' },
                { id: 'cfa5', type: 'assign', name: 'participant_count', expr: 'participant_count + 1' },
                { id: 'cfa6', type: 'log', expr: "'Participant joined conference. Total: ' + participant_count" }
              ]
            },
            {
              id: 't_caller_leave',
              event: 'connection.disconnected',
              actions: [
                { id: 'cfa7', type: 'unjoin', id1: 'event$.connectionid', id2: 'conf_id' },
                { id: 'cfa8', type: 'assign', name: 'participant_count', expr: 'participant_count - 1' }
              ]
            }
          ]
        } as StateNodeData
      }
    ],
    edges: [
      {
        id: 'e_conf_init_active',
        source: 'state_conf_init',
        sourceHandle: 'trans-t_conf_ready',
        target: 'state_conf_active',
        label: 'conference.created'
      }
    ]
  },
  {
    id: 'call-screening',
    name: 'Call Screening & Deflection',
    description: 'Inspects caller ID against screening rules to reject spam or redirect callers.',
    settings: {
      ...getDefaultSettings(),
      globalVars: [
        { name: 'in_callid' }
      ]
    },
    nodes: [
      {
        id: 'state_scr_init',
        type: 'ccxml-state',
        position: { x: 50, y: 120 },
        data: {
          label: 'CALL SCREENER',
          stateName: 'screen_call',
          isInitial: true,
          transitions: [
            {
              id: 't_scr_spam',
              event: 'connection.alerting',
              cond: "event$.connection.remote.startsWith('+1800')",
              actions: [
                { id: 's1', type: 'reject', connectionid: 'event$.connectionid', reason: "'unsolicited'" },
                { id: 's2', type: 'log', expr: "'Rejected telemarketer call'" }
              ]
            },
            {
              id: 't_scr_valid',
              event: 'connection.alerting',
              targetState: 'accepted_call',
              actions: [
                { id: 's3', type: 'assign', name: 'in_callid', expr: 'event$.connectionid' },
                { id: 's4', type: 'accept', connectionid: 'in_callid' }
              ]
            }
          ]
        } as StateNodeData
      },
      {
        id: 'state_scr_accepted',
        type: 'ccxml-state',
        position: { x: 450, y: 120 },
        data: {
          label: 'ACCEPTED CALL',
          stateName: 'accepted_call',
          transitions: [
            {
              id: 't_scr_dialog',
              event: 'connection.connected',
              actions: [
                { id: 's5', type: 'dialogstart', src: "'welcome.vxml'", connectionid: 'in_callid' }
              ]
            },
            {
              id: 't_scr_term',
              event: 'connection.disconnected',
              actions: [
                { id: 's6', type: 'exit' }
              ]
            }
          ]
        } as StateNodeData
      }
    ],
    edges: [
      {
        id: 'e_scr_accepted',
        source: 'state_scr_init',
        sourceHandle: 'trans-t_scr_valid',
        target: 'state_scr_accepted',
        label: 'valid caller'
      }
    ]
  }
];
