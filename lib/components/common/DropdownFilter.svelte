
<script lang="ts">
  import { Icon } from './Icon';
  import { fade, slide } from 'svelte/transition';

  export let label: string;
  export let options: string[] = [];
  export let selected: string[] = [];
  export let placeholder = "Tìm kiếm...";

  let isOpen = false;
  let searchTerm = "";

  $: filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleOption(opt: string) {
    if (selected.includes(opt)) {
      selected = selected.filter(i => i !== opt);
    } else {
      selected = [...selected, opt];
    }
  }

  function toggleAll() {
    if (selected.length === options.length) {
      selected = [];
    } else {
      selected = [...options];
    }
  }
</script>

<div class="relative w-full sm:w-64">
  <button 
    on:click={() => isOpen = !isOpen}
    class="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm hover:border-indigo-400 transition-all"
  >
    <span class="truncate font-bold text-slate-700 dark:text-slate-200">
      {selected.length === 0 ? `Lọc ${label}` : `${label} (${selected.length})`}
    </span>
    <Icon name="chevron-down" size={4} className="text-slate-400" />
  </button>

  {#if isOpen}
    <div 
      class="fixed inset-0 z-[60]" 
      on:click={() => isOpen = false}
    ></div>
    
    <div 
      in:fade={{ duration: 100 }}
      class="absolute top-full left-0 mt-2 w-full min-w-[260px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[70] overflow-hidden"
    >
      <div class="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
        <input 
          type="text" 
          bind:value={searchTerm}
          {placeholder}
          class="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div class="max-h-60 overflow-y-auto p-2">
        <label class="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
          <input 
            type="checkbox" 
            checked={selected.length === options.length}
            on:change={toggleAll}
            class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span class="text-sm font-black text-indigo-600">Chọn tất cả</span>
        </label>

        {#each filteredOptions as opt}
          <label class="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={selected.includes(opt)}
              on:change={() => toggleOption(opt)}
              class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm text-slate-700 dark:text-slate-300 truncate">{opt}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}
</div>
