<script lang="ts">
  import { X, Copy, Download, Check, FileCode } from '@lucide/svelte';

  let {
    isOpen = false,
    ccxmlCode = '',
    onClose
  }: {
    isOpen: boolean;
    ccxmlCode: string;
    onClose: () => void;
  } = $props();

  let isCopied = $state(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(ccxmlCode);
    isCopied = true;
    setTimeout(() => {
      isCopied = false;
    }, 2000);
  }

  function downloadFile() {
    const blob = new Blob([ccxmlCode], { type: 'application/ccxml+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'callcontrol.ccxml';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileCode class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-100">W3C CCXML 1.0 Document</h2>
            <div class="text-[11px] text-slate-400 font-mono">application/ccxml+xml</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick={copyToClipboard}
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            {#if isCopied}
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span class="text-emerald-400">Copied!</span>
            {:else}
              <Copy class="w-3.5 h-3.5" />
              <span>Copy XML</span>
            {/if}
          </button>

          <button
            onclick={downloadFile}
            class="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Export .ccxml</span>
          </button>

          <button
            onclick={onClose}
            class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-2"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Code Area -->
      <div class="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
        <pre class="m-0"><code>{ccxmlCode}</code></pre>
      </div>
    </div>
  </div>
{/if}
