
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    appState, originalData, filterState, processedData, 
    currentView, isProcessing, customTabs, kpiTargets, 
    departmentMap, fileInfo, visibleComponents 
  } from './lib/stores/dashboardStore';
  import { getSetting, getSalesData } from './lib/services/dbService';
  
  import Sidebar from './lib/components/layout/Sidebar.svelte';
  import LandingPageView from './lib/components/views/LandingPageView.svelte';
  import DashboardView from './lib/components/views/DashboardView.svelte';
  import ProcessingLoader from './lib/components/common/ProcessingLoader.svelte';
  import AiAssistant from './lib/components/ai/AiAssistant.svelte';
  import Toast from './lib/components/common/Toast.svelte';
  import TaxCalculatorView from './lib/components/views/tax/TaxCalculatorView.svelte';
  import CouponConverterView from './lib/components/views/CouponConverterView.svelte';
  import DailyChecklistReportView from './lib/components/views/DailyChecklistReportView.svelte';
  import EmployeeEfficiencyView from './lib/components/views/employee-efficiency/EmployeeEfficiencyView.svelte';

  onMount(async () => {
    const [savedFilters, savedTabs, savedTargets, savedVisibility, savedTheme] = await Promise.all([
      getSetting<any>('dashboard_filters'),
      getSetting<any>('custom_tabs'),
      getSetting<any>('kpi_targets'),
      getSetting<any>('dashboard_visibility'),
      getSetting<string>('theme')
    ]);

    if (savedFilters) filterState.set(savedFilters);
    if (savedTabs) customTabs.set(savedTabs);
    if (savedTargets) kpiTargets.set(savedTargets);
    if (savedVisibility) visibleComponents.set(savedVisibility);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    const savedSales = await getSalesData();
    if (savedSales && savedSales.data.length > 0) {
      originalData.set(savedSales.data.map(r => ({
        ...r,
        parsedDate: r.parsedDate ? new Date(r.parsedDate) : undefined
      })));
      fileInfo.set({ 
        filename: savedSales.filename, 
        savedAt: savedSales.savedAt.toLocaleString('vi-VN') 
      });
      appState.set('dashboard');
    }

    if ((window as any).lucide) (window as any).lucide.createIcons();
  });
</script>

<div class="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden font-sans">
  <Sidebar>
    <div class="h-screen overflow-y-auto w-full custom-scrollbar">
      <div class="max-w-7xl mx-auto p-4 md:p-8 w-full min-h-full flex flex-col relative z-10">
        
        {#if $appState === 'loading'}
           <ProcessingLoader />
        {/if}

        {#if $currentView === 'dashboard'}
          {#if $appState === 'upload'}
            <LandingPageView />
          {:else}
            <DashboardView />
          {/if}
        {:else if $currentView === 'tax'}
          <TaxCalculatorView />
        {:else if $currentView === 'coupon'}
          <CouponConverterView />
        {:else if $currentView === 'checklist'}
          <DailyChecklistReportView />
        {:else if $currentView === 'efficiency'}
          <EmployeeEfficiencyView />
        {/if}

        <footer class="p-10 mt-auto text-center border-t border-slate-100 dark:border-slate-800/50">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Intelligence Hub 2.0 • Optimized High Speed</p>
        </footer>
      </div>
    </div>
  </Sidebar>

  <AiAssistant />
  <Toast />

  <input type="file" id="main-file-input" class="hidden" accept=".xlsx,.xls" />
  <input type="file" id="shift-file-input" class="hidden" accept=".xlsx,.xls" multiple />
</div>
