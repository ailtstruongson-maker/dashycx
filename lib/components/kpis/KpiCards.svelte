
<script lang="ts">
  import KpiCard from './KpiCard.svelte';
  import { processedData } from '../../stores/dashboardStore';
  import { formatCurrency, formatNumber } from '../../utils/formatters';

  $: kpis = $processedData?.kpis;

  // Logic màu sắc cho Hiệu quả
  function getHqColor(val: number) {
    if (val >= 40) return 'teal';
    if (val >= 30) return 'amber';
    return 'red';
  }
</script>

{#if kpis}
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  
  <!-- 1. Doanh Thu QD -->
  <KpiCard 
    title="Doanh Thu Quy Đổi"
    value={formatCurrency(kpis.doanhThuQD)}
    icon="wallet-cards"
    color="blue"
    trend={`Thực: <b>${formatCurrency(kpis.totalRevenue)}</b> • Thu hộ: <b>${formatNumber(kpis.soLuongThuHo)}</b>`}
  />

  <!-- 2. Hiệu Quả QD -->
  <KpiCard 
    title="Hiệu Quả Quy Đổi"
    value={(kpis.hieuQuaQD * 100).toFixed(1) + '%'}
    icon="trending-up"
    color={getHqColor(kpis.hieuQuaQD * 100)}
    trend={kpis.hieuQuaQD * 100 >= 40 ? 'Đạt mục tiêu xuất sắc ✨' : 'Cần cải thiện bán kèm 📈'}
  />

  <!-- 3. Tỷ Lệ Trả Góp -->
  <KpiCard 
    title="Tỷ Lệ Trả Góp"
    value={kpis.traGopPercent.toFixed(1) + '%'}
    icon="receipt"
    color="pink"
    trend={`DT: <b>${formatCurrency(kpis.traGopValue)}</b> • SL: <b>${formatNumber(kpis.traGopCount)}</b>`}
  />

  <!-- 4. Chờ Xuất Kho -->
  <KpiCard 
    title="DT Chờ Xuất"
    value={formatCurrency(kpis.doanhThuQDChoXuat)}
    icon="archive-restore"
    color="red"
    trend={`Giá trị thực: <b>${formatCurrency(kpis.doanhThuThucChoXuat)}</b>`}
  />

</div>
{:else}
  <!-- Skeleton Loading (Optional) -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {#each Array(4) as _}
      <div class="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
    {/each}
  </div>
{/if}
