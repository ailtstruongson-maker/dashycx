
<script lang="ts">
  import { originalData, filterState } from '../../stores/dashboardStore';
  import { buildSummaryTree } from '../../services/summaryService';
  import { applyAllFilters } from '../../services/filterService';
  import SummaryTableRow from './SummaryTableRow.svelte';
  import { formatCurrency, formatNumber } from '../../utils/formatters';
  import { Icon } from '../common/Icon';
  import { fade } from 'svelte/transition';

  $: filteredData = applyAllFilters($originalData, $filterState);
  $: tree = buildSummaryTree(filteredData);
  $: sortedIndustries = Object.values(tree).sort((a, b) => b.revenueQD - a.revenueQD);

  $: grandTotal = sortedIndustries.reduce((acc, node) => {
    acc.qty += node.quantity;
    acc.rev += node.revenue;
    acc.revQD += node.revenueQD;
    return acc;
  }, { qty: 0, rev: 0, revQD: 0 });

  $: totalHq = grandTotal.rev > 0 ? ((grandTotal.revQD - grandTotal.rev) / grandTotal.rev) * 100 : 0;
</script>

<div class="chart-card overflow-hidden flex flex-col border-none shadow-2xl" in:fade>
  <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
    <div>
      <h2 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
        <Icon name="table" size={5} className="text-emerald-500" />
        Chi tiết ngành hàng
      </h2>
      <p class="text-xs text-slate-500 font-bold">Nhấn vào Ngành hàng để xem Nhóm hàng con</p>
    </div>
    
    <div class="flex items-center gap-4">
       <div class="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-[10px] font-black text-emerald-600">
        HQQĐ: {totalHq.toFixed(1)}%
      </div>
    </div>
  </div>

  <div class="overflow-x-auto custom-scrollbar">
    <table class="w-full text-left border-collapse">
      <thead class="sticky top-0 bg-slate-50 dark:bg-slate-900 z-20 shadow-sm">
        <tr class="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
          <th class="px-6 py-4 min-w-[250px]">Danh mục hàng hóa</th>
          <th class="px-4 py-4 text-center">S.Lượng</th>
          <th class="px-4 py-4 text-right">Doanh thu Thực</th>
          <th class="px-4 py-4 text-right">Doanh thu QĐ</th>
          <th class="px-6 py-4 text-center">Hiệu quả</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedIndustries as node (node.name)}
          <SummaryTableRow {node} />
        {/each}
      </tbody>
      <tfoot class="sticky bottom-0 bg-indigo-600 text-white font-black z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <tr>
          <td class="px-6 py-5 text-sm uppercase">Tổng cộng toàn siêu thị</td>
          <td class="px-4 py-5 text-center text-sm">{formatNumber(grandTotal.qty)}</td>
          <td class="px-4 py-5 text-right text-sm">{formatCurrency(grandTotal.rev)}</td>
          <td class="px-4 py-5 text-right text-sm">{formatCurrency(grandTotal.revQD)}</td>
          <td class="px-6 py-5 text-center">
            <span class="bg-white/20 px-3 py-1.5 rounded-lg text-xs">
              {totalHq.toFixed(1)}%
            </span>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>
