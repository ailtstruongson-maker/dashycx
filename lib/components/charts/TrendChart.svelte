
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { processedData } from '../../stores/dashboardStore';
  import { Chart, registerables } from 'chart.js';
  import { Icon } from '../common/Icon';

  Chart.register(...registerables);

  let canvas: HTMLCanvasElement;
  let chart: Chart;
  
  let viewMode: 'shift' | 'daily' = 'shift';
  let metricType: 'revenue' | 'revenueQD' = 'revenueQD';

  $: trendData = $processedData?.trendData;

  // Tự động vẽ lại khi dữ liệu hoặc cài đặt thay đổi
  $: if (trendData && canvas) {
    updateChart();
  }

  function updateChart() {
    if (chart) chart.destroy();

    const isShift = viewMode === 'shift';
    let labels: string[] = [];
    let data: number[] = [];

    if (isShift) {
      labels = Object.keys(trendData.shifts);
      data = Object.values(trendData.shifts).map(v => v[metricType]);
    } else {
      const sortedDaily = Object.entries(trendData.daily)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
      labels = sortedDaily.map(d => {
        const date = new Date(d[0]);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });
      data = sortedDaily.map(d => d[1][metricType]);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainColor = metricType === 'revenue' ? '#4f46e5' : '#059669'; // Indigo vs Emerald
    const bgColor = metricType === 'revenue' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(5, 150, 105, 0.1)';

    chart = new Chart(ctx, {
      type: isShift ? 'bar' : 'line',
      data: {
        labels,
        datasets: [{
          label: metricType === 'revenue' ? 'Doanh thu Thực' : 'Doanh thu Quy đổi',
          data,
          borderColor: mainColor,
          backgroundColor: isShift ? mainColor : bgColor,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            padding: 12,
            backgroundColor: '#1e293b',
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => {
                return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString('vi-VN')} đ`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (val) => (Number(val) / 1000000).toFixed(0) + ' Tr'
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  onMount(() => {
    updateChart();
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });
</script>

<div class="chart-card p-6 flex flex-col h-[400px]">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div>
      <h2 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
        <Icon name="trending-up" size={5} className="text-indigo-600" />
        Xu hướng doanh thu
      </h2>
      <p class="text-xs text-slate-500 font-bold">Phân tích biến động theo {viewMode === 'shift' ? '6 ca làm việc' : 'các ngày trong kỳ'}</p>
    </div>

    <div class="flex items-center gap-2">
      <!-- Toggle Ca/Ngày -->
      <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <button 
          on:click={() => viewMode = 'shift'}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all {viewMode === 'shift' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}"
        >
          Ca
        </button>
        <button 
          on:click={() => viewMode = 'daily'}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all {viewMode === 'daily' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}"
        >
          Ngày
        </button>
      </div>

      <!-- Toggle Thực/QD -->
      <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <button 
          on:click={() => metricType = 'revenue'}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all {metricType === 'revenue' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}"
        >
          Thực
        </button>
        <button 
          on:click={() => metricType = 'revenueQD'}
          class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all {metricType === 'revenueQD' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}"
        >
          QD
        </button>
      </div>
    </div>
  </div>

  <div class="flex-grow relative min-h-0">
    <canvas bind:this={canvas}></canvas>
  </div>
</div>
