
<script lang="ts">
  import KpiCard from './KpiCard.svelte';
  import { processedData, kpiTargets } from '../../stores/dashboardStore';
  import { formatCurrency, formatNumber } from '../../utils/formatters';

  $: kpis = $processedData?.kpis;

  function updateGoal(key: 'hieuQua' | 'traGop') {
    const newVal = prompt(`Nhập mục tiêu ${key === 'hieuQua' ? 'Hiệu quả' : 'Trả góp'} mới (%):`, $kpiTargets[key].toString());
    if (newVal && !isNaN(parseFloat(newVal))) {
      kpiTargets.update(t => ({ ...t, [key]: parseFloat(newVal) }));
    }
  }
</script>

{#if kpis}
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  
  <KpiCard 
    title="Doanh Thu Quy Đổi"
    value={formatCurrency(kpis.doanhThuQD)}
    icon="wallet-cards"
    color="blue"
    trend={`Thực: <b>${formatCurrency(kpis.totalRevenue)}</b> • Thu hộ: <b>${formatNumber(kpis.soLuongThuHo)}</b>`}
  />

  <div on:click={() => updateGoal('hieuQua')} class="cursor-pointer">
    <KpiCard 
      title="Hiệu Quả Quy Đổi"
      value={(kpis.hieuQuaQD * 100).toFixed(1) + '%'}
      icon="trending-up"
      color={kpis.hieuQuaQD * 100 >= $kpiTargets.hieuQua ? 'teal' : 'amber'}
      isWarning={kpis.hieuQuaQD * 100 < $kpiTargets.hieuQua}
      trend={`Mục tiêu: <b>${$kpiTargets.hieuQua}%</b> (Nhấn để đổi)`}
    />
  </div>

  <div on:click={() => updateGoal('traGop')} class="cursor-pointer">
    <KpiCard 
      title="Tỷ Lệ Trả Góp"
      value={kpis.traGopPercent.toFixed(1) + '%'}
      icon="receipt"
      color={kpis.traGopPercent >= $kpiTargets.traGop ? 'pink' : 'amber'}
      isWarning={kpis.traGopPercent < $kpiTargets.traGop}
      trend={`Mục tiêu: <b>${$kpiTargets.traGop}%</b> (Nhấn để đổi)`}
    />
  </div>

  <KpiCard 
    title="DT Chờ Xuất"
    value={formatCurrency(kpis.doanhThuQDChoXuat)}
    icon="archive-restore"
    color="red"
    trend={`Giá trị thực: <b>${formatCurrency(kpis.doanhThuThucChoXuat)}</b>`}
  />

</div>
{/if}
