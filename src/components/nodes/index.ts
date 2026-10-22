import StateNode from './StateNode.svelte';
import GlobalHandlerNode from './GlobalHandlerNode.svelte';

export const nodeTypes = {
  'ccxml-state': StateNode,
  'ccxml-global-handler': GlobalHandlerNode
};

export {
  StateNode,
  GlobalHandlerNode
};
