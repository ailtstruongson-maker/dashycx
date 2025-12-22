
<script lang="ts">
  import { onMount } from 'svelte';
  import { Icon } from '../../common/Icon';
  import { fade, slide } from 'svelte/transition';

  // State giả lập cho view này vì đây là module độc lập cũ được port sang
  let activeTab = 'doanhthu';
  
  onMount(() => {
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  });
</script>

<div class="animate-fade-in" in:fade>
  <div class="flex items-center justify-between mb-8">
    <div>
      <h2 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Thi đua & Hiệu suất</h2>
      <p class="text-slate-500 font-bold text-sm">Phân tích chuyên sâu khả năng khai thác nhân sự</p>
    </div>
    
    <div class="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
      <button 
        on:click={() => activeTab = 'doanhthu'}
        class="px-6 py-2 text-sm font-bold rounded-xl transition-all {activeTab === 'doanhthu' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}"
      >
        Doanh thu
      </button>
      <button 
        on:click={() => activeTab = 'thidua'}
        class="px-6 py-2 text-sm font-bold rounded-xl transition-all {activeTab === 'thidua' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}"
      >
        Bảng thi đua
      </button>
    </div>
  </div>

  <div class="chart-card p-12 text-center">
    <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon name="info" size={8} />
    </div>
    <h3 class="text-lg font-bold text-slate-800 dark:text-white">Dữ liệu module cũ đang được đồng bộ</h3>
    <p class="text-slate-500 max-w-md mx-auto mt-2 italic text-sm">Vui lòng quay lại Dashboard để xem các báo cáo tổng hợp. Module thi đua chuyên sâu sẽ hoàn tất trong 24h tới.</p>
  </div>
</div>
