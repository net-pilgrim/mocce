<script lang="ts">
  import {
    Workflow,
    ShieldAlert,
    PhoneCall,
    Sparkles,
    LayoutGrid,
    FileCode,
    Upload,
    Sliders,
    Play,
    CheckCircle2,
    ShieldAlert as AlertShield,
    ChevronLeft,
    ChevronRight,
    Plus,
    Activity,
    Layers,
    PhoneForwarded,
    Users
  } from '@lucide/svelte';
  import { TEMPLATES, type CcxmlTemplate } from '../lib/templates/templates';
  import type { CcxmlNodeType } from '../types/ccxml';

  let {
    isCollapsed = $bindable(false),
    errorCount = 0,
    warningCount = 0,
    onSelectTemplate,
    onAddNode,
    onAutoLayout,
    onOpenSimulator,
    onOpenCode,
    onOpenImport,
    onOpenSettings,
    onOpenDiagnostics,
    onToggleCollapse
  }: {
    isCollapsed: boolean;
    errorCount: number;
    warningCount: number;
    onSelectTemplate: (template: CcxmlTemplate) => void;
    onAddNode: (type: CcxmlNodeType) => void;
    onAutoLayout: () => void;
    onOpenSimulator: () => void;
    onOpenCode: () => void;
    onOpenImport: () => void;
    onOpenSettings: () => void;
    onOpenDiagnostics: () => void;
    onToggleCollapse: () => void;
  } = $props();

  let selectedTemplateId = $state(TEMPLATES[0].id);

  function handleTemplateChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const template = TEMPLATES.find((t) => t.id === target.value);
    if (template) {
      selectedTemplateId = template.id;
      onSelectTemplate(template);
    }
  }
</script>

<aside
  class="h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 z-20 select-none {isCollapsed
    ? 'w-16'
    : 'w-72'}"
>
  <!-- Brand / Header -->
  <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
    <div class="flex items-center gap-2.5 overflow-hidden">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
        <PhoneCall class="w-5 h-5 text-slate-950 stroke-[2.5]" />
      </div>
      {#if !isCollapsed}
        <div class="truncate">
          <div class="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
            <span>MOCCE</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">1.0</span>
          </div>
          <div class="text-[10px] text-slate-400 font-medium truncate">CCXML Visual Studio</div>
        </div>
      {/if}
    </div>

    <button
      onclick={onToggleCollapse}
      class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
      title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
    >
      {#if isCollapsed}
        <ChevronRight class="w-4 h-4" />
      {:else}
        <ChevronLeft class="w-4 h-4" />
      {/if}
    </button>
  </div>

  <!-- Body -->
  <div class="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
    {#if !isCollapsed}
      <!-- Templates Selector -->
      <div class="space-y-1.5">
        <label for="template-select" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telephony Template</label>
        <select
          id="template-select"
          value={selectedTemplateId}
          onchange={handleTemplateChange}
          class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
        >
          {#each TEMPLATES as t}
            <option value={t.id}>{t.name}</option>
          {/each}
        </select>
      </div>

      <!-- Quick Add Palette -->
      <div class="space-y-2 pt-2 border-t border-slate-800/80">
        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canvas Elements</div>
        <div class="grid grid-cols-1 gap-1.5">
          <button
            onclick={() => onAddNode('ccxml-state')}
            class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-left transition-all group"
          >
            <div class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:scale-105 transition-transform">
              <Workflow class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-200 text-xs">&lt;state&gt; Node</div>
              <div class="text-[10px] text-slate-400">Finite state with event handles</div>
            </div>
          </button>

          <button
            onclick={() => onAddNode('ccxml-global-handler')}
            class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-left transition-all group"
          >
            <div class="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 group-hover:scale-105 transition-transform">
              <ShieldAlert class="w-4 h-4" />
            </div>
            <div>
              <div class="font-bold text-slate-200 text-xs">Global Catch Node</div>
              <div class="text-[10px] text-slate-400">error.* or general events</div>
            </div>
          </button>
        </div>
      </div>
    {:else}
      <!-- Collapsed Quick Add Icons -->
      <div class="flex flex-col items-center gap-2">
        <button
          onclick={() => onAddNode('ccxml-state')}
          class="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30"
          title="Add CCXML State"
        >
          <Workflow class="w-5 h-5" />
        </button>
        <button
          onclick={() => onAddNode('ccxml-global-handler')}
          class="p-2.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30"
          title="Add Global Catch Handler"
        >
          <ShieldAlert class="w-5 h-5" />
        </button>
      </div>
    {/if}

    <!-- Primary Actions -->
    <div class="space-y-1 pt-2 border-t border-slate-800/80">
      <button
        onclick={onOpenSimulator}
        class="w-full flex items-center {isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'} rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-950/40"
        title="Launch Call Control Simulator"
      >
        <Play class="w-4 h-4 fill-current shrink-0" />
        {#if !isCollapsed}
          <span>Run PBX Simulator</span>
        {/if}
      </button>

      <button
        onclick={onAutoLayout}
        class="w-full flex items-center {isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'} rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        title="Auto Organize Canvas"
      >
        <LayoutGrid class="w-4 h-4 text-cyan-400 shrink-0" />
        {#if !isCollapsed}
          <span>Auto Layout DAG</span>
        {/if}
      </button>

      <button
        onclick={onOpenDiagnostics}
        class="w-full flex items-center {isCollapsed ? 'justify-center p-2.5' : 'justify-between p-2'} rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        title="W3C Spec Diagnostics"
      >
        <div class="flex items-center gap-2.5">
          <CheckCircle2 class="w-4 h-4 text-blue-400 shrink-0" />
          {#if !isCollapsed}
            <span>Diagnostics</span>
          {/if}
        </div>
        {#if !isCollapsed && (errorCount > 0 || warningCount > 0)}
          <div class="flex items-center gap-1 font-mono text-[10px]">
            {#if errorCount > 0}
              <span class="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">{errorCount}</span>
            {/if}
            {#if warningCount > 0}
              <span class="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">{warningCount}</span>
            {/if}
          </div>
        {/if}
      </button>
    </div>

    <!-- Utilities -->
    <div class="space-y-1 pt-2 border-t border-slate-800/80">
      <button
        onclick={onOpenCode}
        class="w-full flex items-center {isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'} rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        title="View CCXML 1.0 Code"
      >
        <FileCode class="w-4 h-4 text-indigo-400 shrink-0" />
        {#if !isCollapsed}
          <span>CCXML Code</span>
        {/if}
      </button>

      <button
        onclick={onOpenImport}
        class="w-full flex items-center {isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'} rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        title="Import CCXML Markup"
      >
        <Upload class="w-4 h-4 text-purple-400 shrink-0" />
        {#if !isCollapsed}
          <span>Import XML</span>
        {/if}
      </button>

      <button
        onclick={onOpenSettings}
        class="w-full flex items-center {isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'} rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
        title="Document Settings"
      >
        <Sliders class="w-4 h-4 text-slate-400 shrink-0" />
        {#if !isCollapsed}
          <span>Document Settings</span>
        {/if}
      </button>
    </div>
  </div>
</aside>
