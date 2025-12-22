
<script lang="ts">
  import { filterState, uniqueFilters } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';

  function setKho(val: string) {
    filterState.update(s => ({ ...s, kho: val }));
  }
</script>

{#if $uniqueFilters.kho.length > 1}
<div class="flex flex-col gap-2">
  <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
    <i data-lucide="building-2" class="w-3 h-3"></i>
    Kho tạo
  </label>
  <div class="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
    <button
      on:click={() => setKho('all')}
      class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all
        { $filterState.kho === 'all' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700' }"
    >
      Tất cả
    </button>
    {#each $uniqueFilters.kho as kho}
      <button
        on:click={() => setKho(kho)}
        class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all
          { $filterState.kho === kho ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700' }"
      >
        {kho}
      </button>
    {/each}
  </div>
</div>
{/if}
