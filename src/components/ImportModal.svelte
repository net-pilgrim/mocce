<script lang="ts">
  import { X, Upload, FileUp, AlertTriangle } from '@lucide/svelte';
  import { parseCcxml, type ParseResult } from '../lib/ccxml/parser';

  let {
    isOpen = false,
    onImport,
    onClose
  }: {
    isOpen: boolean;
    onImport: (result: ParseResult) => void;
    onClose: () => void;
  } = $props();

  let xmlInput = $state('');
  let parseError = $state<string | null>(null);

  function handleImport() {
    if (!xmlInput.trim()) {
      parseError = 'Please paste CCXML 1.0 markup to import.';
      return;
    }

    const result = parseCcxml(xmlInput);
    if (result.error) {
      parseError = result.error;
      return;
    }

    if (result.nodes.length === 0) {
      parseError = 'No valid CCXML states or event transitions found in markup.';
      return;
    }

    onImport(result);
    onClose();
  }

  function handleFileUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      xmlInput = (event.target?.result as string) || '';
      parseError = null;
    };
    reader.readAsText(file);
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Upload class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-100">Import CCXML Document</h2>
            <div class="text-[11px] text-slate-400">Reverse-engineers states, transitions & telephony actions</div>
          </div>
        </div>

        <button
          onclick={onClose}
          class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4">
        {#if parseError}
          <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 shrink-0 text-rose-400" />
            <span>{parseError}</span>
          </div>
        {/if}

        <div>
          <label for="ccxml-paste-area" class="text-xs font-bold text-slate-300 block mb-2">Paste CCXML 1.0 XML Markup</label>
          <textarea
            id="ccxml-paste-area"
            bind:value={xmlInput}
            placeholder="<?xml version=&quot;1.0&quot;?>
<ccxml version=&quot;1.0&quot; xmlns=&quot;http://www.w3.org/2002/09/ccxml&quot;>
  <eventprocessor statevariable=&quot;state&quot;>
    <transition state=&quot;init&quot; event=&quot;connection.alerting&quot;>
      <accept/>
    </transition>
  </eventprocessor>
</ccxml>"
            rows="12"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          ></textarea>
        </div>

        <div class="flex items-center justify-between pt-2">
          <label class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer border border-slate-700 flex items-center gap-1.5">
            <FileUp class="w-4 h-4" />
            <span>Upload .ccxml file</span>
            <input type="file" accept=".ccxml,.xml" onchange={handleFileUpload} class="hidden" />
          </label>

          <div class="flex items-center gap-2">
            <button
              onclick={onClose}
              class="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onclick={handleImport}
              class="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-950/50"
            >
              Parse & Load into Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
