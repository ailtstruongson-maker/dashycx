
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    appState, 
    originalData, 
    filterState, 
    processedData, 
    currentView 
  } from './lib/stores/dashboardStore';
  import { applyAllFilters } from './lib/services/filterService';
  import { processDashboardData } from './lib/services/dataProcessor';
  
  import LandingPageView from './lib/components/views/LandingPageView.svelte';
  import Sidebar from './lib/components/layout/Sidebar.svelte';
  import Header from './lib/components/layout/Header.svelte';
  import KpiCards from './lib/components/kpis/KpiCards.svelte';
  import FilterBar from './lib/components/layout/FilterBar.svelte';
  import TrendChart from './lib/components/charts/TrendChart.svelte';
  import EmployeeRanking from './lib/components/employees/EmployeeRanking.svelte';
  import SummaryTable from './lib/components/tables/SummaryTable.svelte';
  
  // Modules & Tools
  import EmployeeEfficiencyView from './lib/components/views/employee-efficiency/EmployeeEfficiencyView.svelte';
  import TaxCalculatorView from './lib/components/views/tax/TaxCalculatorView.svelte';
  import CouponConverterView from './lib/components/views/CouponConverterView.svelte';
  import DailyChecklistReportView from './lib/components/views/DailyChecklistReportView.svelte';

  /**
   * LUỒNG PHẢN ỨNG CHÍNH
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

  <!-- Sidebar bọc toàn bộ ứng dụng để luôn có menu điều hướng -->
  <Sidebar>
    <div class="max-w-7xl mx-auto p-4 md:p-8 w-full min-h-screen flex flex-col relative z-10">
      
      {#if $currentView === 'dashboard'}
        {#if $appState === 'upload'}
          <LandingPageView />
        {:else}
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
      
      {:else if $currentView === 'tax'}
        <TaxCalculatorView />

      {:else if $currentView === 'coupon'}
        <CouponConverterView />

      {:else if $currentView === 'checklist'}
        <DailyChecklistReportView />

      {:else if $currentView === 'efficiency'}
        <EmployeeEfficiencyView />

      {:else}
        <div class="flex-grow flex flex-col items-center justify-center p-20 text-center">
          <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
            <i data-lucide="construction" class="w-12 h-12 text-slate-400"></i>
          </div>
          <h2 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Tính năng sắp ra mắt</h2>
          <p class="text-slate-500 mt-2">Module <span class="font-bold text-indigo-600">{$currentView}</span> đang được tối ưu hóa.</p>
          <button 
            on:click={() => currentView.set('dashboard')}
            class="mt-8 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
          >
            Quay lại Dashboard
          </button>
        </div>
      {/if}

      <footer class="p-8 mt-auto text-center border-t border-slate-100 dark:border-slate-800">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Intelligence Hub 2.0 • Data Driven Success
        </p>
      </footer>
    </div>
  </Sidebar>

  <!-- Global invisible inputs -->
  <input type="file" id="main-file-input" class="hidden" accept=".xlsx,.xls" />
  <input type="file" id="shift-file-input" class="hidden" accept=".xlsx,.xls" multiple />
</div>
