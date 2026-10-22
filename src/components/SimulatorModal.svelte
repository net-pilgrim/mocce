<script lang="ts">
  import {
    X,
    Phone,
    PhoneCall,
    PhoneOff,
    PhoneForwarded,
    Users,
    Bot,
    Play,
    Square,
    Terminal,
    Volume2,
    RefreshCw,
    Send,
    Radio,
    Activity,
    Layers,
    ShieldAlert
  } from '@lucide/svelte';
  import type { SimulatorState } from '../types/simulator';
  import { playDtmfTone } from '../lib/simulator/ccxml-engine';

  let {
    isOpen = false,
    simulatorState,
    onStartSession,
    onStopSession,
    onTriggerInboundCall,
    onDispatchEvent,
    onFinishDialog,
    onClose
  }: {
    isOpen: boolean;
    simulatorState: SimulatorState;
    onStartSession: () => void;
    onStopSession: () => void;
    onTriggerInboundCall: (callerId?: string) => void;
    onDispatchEvent: (eventName: string, data?: any) => void;
    onFinishDialog: (values?: any) => void;
    onClose: () => void;
  } = $props();

  let customCallerId = $state('+14155552671');
  let customEventName = $state('connection.disconnected');
  let dialogActionValue = $state('agent');

  const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  function handleKeypad(digit: string) {
    playDtmfTone(digit);
    onDispatchEvent('connection.signal', { dtmf: digit });
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio class="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-sm font-bold text-slate-100">CCXML Telephony PBX Simulator</h2>
              {#if simulatorState.isActive}
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40 animate-pulse flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  RUNNING: {simulatorState.currentState}
                </span>
              {:else}
                <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px]">
                  IDLE
                </span>
              {/if}
            </div>
            <div class="text-[11px] text-slate-400 font-mono">Event Handler Interpretation Algorithm (EHIA)</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          {#if !simulatorState.isActive}
            <button
              onclick={onStartSession}
              class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              <Play class="w-3.5 h-3.5 fill-current" />
              <span>Start Session</span>
            </button>
          {:else}
            <button
              onclick={onStopSession}
              class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
            >
              <Square class="w-3.5 h-3.5 fill-current" />
              <span>Stop Session</span>
            </button>
          {/if}

          <button
            onclick={onClose}
            class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-2"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        <!-- Left: Telephony Legs & Controls (7 Cols) -->
        <div class="col-span-7 p-4 border-r border-slate-800 overflow-y-auto space-y-4 text-xs">
          <!-- Inbound Call Controller -->
          <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <PhoneCall class="w-4 h-4 text-cyan-400" />
                <span class="font-bold text-slate-200">Inbound Call Leg (Caller)</span>
              </div>
              <button
                onclick={() => onTriggerInboundCall(customCallerId)}
                class="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1"
              >
                <Phone class="w-3 h-3" /> Simulate Incoming Ring
              </button>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-[11px] text-slate-400">Caller ID:</span>
              <input
                type="text"
                bind:value={customCallerId}
                class="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-cyan-300 text-xs w-48"
              />
            </div>

            <!-- Active Inbound Connections List -->
            {#each Object.values(simulatorState.connections).filter((c) => c.direction === 'inbound') as conn}
              <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div class="font-mono text-cyan-300 font-bold">{conn.id}</div>
                  <div class="text-[10px] text-slate-400">{conn.remote} &rarr; {conn.local}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono {conn.state === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'}">
                    {conn.state}
                  </span>
                  <button
                    onclick={() => onDispatchEvent('connection.disconnected', { connectionid: conn.id })}
                    class="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                    title="Disconnect Caller"
                  >
                    <PhoneOff class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <!-- Outbound Call Leg (Agent / Bridge) -->
          <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div class="flex items-center gap-2">
              <PhoneForwarded class="w-4 h-4 text-indigo-400" />
              <span class="font-bold text-slate-200">Outbound Call Legs (&lt;createcall&gt;)</span>
            </div>

            {#if Object.values(simulatorState.connections).filter((c) => c.direction === 'outbound').length === 0}
              <div class="text-[11px] text-slate-500 italic p-2 border border-dashed border-slate-800 rounded-lg text-center">
                No outbound legs active. (Spawned when &lt;createcall&gt; executes)
              </div>
            {:else}
              {#each Object.values(simulatorState.connections).filter((c) => c.direction === 'outbound') as conn}
                <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div class="font-mono text-indigo-300 font-bold">{conn.id}</div>
                    <div class="text-[10px] text-slate-400">Destination: {conn.remote}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono {conn.state === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}">
                      {conn.state}
                    </span>
                    <button
                      onclick={() => onDispatchEvent('connection.disconnected', { connectionid: conn.id })}
                      class="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                      title="Disconnect Agent"
                    >
                      <PhoneOff class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>

          <!-- VoiceXML Dialog Runner Mock -->
          <div class="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Bot class="w-4 h-4 text-violet-400" />
                <span class="font-bold text-slate-200">VoiceXML Dialog Session (&lt;dialogstart&gt;)</span>
              </div>
              {#if simulatorState.activeDialog}
                <span class="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-mono border border-violet-500/40 animate-pulse">
                  ACTIVE
                </span>
              {/if}
            </div>

            {#if !simulatorState.activeDialog}
              <div class="text-[11px] text-slate-500 italic p-2 border border-dashed border-slate-800 rounded-lg text-center">
                No active VoiceXML dialog. (Triggered when &lt;dialogstart&gt; executes)
              </div>
            {:else}
              <div class="p-3 bg-slate-900 rounded-lg border border-slate-700/60 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-violet-300 font-bold">{simulatorState.activeDialog.src}</span>
                  <span class="font-mono text-[10px] text-slate-400">{simulatorState.activeDialog.id}</span>
                </div>

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] text-slate-400">Exit action:</span>
                    <input
                      type="text"
                      bind:value={dialogActionValue}
                      placeholder="e.g. agent"
                      class="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 font-mono text-[11px] w-24 text-amber-300"
                    />
                  </div>
                  <button
                    onclick={() => onFinishDialog({ action: dialogActionValue, dest: 'tel:+18005550199' })}
                    class="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs"
                  >
                    Finish Dialog (Emit dialog.exit)
                  </button>
                </div>
              </div>
            {/if}
          </div>

          <!-- DTMF Keypad & Event Injector -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Keypad -->
            <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DTMF Touch-Tone Pad</span>
              <div class="grid grid-cols-3 gap-1.5 max-w-[160px]">
                {#each keypadKeys as k}
                  <button
                    onclick={() => handleKeypad(k)}
                    class="h-8 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono text-xs font-bold border border-slate-700 transition-colors active:scale-95"
                  >
                    {k}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Custom Event Dispatcher -->
            <div class="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dispatch Custom Event</span>
              <div class="space-y-1.5">
                <input
                  type="text"
                  bind:value={customEventName}
                  placeholder="event name (e.g. error.connection)"
                  class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-xs text-rose-300"
                />
                <button
                  onclick={() => onDispatchEvent(customEventName)}
                  class="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700"
                >
                  <Send class="w-3 h-3" /> Emit Event to EHIA
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Variables & Execution Trace Log (5 Cols) -->
        <div class="col-span-5 bg-slate-950/40 flex flex-col overflow-hidden text-xs">
          <!-- Variables Watcher -->
          <div class="p-3 border-b border-slate-800 bg-slate-950/60 max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Session Variables Watcher</div>
            {#each Object.entries(simulatorState.variables) as [k, v]}
              {#if k !== 'session$'}
                <div class="flex items-start justify-between py-0.5 border-b border-slate-900">
                  <span class="text-cyan-400">{k}</span>
                  <span class="text-amber-300 truncate max-w-[200px]">{JSON.stringify(v)}</span>
                </div>
              {/if}
            {/each}
          </div>

          <!-- Execution Logs -->
          <div class="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div class="flex items-center gap-1.5 font-bold text-slate-300">
              <Terminal class="w-3.5 h-3.5 text-cyan-400" />
              <span>CCXML Execution Trace</span>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">{simulatorState.logs.length} logs</span>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono text-[11px]">
            {#if simulatorState.logs.length === 0}
              <div class="text-slate-600 italic text-center p-4">Trace logs will appear here during execution...</div>
            {:else}
              {#each simulatorState.logs as log (log.id)}
                <div class="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 space-y-0.5">
                  <div class="flex items-center justify-between text-[9px]">
                    <span class="font-bold uppercase {log.type === 'event' ? 'text-cyan-400' : log.type === 'action' ? 'text-emerald-400' : log.type === 'state' ? 'text-violet-400' : 'text-slate-400'}">
                      [{log.type}]
                    </span>
                    <span class="text-slate-500">{log.timestamp}</span>
                  </div>
                  <div class="text-slate-300 leading-relaxed">{log.message}</div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
