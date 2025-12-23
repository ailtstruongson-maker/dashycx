
<script lang="ts">
  import { processedData } from '../../stores/dashboardStore';
  import { formatCurrency, formatNumber } from '../../utils/formatters';

  $: employees = $processedData?.employeeData.fullSellerArray || [];
</script>

<div class="overflow-x-auto custom-scrollbar">
  <table class="w-full text-left border-separate border-spacing-y-2">
    <thead>
      <tr class="text-slate-400 text-[10px] font-black uppercase tracking-widest">
        <th class="px-4 py-2">Nhân viên</th>
        <th class="px-4 py-2 text-center">Tiếp cận</th>
        <th class="px-4 py-2 text-center">Đơn hàng</th>
        <th class="px-4 py-2 text-right">DT Thực</th>
        <th class="px-4 py-2 text-right">DT Quy đổi</th>
        <th class="px-4 py-2 text-center">Hiệu quả</th>
      </tr>
    </thead>
    <tbody>
      {#each employees as emp}
        <tr class="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm">
          <td class="px-4 py-3 rounded-l-xl">
            <div class="flex flex-col">
              <span class="font-black text-slate-800 dark:text-slate-200 text-sm">
                {emp.name.split(' - ')[1] || emp.name}
              </span>
              <span class="text-[10px] font-bold text-slate-400 uppercase">{emp.department}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">{formatNumber(emp.slTiepCan)}</td>
          <td class="px-4 py-3 text-center font-bold text-slate-600 dark:text-slate-400">{formatNumber(emp.totalOrders)}</td>
          <td class="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">{formatCurrency(emp.doanhThuThuc)}</td>
          <td class="px-4 py-3 text-right font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(emp.doanhThuQD)}</td>
          <td class="px-4 py-3 text-center rounded-r-xl">
            <span class="px-2 py-1 rounded-lg text-xs font-black
              {emp.hieuQuaValue >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}">
              {emp.hieuQuaValue.toFixed(1)}%
            </span>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
