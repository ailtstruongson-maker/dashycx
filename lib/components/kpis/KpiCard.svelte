
<script lang="ts">
  import { Icon } from '../common/Icon';
  import { fade } from 'svelte/transition';

  export let title: string;
  export let value: string | number;
  export let icon: string;
  export let color: 'blue' | 'teal' | 'pink' | 'red' | 'amber' = 'blue';
  export let trend: string = ''; 
  export let isWarning: boolean = false; // Trạng thái cảnh báo nếu không đạt mục tiêu

  const colorMap = {
    blue: 'from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    teal: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    pink: 'from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-pink-400 border-rose-200 dark:border-rose-800',
    red: 'from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    amber: 'from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
  };
</script>

<div 
  class="relative overflow-hidden group p-5 bg-white dark:bg-slate-800 rounded-2xl border {colorMap[color]} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300
    {isWarning ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-slate-900' : ''}"
  in:fade={{ delay: 100 }}
>
  {#if isWarning}
    <div class="absolute top-2 right-2 flex h-2 w-2">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
    </div>
  {/if}

  <div class="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br {colorMap[color]} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

  <div class="flex justify-between items-start relative z-10">
    <div>
      <p class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 class="text-3xl font-black tracking-tight {isWarning ? 'text-red-600 dark:text-red-400' : ''}">{value}</h3>
    </div>
    <div class="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600 group-hover:rotate-12 transition-transform">
      <Icon name={icon} size={6} className={isWarning ? 'text-red-500' : colorMap[color].split(' ')[2]} />
    </div>
  </div>

  {#if trend}
    <div class="mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50 relative z-10">
      <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        {@html trend}
      </p>
    </div>
  {/if}
</div>
