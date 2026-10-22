<script lang="ts">
  import { Handle, Position } from '@xyflow/svelte';
  import { ShieldAlert, Zap, Terminal } from '@lucide/svelte';
  import type { GlobalHandlerNodeData } from '../../types/ccxml';

  let { id, data, selected = false }: { id: string; data: GlobalHandlerNodeData; selected?: boolean } = $props();
</script>

<div
  class="w-72 rounded-xl bg-slate-900 border-2 transition-all shadow-xl overflow-hidden {data.isSimulatingActive
    ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_35px_rgba(52,211,153,0.5)] scale-105 z-30'
    : selected
      ? 'border-rose-400 ring-2 ring-rose-400/30'
      : 'border-rose-900/40 hover:border-rose-700/60'}"
>
  <div class="bg-rose-950/40 border-b border-rose-900/40 p-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
        <ShieldAlert class="w-4 h-4" />
      </div>
      <div class="truncate">
        <div class="text-xs font-bold text-rose-100 truncate">{data.label || 'Global Handler'}</div>
        <div class="text-[10px] text-rose-400 font-mono">ccxml:transition (global)</div>
      </div>
    </div>
  </div>

  <div class="p-3 space-y-2 text-xs">
    <div class="flex items-center justify-between">
      <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Event Pattern</span>
      <span class="px-2 py-0.5 rounded font-mono text-[11px] bg-rose-500/10 text-rose-300 border border-rose-500/30">
        {data.event || '*'}
      </span>
    </div>

    {#if data.cond}
      <div class="text-[10px] font-mono text-amber-300/90 truncate bg-slate-950 p-1.5 rounded border border-slate-800">
        cond: {data.cond}
      </div>
    {/if}

    {#if data.actions && data.actions.length > 0}
      <div class="mt-2 space-y-1">
        <div class="text-[10px] text-slate-400 font-medium">Actions ({data.actions.length})</div>
        <div class="flex flex-wrap gap-1">
          {#each data.actions as act}
            <span class="text-[9px] px-1.5 py-0.5 bg-slate-950 text-slate-300 rounded font-mono border border-slate-800">
              &lt;{act.type}&gt;
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Bottom handle if connecting onwards -->
  <Handle
    type="source"
    position={Position.Bottom}
    class="!w-2.5 !h-2.5 !bg-rose-400 !border-2 !border-slate-900"
  />
</div>
