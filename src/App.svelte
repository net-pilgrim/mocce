<script lang="ts">
  import { onMount } from 'svelte';
  import {
    SvelteFlow,
    Background,
    Controls,
    addEdge,
    type Node,
    type Edge,
    type Connection
  } from '@xyflow/svelte';
  import {
    PhoneCall,
    FileCode,
    Upload,
    Download,
    Sliders,
    Sparkles,
    LayoutGrid,
    CheckCircle2,
    ShieldAlert,
    Play,
    Check,
    Workflow,
    Activity,
    Layers
  } from '@lucide/svelte';

  import { nodeTypes } from './components/nodes';
  import LeftSidebar from './components/LeftSidebar.svelte';
  import Inspector from './components/Inspector.svelte';
  import CodeModal from './components/CodeModal.svelte';
  import ImportModal from './components/ImportModal.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import DiagnosticsPanel from './components/DiagnosticsPanel.svelte';
  import SimulatorModal from './components/SimulatorModal.svelte';

  import { generateCcxml } from './lib/ccxml/generator';
  import { parseCcxml, type ParseResult } from './lib/ccxml/parser';
  import { validateCcxml } from './lib/ccxml/validator';
  import { autoLayoutNodes } from './lib/ccxml/layout';
  import { TEMPLATES, type CcxmlTemplate } from './lib/templates/templates';
  import { CcxmlSimulator } from './lib/simulator/ccxml-engine';
  import type { CcxmlDocSettings, CcxmlNodeType, StateNodeData } from './types/ccxml';
  import type { SimulatorState } from './types/simulator';

  // Initial template: VoiceXML Inbound Dialog Runner
  const initialTemplate = TEMPLATES[0];

  let nodes = $state.raw<Node[]>(JSON.parse(JSON.stringify(initialTemplate.nodes)));
  let edges = $state.raw<Edge[]>(JSON.parse(JSON.stringify(initialTemplate.edges)));
  let docSettings = $state<CcxmlDocSettings>(JSON.parse(JSON.stringify(initialTemplate.settings)));

  let selectedNode = $state<Node | null>(null);
  let isSidebarCollapsed = $state(false);

  // Modals
  let showCodeModal = $state(false);
  let showImportModal = $state(false);
  let showSettingsModal = $state(false);
  let showDiagnostics = $state(false);
  let showSimulator = $state(false);

  // Toast feedback
  let toastMessage = $state<string | null>(null);

  function showToast(msg: string) {
    toastMessage = msg;
    setTimeout(() => {
      if (toastMessage === msg) toastMessage = null;
    }, 3000);
  }

  // Reactive Derived computations
  let diagnostics = $derived(validateCcxml(nodes, edges, docSettings));
  let generatedCcxml = $derived(generateCcxml(nodes, edges, docSettings));

  let errorCount = $derived(diagnostics.filter((d) => d.severity === 'error').length);
  let warningCount = $derived(diagnostics.filter((d) => d.severity === 'warning').length);

  // Simulator Instance
  let simulatorState = $state<SimulatorState>({
    isActive: false,
    currentState: 'init',
    activeNodeId: null,
    connections: {},
    conferences: {},
    activeDialog: null,
    variables: {},
    eventQueue: [],
    logs: []
  });

  const ccxmlSimulator = new CcxmlSimulator((newState) => {
    simulatorState = newState;
  });

  $effect(() => {
    ccxmlSimulator.updateGraph(nodes, edges, docSettings.statevariable);
  });

  // Dynamically update active node glow during simulation
  $effect(() => {
    const activeId = simulatorState.activeNodeId;
    let changed = false;
    const updated = nodes.map((n) => {
      const isSimActive = n.id === activeId && simulatorState.isActive;
      if (n.data.isSimulatingActive !== isSimActive) {
        changed = true;
        return {
          ...n,
          data: {
            ...n.data,
            isSimulatingActive: isSimActive
          }
        };
      }
      return n;
    });

    if (changed) {
      nodes = updated;
    }
  });

  // Graph manipulation callbacks
  function handleConnect(connection: Connection) {
    edges = addEdge(
      {
        ...connection,
        animated: true,
        label: 'transition'
      },
      edges
    );
    showToast('State transition edge connected');
  }

  function handleNodeClick(e: { node: Node }) {
    selectedNode = e.node;
  }

  function handlePaneClick() {
    selectedNode = null;
  }

  function handleAddNode(type: CcxmlNodeType) {
    const newId = `node_${Math.random().toString(36).substring(2, 7)}`;
    const newX = 200 + Math.random() * 200;
    const newY = 150 + Math.random() * 150;

    if (type === 'ccxml-state') {
      const stateName = `state_${nodes.filter((n) => n.type === 'ccxml-state').length + 1}`;
      const newNode: Node = {
        id: newId,
        type: 'ccxml-state',
        position: { x: newX, y: newY },
        data: {
          label: stateName.toUpperCase(),
          stateName,
          transitions: [
            {
              id: 't_' + Math.random().toString(36).substring(2, 6),
              event: 'connection.connected',
              actions: []
            }
          ]
        } as StateNodeData
      };
      nodes = [...nodes, newNode];
      selectedNode = newNode;
      showToast(`Created <state> node: "${stateName}"`);
    } else if (type === 'ccxml-global-handler') {
      const newNode: Node = {
        id: newId,
        type: 'ccxml-global-handler',
        position: { x: newX, y: newY },
        data: {
          label: 'Global Handler',
          event: 'error.*',
          actions: []
        }
      };
      nodes = [...nodes, newNode];
      selectedNode = newNode;
      showToast('Created Global Catch Node');
    }
  }

  function handleUpdateNode(nodeId: string, updatedData: any) {
    nodes = nodes.map((n) => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: { ...updatedData }
        };
      }
      return n;
    });

    if (selectedNode && selectedNode.id === nodeId) {
      selectedNode = { ...selectedNode, data: updatedData };
    }
  }

  function handleDeleteNode(nodeId: string) {
    nodes = nodes.filter((n) => n.id !== nodeId);
    edges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    if (selectedNode?.id === nodeId) {
      selectedNode = null;
    }
    showToast('Deleted node');
  }

  function handleDuplicateNode(node: Node) {
    const newId = `node_${Math.random().toString(36).substring(2, 7)}`;
    const duplicate: Node = {
      ...JSON.parse(JSON.stringify(node)),
      id: newId,
      position: {
        x: node.position.x + 40,
        y: node.position.y + 40
      }
    };
    if (duplicate.data && duplicate.data.stateName) {
      duplicate.data.stateName += '_copy';
    }
    nodes = [...nodes, duplicate];
    selectedNode = duplicate;
    showToast('Duplicated node');
  }

  function handleAutoLayout() {
    nodes = autoLayoutNodes(nodes, edges);
    showToast('Canvas auto-organized via DAG topological layout');
  }

  function handleSelectTemplate(template: CcxmlTemplate) {
    nodes = JSON.parse(JSON.stringify(template.nodes));
    edges = JSON.parse(JSON.stringify(template.edges));
    docSettings = JSON.parse(JSON.stringify(template.settings));
    selectedNode = null;
    showToast(`Loaded template: "${template.name}"`);
  }

  function handleImportResult(result: ParseResult) {
    nodes = result.nodes;
    edges = result.edges;
    docSettings = result.settings;
    selectedNode = null;
    showToast(`Imported CCXML document with ${result.nodes.length} states`);
  }

  function handleExportFile() {
    const blob = new Blob([generatedCcxml], { type: 'application/ccxml+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'callflow.ccxml';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported callflow.ccxml');
  }
</script>

<div class="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
  <!-- Top Navigation & Control Header -->
  <header class="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 z-30 shadow-md">
    <!-- Brand -->
    <div class="flex items-center gap-3">
      <div class="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-slate-950 shadow-lg shadow-cyan-950/50">
        <PhoneCall class="w-5 h-5 fill-current" />
      </div>

      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm font-bold tracking-tight text-white">MOCCE - CCXML Studio</h1>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50 flex items-center gap-1 font-semibold">
            <Sparkles class="w-3 h-3 text-cyan-400" /> CCXML 1.0
          </span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            W3C REC
          </span>
        </div>
        <p class="text-[10px] text-slate-400">Call Control State Machine & VoiceXML Orchestration Studio</p>
      </div>
    </div>

    <!-- Center: Toolbar Controls -->
    <div class="flex items-center gap-2">
      <button
        onclick={handleAutoLayout}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        title="Automatically organize states"
      >
        <LayoutGrid class="w-3.5 h-3.5 text-cyan-400" />
        <span>Auto Layout</span>
      </button>

      <button
        onclick={() => (showDiagnostics = !showDiagnostics)}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors {errorCount > 0
          ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          : warningCount > 0
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            : 'bg-slate-800 border-slate-700 text-slate-200'}"
      >
        <CheckCircle2 class="w-3.5 h-3.5 text-cyan-400" />
        <span>Diagnostics</span>
        {#if errorCount > 0}
          <span class="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">{errorCount}</span>
        {/if}
      </button>

      <button
        onclick={() => {
          showSimulator = true;
          ccxmlSimulator.startSession();
        }}
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/50 transition-colors"
      >
        <Play class="w-3.5 h-3.5 fill-current" />
        <span>Run Simulator</span>
      </button>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-2">
      <button
        onclick={() => (showImportModal = true)}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 text-xs font-medium transition-colors"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>Import XML</span>
      </button>

      <button
        onclick={handleExportFile}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-950/50 transition-colors"
      >
        <Download class="w-3.5 h-3.5" />
        <span>Export .ccxml</span>
      </button>

      <button
        onclick={() => (showCodeModal = true)}
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        title="Inspect generated CCXML code"
      >
        <FileCode class="w-3.5 h-3.5 text-indigo-400" />
        <span>Code</span>
      </button>

      <button
        onclick={() => (showSettingsModal = true)}
        class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        title="CCXML Document Settings"
      >
        <Sliders class="w-4 h-4 text-slate-400" />
      </button>
    </div>
  </header>

  <!-- Main Workspace -->
  <div class="flex-1 flex w-full h-[calc(100vh-3.5rem)] relative overflow-hidden">
    <!-- Left Sidebar -->
    <LeftSidebar
      bind:isCollapsed={isSidebarCollapsed}
      {errorCount}
      {warningCount}
      onSelectTemplate={handleSelectTemplate}
      onAddNode={handleAddNode}
      onAutoLayout={handleAutoLayout}
      onOpenSimulator={() => {
        showSimulator = true;
        ccxmlSimulator.startSession();
      }}
      onOpenCode={() => (showCodeModal = true)}
      onOpenImport={() => (showImportModal = true)}
      onOpenSettings={() => (showSettingsModal = true)}
      onOpenDiagnostics={() => (showDiagnostics = true)}
      onToggleCollapse={() => (isSidebarCollapsed = !isSidebarCollapsed)}
    />

    <!-- Svelte Flow Canvas -->
    <div class="flex-1 h-full w-full relative bg-slate-950">
      <SvelteFlow
        bind:nodes
        bind:edges
        {nodeTypes}
        onconnect={handleConnect}
        onnodeclick={handleNodeClick}
        onpaneclick={handlePaneClick}
        fitView
      >
        <Background gap={20} size={1.2} patternColor="#1e293b" />
        <Controls class="!bg-slate-900 !border-slate-800 !text-slate-300" />
      </SvelteFlow>

      <!-- Toast Feedback -->
      {#if toastMessage}
        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-full bg-slate-900/95 border border-cyan-500/40 text-cyan-200 text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-sm">
          <Check class="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      {/if}
    </div>

    <!-- Inspector Sidebar -->
    {#if selectedNode}
      <Inspector
        {selectedNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onDuplicateNode={handleDuplicateNode}
        onClose={() => (selectedNode = null)}
      />
    {/if}
  </div>

  <!-- Modals -->
  <CodeModal
    isOpen={showCodeModal}
    ccxmlCode={generatedCcxml}
    onClose={() => (showCodeModal = false)}
  />

  <ImportModal
    isOpen={showImportModal}
    onImport={handleImportResult}
    onClose={() => (showImportModal = false)}
  />

  <SettingsModal
    isOpen={showSettingsModal}
    settings={docSettings}
    onSave={(updated) => {
      docSettings = updated;
      showToast('Updated CCXML document settings');
    }}
    onClose={() => (showSettingsModal = false)}
  />

  <DiagnosticsPanel
    isOpen={showDiagnostics}
    diagnostics={diagnostics}
    onSelectNode={(nodeId) => {
      const target = nodes.find((n) => n.id === nodeId);
      if (target) selectedNode = target;
    }}
    onClose={() => (showDiagnostics = false)}
  />

  <SimulatorModal
    isOpen={showSimulator}
    simulatorState={simulatorState}
    onStartSession={() => ccxmlSimulator.startSession()}
    onStopSession={() => ccxmlSimulator.stopSession()}
    onTriggerInboundCall={(callerId) => ccxmlSimulator.triggerInboundCall(callerId)}
    onDispatchEvent={(ev, data) => ccxmlSimulator.dispatchEvent(ev, data)}
    onFinishDialog={(values) => ccxmlSimulator.finishActiveDialog(values)}
    onClose={() => (showSimulator = false)}
  />
</div>
