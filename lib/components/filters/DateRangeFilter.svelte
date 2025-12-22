
<script lang="ts">
  import { filterState } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';

  const presets = [
    { label: 'H.Nay', value: 'today' },
    { label: 'H.Qua', value: 'yesterday' },
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Tất cả', value: 'all' }
  ];

  function handlePreset(preset: string) {
    const now = new Date();
    let start = '';
    let end = new Date().toISOString().split('T')[0];

    if (preset === 'today') {
      start = end;
    } else if (preset === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      start = d.toISOString().split('T')[0];
      end = start;
    } else if (preset === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + 1); // Monday
      start = d.toISOString().split('T')[0];
    } else if (preset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      start = ''; end = '';
    }

    filterState.update(s => ({ ...s, dateRange: preset, startDate: start, endDate: end }));
  }

  function handleManualDate(type: 'start' | 'end', val: string) {
    filterState.update(s => ({
      ...s,
      dateRange: 'custom',
      [type === 'start' ? 'startDate' : 'endDate']: val
    }));
  }
</script>

<div class="flex flex-col gap-2 flex-grow">
  <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
    <i data-lucide="calendar-days" class="w-3 h-3"></i>
    Khoảng thời gian
  </label>
  
  <div class="flex flex-col lg:flex-row gap-3">
    <!-- Presets -->
    <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {#each presets as p}
        <button
          on:click={() => handlePreset(p.value)}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all
            { $filterState.dateRange === p.value ? 'bg-fuchsia-600 text-white shadow-md' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700' }"
        >
          {p.label}
        </button>
      {/each}
    </div>

    <!-- Manual Inputs -->
    <div class="flex items-center gap-2">
      <input 
        type="date" 
        value={$filterState.startDate}
        on:input={(e) => handleManualDate('start', e.currentTarget.value)}
        class="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500 outline-none"
      />
      <span class="text-slate-400 text-xs font-bold">đến</span>
      <input 
        type="date" 
        value={$filterState.endDate}
        on:input={(e) => handleManualDate('end', e.currentTarget.value)}
        class="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-fuchsia-500 outline-none"
      />
    </div>
  </div>
</div>
