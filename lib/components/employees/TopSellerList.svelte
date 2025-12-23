
<script lang="ts">
  import { processedData } from '../../stores/dashboardStore';
  import { formatCurrency } from '../../utils/formatters';
  import { fly } from 'svelte/transition';

  $: employees = $processedData?.employeeData.fullSellerArray || [];
  $: maxRevenue = employees.length > 0 ? employees[0].doanhThuQD : 1;

  const medals = ['🥇', '🥈', '🥉'];
</script>

<div class="space-y-3">
  {#each employees.slice(0, 15) as emp, i}
    <div 
      in:fly={{ x: -20, delay: i * 50 }}
      class="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group"
    >
      <!-- Rank -->
      <div class="w-10 h-10 flex items-center justify-center shrink-0">
        {#if i < 3}
          <span class="text-3xl">{medals[i]}</span>
        {:else}
          <span class="font-black text-slate-300 dark:text-slate-600">#{i + 1}</span>
        {/if}
      </div>

      <!-- Info -->
      <div class="flex-grow min-w-0">
        <div class="flex justify-between items-end mb-1">
          <h4 class="font-black text-slate-800 dark:text-slate-100 truncate text-sm uppercase">
            {emp.name.split(' - ')[1] || emp.name}
          </h4>
          <span class="text-xs font-black text-indigo-600 dark:text-indigo-400">
            {formatCurrency(emp.doanhThuQD)}
          </span>
        </div>
        
        <!-- Progress Bar -->
        <div class="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style="width: {(emp.doanhThuQD / maxRevenue) * 100}%"
          ></div>
        </div>

        <div class="flex gap-3 mt-1.5">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {emp.department}
          </span>
          <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">
            HQ: {emp.hieuQuaValue.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  {/each}
</div>
