
<script lang="ts">
  import { processedData } from '../../stores/dashboardStore';
  import { formatCurrency, formatNumber } from '../../utils/formatters';
  import { abbreviateName } from '../../utils/dataUtils';

  $: employees = $processedData?.employeeData.fullSellerArray || [];
  
  // Lấy danh sách các ngày để làm header
  $: dates = (() => {
    const allDates = new Set<string>();
    employees.forEach(e => {
      Object.keys(e.last7Days).forEach(d => allDates.add(d));
    });
    return Array.from(allDates).sort();
  })();
</script>

<div class="overflow-x-auto custom-scrollbar">
  <table class="w-full text-left border-separate border-spacing-y-2">
    <thead>
      <tr class="text-slate-400 text-[10px] font-black uppercase tracking-widest">
        <th class="px-4 py-2">Nhân viên</th>
        {#each dates as date}
          <th class="px-2 py-2 text-center">{date}</th>
        {/each}
        <th class="px-4 py-2 text-right bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">Tổng 7N</th>
      </tr>
    </thead>
    <tbody>
      {#each employees as emp}
        <tr class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm">
          <td class="px-4 py-3 rounded-l-xl sticky left-0 bg-white dark:bg-slate-800 z-10 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
            <span class="font-black text-slate-800 dark:text-slate-200 text-sm whitespace-nowrap">
              {emp.name.split(' - ')[1] || emp.name}
            </span>
          </td>
          
          {#each dates as date}
            <td class="px-2 py-3 text-center">
              {#if emp.last7Days[date]}
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(emp.last7Days[date])}
                </span>
              {:else}
                <span class="text-slate-200 dark:text-slate-700 text-xs">-</span>
              {/if}
            </td>
          {/each}

          <td class="px-4 py-3 text-right rounded-r-xl bg-indigo-50/30 dark:bg-indigo-900/10">
            <span class="font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(Object.values(emp.last7Days).reduce((a, b) => a + b, 0))}
            </span>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
