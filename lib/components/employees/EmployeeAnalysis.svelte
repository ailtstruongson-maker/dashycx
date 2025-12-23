
<script lang="ts">
  import { onMount } from 'svelte';
  import { Icon } from '../common/Icon';
  import TopSellerList from './TopSellerList.svelte';
  import PerformanceTable from './PerformanceTable.svelte';
  import ExploitationTable from './ExploitationTable.svelte';
  import WeekComparison from './WeekComparison.svelte';
  import ContestTable from './ContestTable.svelte';
  import ColumnModal from './modals/ColumnModal.svelte';
  import { customTabs, filterState } from '../../stores/dashboardStore';
  import { getSetting, saveSetting } from '../../services/dbService';
  import { fade, slide } from 'svelte/transition';
  import type { ContestTableConfig, ColumnConfig } from '../../types';

  let activeTab: string = 'top';
  let isComparisonMode = false;
  let comparisonPeriod: 'previous_period' | 'last_month' | '7_days_ago' = 'previous_period';

  let isColumnModalOpen = false;
  let currentEditingTabId = "";
  let currentEditingTableId = "";
  let currentEditingColumn: ColumnConfig | null = null;

  // Persistence cho UI của riêng component này qua IndexedDB
  onMount(async () => {
    const savedActiveTab = await getSetting<string>('emp_analysis_active_tab');
    if (savedActiveTab) activeTab = savedActiveTab;
  });

  $: if (activeTab) {
    saveSetting('emp_analysis_active_tab', activeTab);
  }

  const defaultTabs = [
    { id: 'top', label: 'Top Sellers', icon: 'award' },
    { id: 'perf', label: 'Hiệu suất', icon: 'bar-chart-horizontal' },
    { id: 'kt', label: 'Khai thác', icon: 'zap' },
    { id: '7n', label: '7 Ngày', icon: 'calendar' }
  ];

  function addNewTab() {
    const name = prompt("Nhập tên Tab thi đua mới:");
    if (name) {
      const newTab = { id: 'tab_' + Date.now(), name, icon: 'target', tables: [] };
      customTabs.update(tabs => [...tabs, newTab]);
      activeTab = newTab.id;
    }
  }

  function deleteTab(id: string) {
    if (confirm('Bạn có chắc muốn xóa Tab này không?')) {
      customTabs.update(tabs => tabs.filter(t => t.id !== id));
      activeTab = 'top';
    }
  }

  // ... (Các hàm khác giữ nguyên logic store, store đã tự động lưu vào IndexedDB) ...
  function addTableToTab(tabId: string) {
    const tableName = prompt("Nhập tên bảng đấu mới:");
    if (!tableName) return;
    customTabs.update(tabs => tabs.map(t => {
      if (t.id === tabId) {
        return { ...t, tables: [...t.tables, { id: 'table_' + Date.now(), tableName: tableName.toUpperCase(), columns: [] }] };
      }
      return t;
    }));
  }

  function deleteTable(tabId: string, tableId: string) {
    if (confirm('Xóa bảng thi đua này?')) {
      customTabs.update(tabs => tabs.map(t => {
        if (t.id === tabId) {
          return { ...t, tables: t.tables.filter(tbl => tbl.id !== tableId) };
        }
        return t;
      }));
    }
  }

  function openAddColumn(tabId: string, tableId: string) {
    currentEditingTabId = tabId;
    currentEditingTableId = tableId;
    currentEditingColumn = null;
    isColumnModalOpen = true;
  }

  function handleSaveColumn(newCol: ColumnConfig) {
    customTabs.update(tabs => tabs.map(tab => {
      if (tab.id === currentEditingTabId) {
        return {
          ...tab,
          tables: tab.tables.map(table => {
            if (table.id === currentEditingTableId) {
              const existingIndex = table.columns.findIndex(c => c.id === newCol.id);
              if (existingIndex > -1) {
                const newCols = [...table.columns];
                newCols[existingIndex] = newCol;
                return { ...table, columns: newCols };
              }
              return { ...table, columns: [...table.columns, newCol] };
            }
            return table;
          })
        };
      }
      return tab;
    }));
  }
</script>

<div class="chart-card flex flex-col h-full min-h-[600px] overflow-hidden border-none shadow-2xl bg-white/80 dark:bg-slate-900/80">
  <!-- Tab Header -->
  <div class="px-6 pt-6 border-b border-slate-100 dark:border-slate-800">
    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-4 gap-4">
      <div>
        <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Phân tích nhân sự</h2>
        <p class="text-xs text-slate-500 font-bold">Dữ liệu được lưu trữ bảo mật trong database trình duyệt</p>
      </div>
      
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto max-w-[80vw] sm:max-w-none">
          {#each defaultTabs as tab}
            <button 
              on:click={() => activeTab = tab.id} 
              class="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl transition-all whitespace-nowrap 
                {activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}"
            >
              <Icon name={tab.icon} size={3.5} /> {tab.label}
            </button>
          {/each}

          {#each $customTabs as tab}
            <div class="relative group">
              <button 
                on:click={() => activeTab = tab.id} 
                class="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl transition-all whitespace-nowrap 
                  {activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}"
              >
                <Icon name={tab.icon} size={3.5} /> {tab.name}
              </button>
              <button on:click={() => deleteTab(tab.id)} class="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-500 text-white rounded-full items-center justify-center text-[10px]">×</button>
            </div>
          {/each}

          <button on:click={addNewTab} class="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all border border-dashed border-indigo-200">
            <Icon name="plus" size={3.5} />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Content Area -->
  <div class="flex-grow p-6 overflow-y-auto custom-scrollbar">
    {#if activeTab === 'top'}
      <TopSellerList />
    {:else if activeTab === 'perf'}
      <PerformanceTable />
    {:else if activeTab === 'kt'}
      <ExploitationTable />
    {:else if activeTab === '7n'}
      <WeekComparison />
    {:else}
      {#each $customTabs as tab}
        {#if activeTab === tab.id}
          <div class="space-y-12">
            {#each tab.tables as table}
              <ContestTable 
                config={table} 
                {isComparisonMode}
                on:deleteTable={() => deleteTable(tab.id, table.id)}
                on:editColumn={(e) => {
                  currentEditingTabId = tab.id;
                  currentEditingTableId = table.id;
                  currentEditingColumn = e.detail;
                  isColumnModalOpen = true;
                }}
              />
              <button 
                on:click={() => openAddColumn(tab.id, table.id)}
                class="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-xs font-black uppercase text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all"
              >
                + Thêm cột vào {table.tableName}
              </button>
            {/each}
            
            <button 
              on:click={() => addTableToTab(tab.id)}
              class="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
            >
              Thêm bảng thi đua mới cho {tab.name}
            </button>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<ColumnModal 
  isOpen={isColumnModalOpen}
  onClose={() => isColumnModalOpen = false}
  onSave={handleSaveColumn}
  editingColumn={currentEditingColumn}
  existingColumns={[]}
/>
