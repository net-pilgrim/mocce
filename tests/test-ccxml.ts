import { TEMPLATES } from '../src/lib/templates/templates';
import { generateCcxml } from '../src/lib/ccxml/generator';
import { parseCcxml } from '../src/lib/ccxml/parser';
import { validateCcxml } from '../src/lib/ccxml/validator';
import { autoLayoutNodes } from '../src/lib/ccxml/layout';
import { CcxmlSimulator } from '../src/lib/simulator/ccxml-engine';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

console.log('🧪 Starting CCXML 1.0 Compliance & Architecture Test Suite...\n');

// Test 1: Inbound VoiceXML Dialog Runner Template
const t1 = TEMPLATES[0];
const ccxml1 = generateCcxml(t1.nodes, t1.edges, t1.settings);

assert(ccxml1.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'Includes XML declaration');
assert(ccxml1.includes('version="1.0"'), 'Root element specifies version="1.0"');
assert(ccxml1.includes('xmlns="http://www.w3.org/2002/09/ccxml"'), 'Root element includes standard W3C CCXML namespace');
assert(ccxml1.includes('<eventprocessor statevariable="state">'), 'Eventprocessor declares statevariable attribute');
assert(ccxml1.includes('<transition state="init" event="connection.alerting">'), 'Generates state-targeted transition');
assert(ccxml1.includes('<accept connectionid="in_callid"/>'), 'Generates <accept> action with connectionid');
assert(ccxml1.includes('<dialogstart src="&apos;http://example.com/ivr/main.vxml&apos;" connectionid="in_callid" dialogid="vxml_dialogid"/>'), 'Generates <dialogstart> with src, connectionid, and dialogid');
assert(ccxml1.includes('<assign name="state" expr="&apos;starting_dialog&apos;"/>'), 'Generates state transition assign statement from edge');
assert(ccxml1.includes('<transition event="error.*">'), 'Generates global error transition handler');

// Test 2: Two-Party Consultation Transfer Template
const t2 = TEMPLATES[1];
const ccxml2 = generateCcxml(t2.nodes, t2.edges, t2.settings);

assert(ccxml2.includes('<createcall dest="agent_uri" connectionid="out_callid" timeout="&apos;30s&apos;"/>'), 'Generates <createcall> with destination, connectionid and timeout');
assert(ccxml2.includes('<join id1="in_callid" id2="out_callid" duplex="full"/>'), 'Generates <join> action with id1, id2, and full duplex');
assert(ccxml2.includes('<disconnect connectionid="in_callid"/>'), 'Generates <disconnect> action');

// Test 3: Conference Bridge Template
const t3 = TEMPLATES[2];
const ccxml3 = generateCcxml(t3.nodes, t3.edges, t3.settings);

assert(ccxml3.includes('<createconference conferenceid="conf_id"/>'), 'Generates <createconference> action');
assert(ccxml3.includes('<unjoin id1="event$.connectionid" id2="conf_id"/>'), 'Generates <unjoin> action');

// Test 4: Spec Diagnostics and Validator
const diagClean = validateCcxml(t1.nodes, t1.edges, t1.settings);
assert(diagClean.filter((d) => d.severity === 'error').length === 0, 'Valid template produces 0 errors in validator');

// Test 4b: Broken edge detection
const brokenEdges = [
  ...t1.edges,
  { id: 'broken_1', source: 'state_init', target: 'non_existent_node_id' }
];
const diagBroken = validateCcxml(t1.nodes, brokenEdges, t1.settings);
assert(diagBroken.some((d) => d.id.includes('broken-edge')), 'Validator flags broken edge referencing non-existent state');

// Test 4c: Duplicate state names check
const dupNodes = [
  ...t1.nodes,
  {
    id: 'dup_state',
    type: 'ccxml-state',
    position: { x: 0, y: 0 },
    data: { label: 'Dup', stateName: 'init', transitions: [] }
  }
];
const diagDup = validateCcxml(dupNodes as any, t1.edges, t1.settings);
assert(diagDup.some((d) => d.id.includes('duplicate-state')), 'Validator flags duplicate state name according to CCXML 1.0 §6.2.2');

// Test 5: Auto Layout
const layoutNodes = autoLayoutNodes(t1.nodes, t1.edges);
assert(layoutNodes.length === t1.nodes.length, 'Auto layout preserves all nodes');
assert(layoutNodes.every((n) => typeof n.position.x === 'number' && typeof n.position.y === 'number'), 'All nodes have valid calculated coordinates');

// Test 6: Parser Reverse-Engineering
const parseResult = parseCcxml(ccxml1);
assert(!parseResult.error, `Parsed CCXML without error: ${parseResult.error}`);
assert(parseResult.nodes.length >= 3, `Parsed ${parseResult.nodes.length} nodes from generated CCXML`);
const parsedInit = parseResult.nodes.find((n) => (n.data as any).stateName === 'init');
assert(!!parsedInit, 'Successfully parsed init state node');
assert(parseResult.edges.length > 0, `Successfully reconstructed ${parseResult.edges.length} state transition edges`);

// Test 7: Telephony Simulator Execution
let simState: any = null;
const simulator = new CcxmlSimulator((s) => {
  simState = s;
});

simulator.updateGraph(t1.nodes, t1.edges);
simulator.startSession('init');

assert(simState.isActive === true, 'Simulator session started');
assert(simState.currentState === 'init', 'Simulator initial state is "init"');

// Trigger inbound call alerting
simulator.triggerInboundCall('+15559876543');
assert(Object.keys(simState.connections).length > 0, 'Simulator created inbound connection');
assert(simState.currentState === 'starting_dialog', 'Simulator successfully transitioned to starting_dialog state');

console.log('\n🎉 ALL CCXML 1.0 & CALL CONTROL TESTS PASSED SUCCESSFULLY!');
