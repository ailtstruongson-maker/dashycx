
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { 
    processedData, 
    isProcessing, 
    appState, 
    filterState,
    getWorker 
  } from '../../stores/dashboardStore';
  
  import Header from '../layout/Header.svelte';
  import KpiCards from '../kpis/KpiCards.svelte';
  import FilterBar from '../layout/FilterBar.svelte';
  import TrendChart from '../charts/TrendChart.svelte';
  import IndustryGrid from '../charts/IndustryGrid.svelte';
  import EmployeeAnalysis from '../employees/EmployeeAnalysis.svelte';
  import SummaryTable from '../tables/SummaryTable.svelte';
  import Skeleton from '../common/Skeleton.svelte';

  onMount(() => {
    getWorker(); // Khởi tạo worker ngay khi mount
  });

  $: isLoading = $isProcessing;
</script>

<div class="relative min-h-screen">
  <Header />
  <FilterBar />

  <!-- Container chứa Dashboard -->
  <div class="space-y-8 relative">
    
    <!-- Overlay mờ khi đang tính toán dữ liệu lớn -->
    {#if isLoading && $processedData}
      <div 
        transition:fade={{ duration: 200 }}
        class="absolute inset-0 z-50 bg-slate-50/10 dark:bg-slate-900/10 backdrop-blur-[2px] cursor-wait"
      ></div>
    {/if}

    {#if !$processedData}
      <!-- Skeleton trạng thái load lần đầu -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        {#each Array(4) as _} <Skeleton className="h-32 rounded-2xl" /> {/each}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[400px] rounded-3xl" />
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    {:else}
      <!-- Dữ liệu đã sẵn sàng -->
      <div class={isLoading ? 'opacity-60 grayscale-[0.2] transition-all duration-300' : 'transition-all duration-300'}>
        <KpiCards />
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">
          <TrendChart />
          <IndustryGrid />
        </div>

        <EmployeeAnalysis />
        
        <div class="mt-8">
          <SummaryTable />
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.cursor-wait) {
    cursor: wait !important;
  }
</style>
