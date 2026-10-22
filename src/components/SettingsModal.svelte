<script lang="ts">
  import { untrack } from 'svelte';
  import { X, Sliders, Plus, Trash2, Check } from '@lucide/svelte';
  import type { CcxmlDocSettings } from '../types/ccxml';

  let {
    isOpen = false,
    settings,
    onSave,
    onClose
  }: {
    isOpen: boolean;
    settings: CcxmlDocSettings;
    onSave: (updated: CcxmlDocSettings) => void;
    onClose: () => void;
  } = $props();

  let localSettings = $state<CcxmlDocSettings>(untrack(() => JSON.parse(JSON.stringify(settings))));

  $effect(() => {
    if (isOpen) {
      localSettings = JSON.parse(JSON.stringify(settings));
    }
  });

  function addVariable() {
    if (!localSettings.globalVars) localSettings.globalVars = [];
    localSettings.globalVars.push({ name: 'var_' + (localSettings.globalVars.length + 1) });
  }

  function removeVariable(idx: number) {
    localSettings.globalVars.splice(idx, 1);
  }

  function handleSave() {
    onSave($state.snapshot(localSettings));
    onClose();
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <Sliders class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-100">Document Settings</h2>
            <div class="text-[11px] text-slate-400">W3C CCXML 1.0 Root Configuration</div>
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
      <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
        <!-- Root Attributes -->
        <div class="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div>
            <label for="settings-state-var" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State Variable</label>
            <input
              id="settings-state-var"
              type="text"
              bind:value={localSettings.statevariable}
              placeholder="state"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label for="settings-xmlns" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">XML Namespace</label>
            <input
              id="settings-xmlns"
              type="text"
              bind:value={localSettings.xmlns}
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <!-- Global Variables -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Variables (&lt;var&gt;)</span>
            <button
              onclick={addVariable}
              class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 font-semibold"
            >
              <Plus class="w-3 h-3" /> Add Var
            </button>
          </div>

          <div class="space-y-1.5">
            {#each localSettings.globalVars as v, idx}
              <div class="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <input
                  type="text"
                  bind:value={v.name}
                  placeholder="variable name"
                  class="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-cyan-300 flex-1 text-xs"
                />
                <input
                  type="text"
                  bind:value={v.expr}
                  placeholder="expr (e.g. 'init')"
                  class="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-amber-300 flex-1 text-xs"
                />
                <button
                  onclick={() => removeVariable(idx)}
                  class="p-1 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            {/each}
          </div>
        </div>

        <!-- Global Script Block -->
        <div class="space-y-1.5">
          <label for="global-script-area" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Global ECMAScript (&lt;script&gt;)</label>
          <textarea
            id="global-script-area"
            bind:value={localSettings.globalScript}
            placeholder="// Helper functions or ECMAScript logic&#10;// e.g. function formatNum(n) &#123; return n; &#125;"
            rows="5"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          ></textarea>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/80">
        <button
          onclick={onClose}
          class="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 text-xs font-medium"
        >
          Cancel
        </button>
        <button
          onclick={handleSave}
          class="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50"
        >
          <Check class="w-3.5 h-3.5" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  </div>
{/if}
