
<script lang="ts">
  import { originalData, industryDrilldownPath, filterState } from '../../stores/dashboardStore';
  import { formatCurrency, formatNumber } from '../../utils/formatters';
  import { Icon } from '../common/Icon';
  import { fly, fade } from 'svelte/transition';
  import { applyAllFilters } from '../../services/filterService';

  // Lấy dữ liệu theo cấp độ Drill-down
  $: filteredData = applyAllFilters($originalData, $filterState);
  
  $: displayData = (() => {
    const path = $industryDrilldownPath;
    const counts: Record<string, { revenue: number, quantity: number }> = {};

    filteredData.forEach(row => {
      const industry = row['Ngành hàng'] || 'Khác';
      const group = row['Nhóm hàng'] || 'Khác';

      if (path.length === 0) {
        // Cấp 1: Ngành hàng
        if (!counts[industry]) counts[industry] = { revenue: 0, quantity: 0 };
        counts[industry].revenue += row.computedRevenue || 0;
        counts[industry].quantity += parseFloat(row['Số lượng']) || 1;
      } else if (path[0] === industry) {
        // Cấp 2: Nhóm hàng con trong ngành hàng đã chọn
        if (!counts[group]) counts[group] = { revenue: 0, quantity: 0 };
        counts[group].revenue += row.computedRevenue || 0;
        counts[group].quantity += parseFloat(row['Số lượng']) || 1;
      }
    });

    return Object.entries(counts)
      .map(([name, vals]) => ({ name, ...vals }))
      .sort((a, b) => b.revenue - a.revenue);
  })();

  $: totalRevenue = displayData.reduce((sum, item) => sum + item.revenue, 0);

  const icons: Record<string, string> = {
    'Điện thoại': 'smartphone', 'Laptop': 'laptop', 'Phụ kiện': 'headphones',
    'Gia dụng': 'sofa', 'Đồng hồ': 'watch', 'Bảo hiểm': 'shield-check',
    'Sim': 'smartphone-nfc', 'Tivi': 'tv', 'Tablet': 'tablet'
  };

  function getIcon(name: string) {
    for (const key in icons) if (name.includes(key)) return icons[key];
    return 'package';
  }

  function handleDrillDown(name: string) {
    if ($industryDrilldownPath.length === 0) {
      industryDrilldownPath.set([name]);
    }
  }

  function goBack() {
    industryDrilldownPath.set([]);
  }
</script>

<div class="chart-card p-6 h-full flex flex-col min-h-[450px]">
  <div class="flex justify-between items-start mb-6">
    <div>
      <h2 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
        {#if $industryDrilldownPath.length > 0}
          <button on:click={goBack} class="p-1 hover:bg-slate-100 rounded-lg text-indigo-600 transition-colors">
            <Icon name="arrow-left" size={5} />
          </button>
        {:else}
          <Icon name="layout-grid" size={5} className="text-indigo-600" />
        {/if}
        {$industryDrilldownPath.length > 0 ? `Chi tiết: ${$industryDrilldownPath[0]}` : 'Tỷ trọng ngành hàng'}
      </h2>
      <p class="text-xs text-slate-500 font-bold">
        {$industryDrilldownPath.length > 0 ? 'Phân bổ theo nhóm hàng con' : 'Nhấn vào thẻ để xem chi tiết nhóm con'}
      </p>
    </div>
    
    <div class="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-[10px] font-black text-indigo-600">
      TỔNG: {formatCurrency(totalRevenue)}
    </div>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar pr-1">
    {#each displayData as item, i (item.name)}
      <button 
        in:fly={{ y: 20, delay: i * 30 }}
        on:click={() => handleDrillDown(item.name)}
        class="p-4 rounded-2xl border text-left transition-all hover:shadow-xl hover:-translate-y-1 group bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Icon name={getIcon(item.name)} size={5} />
          </div>
          <span class="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600">
            {((item.revenue / totalRevenue) * 100).toFixed(1)}%
          </span>
        </div>
        
        <h4 class="text-xs font-black uppercase tracking-tight truncate mb-1 text-slate-700 dark:text-slate-200">
          {item.name}
        </h4>
        <p class="text-lg font-black leading-none text-slate-900 dark:text-white">{formatCurrency(item.revenue)}</p>
        <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
          SL: {formatNumber(item.quantity)} đơn
        </p>
      </button>
    {/each}
  </div>
</div>
