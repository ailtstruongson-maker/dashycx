
<script lang="ts">
  import { slide } from 'svelte/transition';
  import { formatCurrency, formatNumber } from '../../utils/formatters';
  import { Icon } from '../common/Icon';

  export let node: any;
  export let level = 0;
  
  let isExpanded = false;
  $: hasChildren = Object.keys(node.children).length > 0;
  $: hqPercent = node.revenue > 0 ? ((node.revenueQD - node.revenue) / node.revenue) * 100 : 0;
</script>

<tr 
  class="group transition-colors {level === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-900/30'} hover:bg-indigo-50 dark:hover:bg-slate-700"
  on:click={() => hasChildren && (isExpanded = !isExpanded)}
>
  <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
    <div class="flex items-center gap-2" style="padding-left: {level * 24}px">
      {#if hasChildren}
        <span class="transition-transform duration-300 {isExpanded ? 'rotate-90' : ''} text-slate-400">
          <Icon name="chevron-right" size={4} />
        </span>
      {:else}
        <span class="w-4"></span>
      {/if}
      <span class="{level === 0 ? 'font-black text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 font-medium'} text-sm truncate max-w-[200px]">
        {node.name}
      </span>
    </div>
  </td>
  
  <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-center text-sm font-bold text-slate-600 dark:text-slate-400">
    {formatNumber(node.quantity)}
  </td>
  
  <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
    {formatCurrency(node.revenue)}
  </td>
  
  <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-right text-sm font-black text-indigo-600 dark:text-indigo-400">
    {formatCurrency(node.revenueQD)}
  </td>
  
  <td class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 text-center">
    <span class="px-2 py-1 rounded-lg text-[10px] font-black
      {hqPercent >= 40 ? 'bg-emerald-100 text-emerald-700' : 
       hqPercent >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
      {hqPercent.toFixed(0)}%
    </span>
  </td>
</tr>

{#if isExpanded && hasChildren}
  {#each Object.values(node.children) as child}
    <svelte:self node={child} level={level + 1} />
  {/each}
{/if}
