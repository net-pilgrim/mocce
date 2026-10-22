<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { Workflow, PhoneCall, Bot, AlertTriangle, ArrowRight, Play, CheckCircle } from '@lucide/svelte';
  import type { StateNodeData } from '../../types/ccxml';

  let { id, data, selected = false }: { id: string; data: StateNodeData; selected?: boolean } = $props();

  function getEventBadgeColor(event: string = ''): string {
    if (event.startsWith('connection.')) return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    if (event.startsWith('dialog.')) return 'bg-violet-500/10 text-violet-300 border-violet-500/30';
    if (event.startsWith('conference.')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (event.startsWith('error.')) return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  }
</script>

<div
  class="w-80 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-cyan-400 ring-2 ring-cyan-400/30'
      : 'border-slate-700 hover:border-slate-500'}"
>
  <!-- Input Handle (Incoming state transitions) -->
  <Handle
    type="target"
    position={Position.Top}
    class="!w-3 !h-3 !bg-cyan-400 !border-2 !border-slate-900"
  />

  <!-- Header -->
  <div class="bg-slate-950/80 border-b border-slate-800 p-3 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
        <Workflow class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-bold text-slate-100 uppercase tracking-wide truncate">
          {data.stateName || id}
        </div>
        <div class="text-[10px] text-cyan-400 font-mono">ccxml:state</div>
      </div>
    </div>

    <div class="flex items-center gap-1.5">
      {#if data.isSimulatingActive}
        <span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400 animate-pulse flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          ACTIVE
        </span>
      {/if}
      {#if data.isInitial}
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
          INITIAL
        </span>
      {/if}
    </div>
  </div>

  <!-- Transitions and Actions Body -->
  <div class="p-3 space-y-2 text-xs">
    {#if !data.transitions || data.transitions.length === 0}
      <div class="text-[11px] text-slate-500 italic p-2 text-center border border-dashed border-slate-800 rounded">
        No event transitions defined
      </div>
    {:else}
      <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
        <span>Transitions ({data.transitions.length})</span>
        <span class="text-[9px] text-slate-500">EHIA Handlers</span>
      </div>

      <div class="space-y-1.5">
        {#each data.transitions as t, idx (t.id || idx)}
          <div class="relative group bg-slate-950/70 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
            <div class="flex items-center justify-between pr-3">
              <span class="px-1.5 py-0.5 rounded font-mono text-[10px] border {getEventBadgeColor(t.event)}">
                {t.event}
              </span>
              {#if t.actions && t.actions.length > 0}
                <span class="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                  {t.actions.length} action{t.actions.length > 1 ? 's' : ''}
                </span>
              {/if}
            </div>

            {#if t.cond}
              <div class="mt-1 text-[10px] font-mono text-amber-300/90 truncate bg-slate-900/60 px-1 py-0.5 rounded border border-amber-900/30">
                cond: {t.cond}
              </div>
            {/if}

            {#if t.actions && t.actions.length > 0}
              <div class="mt-1 flex flex-wrap gap-1">
                {#each t.actions.slice(0, 3) as act}
                  <span class="text-[9px] px-1 py-0.2 bg-slate-900 text-slate-300 rounded font-mono border border-slate-800">
                    &lt;{act.type}&gt;
                  </span>
                {/each}
                {#if t.actions.length > 3}
                  <span class="text-[9px] text-slate-500 font-mono">+{t.actions.length - 3}</span>
                {/if}
              </div>
            {/if}

            <!-- Dedicated Handle for this transition -->
            <Handle
              type="source"
              position={Position.Right}
              id="trans-{t.id}"
              class="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-slate-900 !right-[-5px]"
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Fallback bottom handle -->
  <Handle
    type="source"
    position={Position.Bottom}
    id="default"
    class="!w-2.5 !h-2.5 !bg-slate-600 !border-2 !border-slate-900"
  />
</div>
