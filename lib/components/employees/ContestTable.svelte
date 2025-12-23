
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { originalData, filterState, isProcessing } from '../../stores/dashboardStore';
  import { applyAllFilters } from '../../services/filterService';
  import { formatCurrency, formatNumber } from '../../utils/formatters';
  import { getConversionFactor } from '../../utils/calculationUtils';
  import { exportElementAsImage } from '../../services/uiService';
  import { Icon } from '../common/Icon';
  import Skeleton from '../common/Skeleton.svelte';
  import { GoogleGenAI } from "@google/genai";
  import { slide, fade } from 'svelte/transition';
  import type { ContestTableConfig } from '../../types';

  export let config: ContestTableConfig;
  export let isComparisonMode = false;
  export let comparisonPeriod: 'previous_period' | 'last_month' | '7_days_ago' = 'previous_period';
  
  const dispatch = createEventDispatcher();
  let tableContainer: HTMLElement;
  let isExporting = false;
  let isAiAnalyzing = false;
  let aiInsight = "";

  $: filteredData = applyAllFilters($originalData, $filterState);
  
  $: comparisonData = (() => {
    if (!isComparisonMode) return [];
    const compFilters = { ...$filterState };
    const currentStart = new Date(compFilters.startDate || new Date());
    const currentEnd = new Date(compFilters.endDate || new Date());
    const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime());
    let compStart: Date, compEnd: Date;

    if (comparisonPeriod === 'previous_period') {
      compStart = new Date(currentStart.getTime() - diffTime - 86400000);
      compEnd = new Date(currentStart.getTime() - 86400000);
    } else if (comparisonPeriod === '7_days_ago') {
      compStart = new Date(currentStart.getTime() - (7 * 86400000));
      compEnd = new Date(currentEnd.getTime() - (7 * 86400000));
    } else {
      compStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, currentStart.getDate());
      compEnd = new Date(currentEnd.getFullYear(), currentEnd.getMonth() - 1, currentEnd.getDate());
    }
    compFilters.startDate = compStart.toISOString().split('T')[0];
    compFilters.endDate = compEnd.toISOString().split('T')[0];
    return applyAllFilters($originalData, compFilters);
  })();

  $: tableRows = (() => {
    const allEmployees = new Set([...filteredData.map(r => r.normalizedNguoiTao), ...comparisonData.map(r => r.normalizedNguoiTao)]);
    const empMap: Record<string, { current: Record<string, number>, prev: Record<string, number> }> = {};
    
    allEmployees.forEach(empName => {
      empMap[empName] = { current: {}, prev: {} };
      config.columns.forEach(col => {
        empMap[empName].current[col.id] = 0;
        empMap[empName].prev[col.id] = 0;
      });
    });

    const processData = (data: any[], target: 'current' | 'prev') => {
      data.forEach(row => {
        const empName = row.normalizedNguoiTao;
        const industry = (row['Ngành hàng'] || '').toString();
        const group = (row['Nhóm hàng'] || '').toString();
        const price = parseFloat(row['Giá bán_1']) || 0;
        const qty = parseFloat(row['Số lượng']) || 1;

        config.columns.forEach(col => {
          if (col.type === 'data') {
            const matchIndustry = !col.filters?.industries?.length || col.filters.industries.includes(industry);
            const matchGroup = !col.filters?.subgroups?.length || col.filters.subgroups.includes(group);
            const matchPrice = (!col.filters?.priceMin || price >= col.filters.priceMin) && 
                               (!col.filters?.priceMax || price <= col.filters.priceMax);

            if (matchIndustry && matchGroup && matchPrice) {
              if (col.metric === 'quantity') empMap[empName][target][col.id] += qty;
              else if (col.metric === 'revenue') empMap[empName][target][col.id] += price;
              else if (col.metric === 'revenueQD') empMap[empName][target][col.id] += price * getConversionFactor(row);
            }
          }
        });
      });
    };

    processData(filteredData, 'current');
    if (isComparisonMode) processData(comparisonData, 'prev');

    Object.keys(empMap).forEach(empName => {
      ['current', 'prev'].forEach((target: any) => {
        config.columns.forEach(col => {
          if (col.type === 'calculated' && col.operand1 && col.operand2) {
            const val1 = empMap[empName][target][col.operand1] || 0;
            const val2 = empMap[empName][target][col.operand2] || 0;
            if (col.operator === '/') empMap[empName][target][col.id] = val2 > 0 ? (val1 / val2) * 100 : 0;
            else if (col.operator === '+') empMap[empName][target][col.id] = val1 + val2;
            else if (col.operator === '-') empMap[empName][target][col.id] = val1 - val2;
            else if (col.operator === '*') empMap[empName][target][col.id] = val1 * val2;
          }
        });
      });
    });

    return Object.entries(empMap).map(([name, data]) => ({ name, metrics: data.current, prevMetrics: data.prev }))
      .sort((a, b) => {
        const sortCol = config.defaultSortColumnId || (config.columns[0]?.id);
        return (b.metrics[sortCol] || 0) - (a.metrics[sortCol] || 0);
      });
  })();

  async function askAI() {
    if (isAiAnalyzing) return;
    isAiAnalyzing = true;
    aiInsight = "";
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summaryData = tableRows.slice(0, 10).map(r => ({
        nv: r.name,
        so_lieu: r.metrics,
        tang_truong: isComparisonMode ? Object.keys(r.metrics).reduce((acc, key) => {
          acc[key] = r.metrics[key] - r.prevMetrics[key];
          return acc;
        }, {} as any) : "N/A"
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Phân tích bảng thi đua "${config.tableName}".
        Dữ liệu: ${JSON.stringify(summaryData)}.
        Hãy viết 3 câu nhận xét ngắn bằng tiếng Việt: 1 câu khen ngợi người dẫn đầu, 1 câu chỉ ra ai đang giảm sút phong độ mạnh nhất (nếu có delta), 1 câu lời khuyên hành động.
        Sử dụng ngôn ngữ chuyên nghiệp, khích lệ.`
      });
      aiInsight = response.text;
    } catch (e) {
      aiInsight = "AI đang bận, vui lòng thử lại sau.";
    } finally {
      isAiAnalyzing = false;
    }
  }

  async function handleExport() {
    isExporting = true;
    await exportElementAsImage(tableContainer, config.tableName);
    isExporting = false;
  }
</script>

<div class="space-y-3">
  <!-- Table Controls -->
  <div class="flex justify-between items-center px-1">
    <div class="flex items-center gap-2">
      <div class="w-2 h-6 bg-indigo-600 rounded-full"></div>
      <h4 class="font-black text-slate-700 dark:text-slate-200 uppercase text-sm">{config.tableName}</h4>
    </div>
    
    <div class="flex items-center gap-1">
      <button 
        on:click={askAI}
        disabled={isAiAnalyzing}
        class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
        title="AI Nhận xét bảng này"
      >
        {#if isAiAnalyzing}
          <Icon name="loader-2" size={4} className="animate-spin" />
        {:else}
          <Icon name="sparkles" size={4} />
        {/if}
      </button>
      <button 
        on:click={handleExport}
        disabled={isExporting}
        class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
        title="Xuất ảnh bảng này"
      >
        {#if isExporting}
          <Icon name="loader-2" size={4} className="animate-spin" />
        {:else}
          <Icon name="camera" size={4} />
        {/if}
      </button>
      <button 
        on:click={() => dispatch('deleteTable')}
        class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        title="Xóa bảng đấu"
      >
        <Icon name="trash-2" size={4} />
      </button>
    </div>
  </div>

  <!-- AI Insight Box -->
  {#if aiInsight}
    <div transition:slide class="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg relative overflow-hidden mb-4">
      <div class="absolute right-0 top-0 opacity-10 rotate-12">
        <Icon name="bot" size={16} />
      </div>
      <p class="text-xs font-bold leading-relaxed relative z-10 italic">"{aiInsight}"</p>
      <button on:click={() => aiInsight = ""} class="absolute top-2 right-2 text-white/50 hover:text-white"><Icon name="x" size={3} /></button>
    </div>
  {/if}

  <!-- Main Table -->
  <div 
    bind:this={tableContainer}
    class="overflow-x-auto custom-scrollbar bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
  >
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 dark:bg-slate-900/50">
          <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-400 w-12 text-center border-b border-slate-100 dark:border-slate-700">#</th>
          <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700">Nhân viên</th>
          {#each config.columns as col}
            <th class="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right border-b border-slate-100 dark:border-slate-700 group/th relative">
              <div class="flex flex-col">
                <span>{col.label}</span>
                <div class="absolute -top-1 right-0 hidden group-hover/th:flex items-center gap-1 bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 rounded-lg p-0.5 z-20">
                  <button on:click={() => dispatch('editColumn', col)} class="p-1 text-blue-500 hover:bg-blue-50 rounded-md"><Icon name="edit-3" size={3} /></button>
                  <button on:click={() => dispatch('deleteColumn', col.id)} class="p-1 text-red-500 hover:bg-red-50 rounded-md"><Icon name="x" size={3} /></button>
                </div>
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if $isProcessing}
          {#each Array(5) as _}
            <tr>
              <td class="px-4 py-3"><Skeleton className="h-4 w-4 mx-auto" /></td>
              <td class="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
              {#each config.columns as _}
                <td class="px-4 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
              {/each}
            </tr>
          {/each}
        {:else}
          {#each tableRows as row, i}
            <tr class="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
              <td class="px-4 py-3 text-xs font-bold text-slate-400 text-center border-b border-slate-50 dark:border-slate-800">{i + 1}</td>
              <td class="px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                <span class="text-sm font-black text-slate-700 dark:text-slate-200">{row.name.split(' - ')[1] || row.name}</span>
              </td>
              {#each config.columns as col}
                <td class="px-4 py-3 text-right border-b border-slate-50 dark:border-slate-800 font-bold">
                  <div class="flex flex-col items-end">
                    <span class={col.type === 'calculated' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}>
                      {#if col.displayAs === 'percentage'}
                        {row.metrics[col.id].toFixed(1)}%
                      {:else if col.metric === 'quantity'}
                        {formatNumber(row.metrics[col.id])}
                      {:else}
                        {formatCurrency(row.metrics[col.id])}
                      {/if}
                    </span>
                    
                    {#if isComparisonMode}
                      {@const delta = row.metrics[col.id] - row.prevMetrics[col.id]}
                      {#if delta !== 0}
                        <span 
                          class="text-[9px] font-black flex items-center gap-0.5 
                          {delta > 0 ? 'text-emerald-500' : 'text-rose-500'}"
                        >
                          <Icon name={delta > 0 ? 'arrow-up' : 'arrow-down'} size={2} />
                          {#if col.displayAs === 'percentage'}
                            {Math.abs(delta).toFixed(1)}%
                          {:else if col.metric === 'quantity'}
                            {formatNumber(Math.abs(delta))}
                          {:else}
                            {formatCurrency(Math.abs(delta))}
                          {/if}
                        </span>
                      {/if}
                    {/if}
                  </div>
                </td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
