
<script lang="ts">
  import { filterState } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';

  const options = [
    { value: 'all', label: 'Tất cả', icon: 'layers' },
    { value: 'Đã', label: 'Đã xuất', icon: 'check-circle-2' },
    { value: 'Chưa', label: 'Chờ xuất', icon: 'clock' }
  ];

  function setFilter(value: string) {
    filterState.update(s => ({ ...s, xuat: value }));
  }
</script>

<div class="flex flex-col gap-2">
  <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
    <i data-lucide="truck" class="w-3 h-3"></i>
    Trạng thái xuất hàng
  </label>

  <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-fit">
    {#each options as opt}
      <button
        on:click={() => setFilter(opt.value)}
        class="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200
          { $filterState.xuat === opt.value 
            ? 'bg-teal-600 text-white shadow-lg shadow-teal-200 dark:shadow-none' 
            : 'text-slate-500 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-700' 
          }"
      >
        <Icon name={opt.icon} size={4} />
        <span>{opt.label}</span>
      </button>
    {/each}
  </div>
</div>
