<script lang="ts">
  import { X, CheckCircle2, AlertTriangle, AlertCircle, Info, ExternalLink } from '@lucide/svelte';
  import type { DiagnosticItem } from '../types/ccxml';

  let {
    isOpen = false,
    diagnostics = [],
    onSelectNode,
    onClose
  }: {
    isOpen: boolean;
    diagnostics: DiagnosticItem[];
    onSelectNode?: (nodeId: string) => void;
    onClose: () => void;
  } = $props();

  let filter = $state<'all' | 'error' | 'warning' | 'info'>('all');

  let filteredDiagnostics = $derived(
    diagnostics.filter((d) => (filter === 'all' ? true : d.severity === filter))
  );

  let errorCount = $derived(diagnostics.filter((d) => d.severity === 'error').length);
  let warningCount = $derived(diagnostics.filter((d) => d.severity === 'warning').length);
  let infoCount = $derived(diagnostics.filter((d) => d.severity === 'info').length);
</script>

{#if isOpen}
  <div class="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
      <div class="flex items-center gap-2">
        <CheckCircle2 class="w-5 h-5 text-cyan-400" />
        <div>
          <h2 class="text-xs font-bold text-slate-100 uppercase tracking-wide">CCXML 1.0 Diagnostics</h2>
          <div class="text-[10px] text-slate-400 font-mono">W3C Compliance Validator</div>
        </div>
      </div>

      <button
        onclick={onClose}
        class="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Filter Pills -->
    <div class="p-3 border-b border-slate-800 flex gap-1.5 text-xs bg-slate-950/40">
      <button
        onclick={() => (filter = 'all')}
        class="px-2.5 py-1 rounded-lg font-medium transition-colors {filter === 'all'
          ? 'bg-slate-800 text-slate-100 font-bold'
          : 'text-slate-400 hover:bg-slate-800/50'}"
      >
        All ({diagnostics.length})
      </button>
      <button
        onclick={() => (filter = 'error')}
        class="px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors {filter === 'error'
          ? 'bg-rose-500/20 text-rose-300 font-bold'
          : 'text-slate-400 hover:bg-slate-800/50'}"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        Errors ({errorCount})
      </button>
      <button
        onclick={() => (filter = 'warning')}
        class="px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors {filter === 'warning'
          ? 'bg-amber-500/20 text-amber-300 font-bold'
          : 'text-slate-400 hover:bg-slate-800/50'}"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        Warnings ({warningCount})
      </button>
    </div>

    <!-- Items List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
      {#if filteredDiagnostics.length === 0}
        <div class="p-8 text-center space-y-2">
          <div class="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <div class="font-bold text-slate-200">No issues detected</div>
          <div class="text-[11px] text-slate-500">Document matches W3C CCXML 1.0 recommendations!</div>
        </div>
      {:else}
        {#each filteredDiagnostics as diag (diag.id)}
          <div
            class="p-3 rounded-xl border transition-colors {diag.severity === 'error'
              ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
              : diag.severity === 'warning'
                ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-300'}"
          >
            <div class="flex items-start gap-2">
              {#if diag.severity === 'error'}
                <AlertCircle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              {:else if diag.severity === 'warning'}
                <AlertTriangle class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              {:else}
                <Info class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              {/if}

              <div class="space-y-1 flex-1">
                <div class="leading-relaxed font-medium">{diag.message}</div>
                <div class="flex items-center justify-between pt-1">
                  {#if diag.specReference}
                    <span class="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {diag.specReference}
                    </span>
                  {/if}
                  {#if diag.nodeId && onSelectNode}
                    <button
                      onclick={() => onSelectNode(diag.nodeId!)}
                      class="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                    >
                      Focus Node <ExternalLink class="w-3 h-3" />
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}
