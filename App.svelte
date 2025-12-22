
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    appState, 
    originalData, 
    filterState, 
    processedData, 
    isProcessing 
  } from './lib/stores/dashboardStore';
  import { applyAllFilters } from './lib/services/filterService';
  import { processDashboardData } from './lib/services/dataProcessor';
  
  import LandingPageView from './lib/components/views/LandingPageView.svelte';
  import Header from './lib/components/layout/Header.svelte';
  import KpiCards from './lib/components/kpis/KpiCards.svelte';
  import FilterBar from './lib/components/layout/FilterBar.svelte';
  import TrendChart from './lib/components/charts/TrendChart.svelte';
  import EmployeeRanking from './lib/components/employees/EmployeeRanking.svelte';
  import SummaryTable from './lib/components/tables/SummaryTable.svelte';

  /**
   * LUỒNG PHẢN ỨNG CHÍNH (Reactivity Loop)
   */
  $: {
    if ($originalData.length > 0) {
      const filtered = applyAllFilters($originalData, $filterState);
      const result = processDashboardData(filtered);
      processedData.set(result);
    }
  }

  onMount(() => {
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  });
</script>

<div class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
  <div class="bg-grid-pattern fixed inset-0 opacity-10 pointer-events-none"></div>

  <div class="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 w-full flex-grow relative z-10">
    
    {#if $appState === 'upload'}
      <LandingPageView />
    {:else if $appState === 'dashboard'}
      <Header />
      <KpiCards />
      <FilterBar />
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TrendChart />
        <EmployeeRanking />
      </div>

      <div class="w-full mb-8">
        <SummaryTable />
      </div>
    {/if}

  </div>
  
  <footer class="p-8 text-center">
    <p class="text-xs font-black text-slate-400 uppercase tracking-widest">
      Intelligence Hub 2.0 • High Performance Data Engine
    </p>
  </footer>
</div>
