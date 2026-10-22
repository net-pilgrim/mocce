<script lang="ts">
  import type { Node } from '@xyflow/svelte';
  import {
    X,
    Trash2,
    Copy,
    Plus,
    Workflow,
    ShieldAlert,
    PhoneCall,
    Bot,
    ChevronDown,
    ChevronUp,
    Settings,
    Layers,
    Activity,
    Sliders,
    Zap
  } from '@lucide/svelte';
  import type { CcxmlAction, CcxmlTransition } from '../types/ccxml';

  let {
    selectedNode = null,
    onUpdateNode,
    onDeleteNode,
    onDuplicateNode,
    onClose
  }: {
    selectedNode: Node | null;
    onUpdateNode: (nodeId: string, updatedData: any) => void;
    onDeleteNode: (nodeId: string) => void;
    onDuplicateNode: (node: Node) => void;
    onClose: () => void;
  } = $props();

  let data = $state<any>({});

  $effect(() => {
    if (selectedNode) {
      data = JSON.parse(JSON.stringify(selectedNode.data));
    }
  });

  function triggerUpdate() {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, $state.snapshot(data));
    }
  }

  const STANDARD_EVENTS = [
    'connection.alerting',
    'connection.connected',
    'connection.disconnected',
    'connection.failed',
    'connection.progressing',
    'dialog.started',
    'dialog.exit',
    'dialog.disconnect',
    'conference.created',
    'conference.joined',
    'conference.unjoined',
    'conference.destroyed',
    'error.*',
    'error.connection',
    'error.dialog',
    'ccxml.loaded'
  ];

  const ACTION_TYPES = [
    { type: 'accept', label: 'Accept Call', desc: 'Accept incoming alerting connection' },
    { type: 'reject', label: 'Reject Call', desc: 'Reject incoming alerting connection' },
    { type: 'redirect', label: 'Redirect Call', desc: 'Redirect call to new destination' },
    { type: 'createcall', label: 'Create Call', desc: 'Place an outbound call leg' },
    { type: 'disconnect', label: 'Disconnect', desc: 'Hang up an active connection' },
    { type: 'join', label: 'Bridge / Join', desc: 'Bridge audio streams of two legs or conference' },
    { type: 'unjoin', label: 'Unjoin', desc: 'Tear down audio bridge between legs' },
    { type: 'dialogstart', label: 'Start Dialog', desc: 'Spawn VoiceXML dialog' },
    { type: 'dialogterminate', label: 'Terminate Dialog', desc: 'Stop running VoiceXML dialog' },
    { type: 'createconference', label: 'Create Conference', desc: 'Create audio conference bridge' },
    { type: 'destroyconference', label: 'Destroy Conference', desc: 'Tear down conference bridge' },
    { type: 'assign', label: 'Assign Variable', desc: 'Assign ECMAScript variable' },
    { type: 'log', label: 'Log', desc: 'Write output message to CCXML trace' },
    { type: 'exit', label: 'Exit Session', desc: 'Terminate CCXML session' }
  ];

  function addTransition() {
    if (!data.transitions) data.transitions = [];
    const newId = 't_' + Math.random().toString(36).substring(2, 7);
    data.transitions.push({
      id: newId,
      event: 'connection.connected',
      actions: []
    });
    triggerUpdate();
  }

  function removeTransition(idx: number) {
    data.transitions.splice(idx, 1);
    triggerUpdate();
  }

  function addActionToTransition(tIdx: number, type: string) {
    const actId = 'a_' + Math.random().toString(36).substring(2, 7);
    const newAct: CcxmlAction = {
      id: actId,
      type: type as any
    };

    if (type === 'createcall') {
      newAct.dest = "'sip:agent@pbx.com'";
      newAct.connectionid = 'out_callid';
    } else if (type === 'dialogstart') {
      newAct.src = "'dialog.vxml'";
      newAct.connectionid = 'in_callid';
    } else if (type === 'join') {
      newAct.id1 = 'in_callid';
      newAct.id2 = 'out_callid';
      newAct.duplex = 'full';
    } else if (type === 'assign') {
      newAct.name = 'state';
      newAct.expr = "''";
    }

    if (!data.transitions[tIdx].actions) data.transitions[tIdx].actions = [];
    data.transitions[tIdx].actions.push(newAct);
    triggerUpdate();
  }

  function removeActionFromTransition(tIdx: number, aIdx: number) {
    data.transitions[tIdx].actions.splice(aIdx, 1);
    triggerUpdate();
  }

  function addGlobalAction(type: string) {
    if (!data.actions) data.actions = [];
    data.actions.push({
      id: 'ga_' + Math.random().toString(36).substring(2, 7),
      type: type as any
    });
    triggerUpdate();
  }

  function removeGlobalAction(aIdx: number) {
    data.actions.splice(aIdx, 1);
    triggerUpdate();
  }
</script>

<div class="h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-200 w-96 shadow-2xl">
  <!-- Header -->
  <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
    <div class="flex items-center gap-2">
      {#if selectedNode?.type === 'ccxml-state'}
        <div class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
          <Workflow class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-xs font-bold text-slate-100 uppercase tracking-wide">CCXML State</h2>
          <div class="text-[10px] text-cyan-400 font-mono">{data.stateName || selectedNode.id}</div>
        </div>
      {:else}
        <div class="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
          <ShieldAlert class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-xs font-bold text-slate-100 uppercase tracking-wide">Global Catch Handler</h2>
          <div class="text-[10px] text-rose-400 font-mono">{data.event || '*'}</div>
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-1">
      {#if selectedNode}
        <button
          onclick={() => onDuplicateNode(selectedNode)}
          class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
          title="Duplicate Node"
        >
          <Copy class="w-4 h-4" />
        </button>
        <button
          onclick={() => onDeleteNode(selectedNode.id)}
          class="p-1.5 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded transition-colors"
          title="Delete Node"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      {/if}
      <button
        onclick={onClose}
        class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors ml-1"
        title="Close Inspector"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
    {#if selectedNode?.type === 'ccxml-state'}
      <!-- State Name & Initial config -->
      <div class="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div>
          <label for="state-name-input" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State Identifier (NMTOKEN)</label>
          <input
            id="state-name-input"
            type="text"
            bind:value={data.stateName}
            oninput={triggerUpdate}
            placeholder="e.g. init, in_dialog, consulting"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <label class="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            bind:checked={data.isInitial}
            onchange={triggerUpdate}
            class="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
          />
          <span class="text-xs text-slate-300 font-medium">Initial Entry State (Application Root)</span>
        </label>
      </div>

      <!-- Transitions List -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap class="w-3.5 h-3.5 text-cyan-400" />
            <span>Event Transitions ({data.transitions?.length || 0})</span>
          </div>
          <button
            onclick={addTransition}
            class="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-bold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
          >
            <Plus class="w-3 h-3" /> Add Transition
          </button>
        </div>

        {#if !data.transitions || data.transitions.length === 0}
          <div class="p-3 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-[11px] italic">
            No transitions in this state. Add an event transition to handle telephony signals.
          </div>
        {:else}
          {#each data.transitions as t, tIdx (t.id)}
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5 relative">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-cyan-400 font-mono">Transition #{tIdx + 1}</span>
                <button
                  onclick={() => removeTransition(tIdx)}
                  class="text-slate-500 hover:text-rose-400 p-1 rounded"
                  title="Remove transition"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Event Selector -->
              <div>
                <label for="event-select-{t.id}" class="text-[10px] text-slate-400 block mb-1">Incoming Event Pattern</label>
                <div class="flex gap-1.5">
                  <select
                    id="event-select-{t.id}"
                    bind:value={t.event}
                    onchange={triggerUpdate}
                    class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-200 text-xs flex-1 focus:outline-none focus:border-cyan-500"
                  >
                    {#each STANDARD_EVENTS as ev}
                      <option value={ev}>{ev}</option>
                    {/each}
                  </select>
                </div>
              </div>

              <!-- Condition -->
              <div>
                <label for="cond-input-{t.id}" class="text-[10px] text-slate-400 block mb-1">Condition Expr (cond)</label>
                <input
                  id="cond-input-{t.id}"
                  type="text"
                  bind:value={t.cond}
                  oninput={triggerUpdate}
                  placeholder="e.g. event$.values.action === 'agent'"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-amber-300 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <!-- Actions in this transition -->
              <div class="pt-2 border-t border-slate-900 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Block ({t.actions?.length || 0})</span>
                  <div class="relative group">
                    <button class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1">
                      <Plus class="w-3 h-3" /> Add Action
                    </button>
                    <!-- Action Dropdown Menu -->
                    <div class="absolute right-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 hidden group-hover:block z-40 max-h-60 overflow-y-auto">
                      {#each ACTION_TYPES as act}
                        <button
                          onclick={() => addActionToTransition(tIdx, act.type)}
                          class="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded text-[11px] text-slate-200 flex flex-col"
                        >
                          <span class="font-mono text-cyan-300">&lt;{act.type}&gt;</span>
                          <span class="text-[9px] text-slate-400">{act.desc}</span>
                        </button>
                      {/each}
                    </div>
                  </div>
                </div>

                {#if t.actions && t.actions.length > 0}
                  <div class="space-y-1.5">
                    {#each t.actions as act, aIdx (act.id || aIdx)}
                      <div class="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1.5">
                        <div class="flex items-center justify-between">
                          <span class="font-mono font-bold text-cyan-300 text-[11px]">&lt;{act.type}&gt;</span>
                          <button
                            onclick={() => removeActionFromTransition(tIdx, aIdx)}
                            class="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 class="w-3 h-3" />
                          </button>
                        </div>

                        <!-- Action Parameter Fields -->
                        {#if act.type === 'accept' || act.type === 'reject' || act.type === 'disconnect'}
                          <div>
                            <label for="conn-id-{act.id}" class="text-[9px] text-slate-500 block">connectionid</label>
                            <input
                              id="conn-id-{act.id}"
                              type="text"
                              bind:value={act.connectionid}
                              oninput={triggerUpdate}
                              placeholder="in_callid or event$.connectionid"
                              class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                            />
                          </div>
                        {:else if act.type === 'createcall'}
                          <div>
                            <label for="dest-id-{act.id}" class="text-[9px] text-slate-500 block">dest URI</label>
                            <input
                              id="dest-id-{act.id}"
                              type="text"
                              bind:value={act.dest}
                              oninput={triggerUpdate}
                              placeholder="'tel:+18005550199'"
                              class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                            />
                          </div>
                          <div>
                            <label for="outconn-id-{act.id}" class="text-[9px] text-slate-500 block">connectionid store</label>
                            <input
                              id="outconn-id-{act.id}"
                              type="text"
                              bind:value={act.connectionid}
                              oninput={triggerUpdate}
                              placeholder="out_callid"
                              class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                            />
                          </div>
                        {:else if act.type === 'dialogstart'}
                          <div>
                            <label for="dialog-src-{act.id}" class="text-[9px] text-slate-500 block">src (VoiceXML URL)</label>
                            <input
                              id="dialog-src-{act.id}"
                              type="text"
                              bind:value={act.src}
                              oninput={triggerUpdate}
                              placeholder="'main_menu.vxml'"
                              class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                            />
                          </div>
                        {:else if act.type === 'join'}
                          <div class="grid grid-cols-2 gap-1.5">
                            <div>
                              <label for="join-id1-{act.id}" class="text-[9px] text-slate-500 block">id1</label>
                              <input
                                id="join-id1-{act.id}"
                                type="text"
                                bind:value={act.id1}
                                oninput={triggerUpdate}
                                placeholder="in_callid"
                                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                              />
                            </div>
                            <div>
                              <label for="join-id2-{act.id}" class="text-[9px] text-slate-500 block">id2</label>
                              <input
                                id="join-id2-{act.id}"
                                type="text"
                                bind:value={act.id2}
                                oninput={triggerUpdate}
                                placeholder="out_callid"
                                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                              />
                            </div>
                          </div>
                        {:else if act.type === 'assign'}
                          <div class="grid grid-cols-2 gap-1.5">
                            <div>
                              <label for="assign-name-{act.id}" class="text-[9px] text-slate-500 block">name</label>
                              <input
                                id="assign-name-{act.id}"
                                type="text"
                                bind:value={act.name}
                                oninput={triggerUpdate}
                                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                              />
                            </div>
                            <div>
                              <label for="assign-expr-{act.id}" class="text-[9px] text-slate-500 block">expr</label>
                              <input
                                id="assign-expr-{act.id}"
                                type="text"
                                bind:value={act.expr}
                                oninput={triggerUpdate}
                                class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                              />
                            </div>
                          </div>
                        {:else if act.type === 'log'}
                          <div>
                            <label for="log-expr-{act.id}" class="text-[9px] text-slate-500 block">expr</label>
                            <input
                              id="log-expr-{act.id}"
                              type="text"
                              bind:value={act.expr}
                              oninput={triggerUpdate}
                              placeholder="'Call established successfully'"
                              class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px]"
                            />
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>

    {:else if selectedNode?.type === 'ccxml-global-handler'}
      <!-- Global Catch Node -->
      <div class="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div>
          <label for="global-event-input" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Global Event (e.g. error.*)</label>
          <input
            id="global-event-input"
            type="text"
            bind:value={data.event}
            oninput={triggerUpdate}
            placeholder="error.* or connection.disconnected"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-rose-300 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label for="global-cond-input" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Condition (cond)</label>
          <input
            id="global-cond-input"
            type="text"
            bind:value={data.cond}
            oninput={triggerUpdate}
            placeholder="e.g. event$.reason === 'timeout'"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-amber-300 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      <!-- Action Block -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catch Actions ({data.actions?.length || 0})</span>
          <div class="relative group">
            <button class="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-slate-900 font-bold rounded-lg text-[10px] flex items-center gap-1">
              <Plus class="w-3 h-3" /> Add Action
            </button>
            <div class="absolute right-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 hidden group-hover:block z-40 max-h-60 overflow-y-auto">
              {#each ACTION_TYPES as act}
                <button
                  onclick={() => addGlobalAction(act.type)}
                  class="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded text-[11px] text-slate-200 flex flex-col"
                >
                  <span class="font-mono text-rose-300">&lt;{act.type}&gt;</span>
                  <span class="text-[9px] text-slate-400">{act.desc}</span>
                </button>
              {/each}
            </div>
          </div>
        </div>

        {#if data.actions && data.actions.length > 0}
          <div class="space-y-1.5">
            {#each data.actions as act, aIdx (act.id || aIdx)}
              <div class="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-rose-300 text-[11px]">&lt;{act.type}&gt;</span>
                  <button
                    onclick={() => removeGlobalAction(aIdx)}
                    class="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

                {#if act.type === 'log'}
                  <div>
                    <label for="global-log-{act.id}" class="text-[9px] text-slate-500 block">expr</label>
                    <input
                      id="global-log-{act.id}"
                      type="text"
                      bind:value={act.expr}
                      oninput={triggerUpdate}
                      class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-[11px]"
                    />
                  </div>
                {:else if act.type === 'disconnect'}
                  <div>
                    <label for="global-conn-{act.id}" class="text-[9px] text-slate-500 block">connectionid</label>
                    <input
                      id="global-conn-{act.id}"
                      type="text"
                      bind:value={act.connectionid}
                      oninput={triggerUpdate}
                      placeholder="in_callid"
                      class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-[11px]"
                    />
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
