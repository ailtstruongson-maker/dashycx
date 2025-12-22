
<script lang="ts">
  import WarehouseFilter from '../filters/WarehouseFilter.svelte';
  import ExportStatusFilter from '../filters/ExportStatusFilter.svelte';
  import DateRangeFilter from '../filters/DateRangeFilter.svelte';
  import DropdownFilter from '../common/DropdownFilter.svelte';
  import { filterState, uniqueFilters } from '../../stores/dashboardStore';

  function resetFilters() {
    filterState.update(s => ({
      ...s,
      kho: 'all',
      xuat: 'all',
      trangThai: [],
      nguoiTao: [],
      startDate: '',
      endDate: '',
      dateRange: 'all'
    }));
  }
</script>

<div class="chart-card p-5 mb-8 flex flex-col gap-6">
  <div class="flex flex-wrap items-end gap-6">
    <WarehouseFilter />
    <ExportStatusFilter />
    
    <DropdownFilter 
      label="Người tạo" 
      options={$uniqueFilters.nguoiTao} 
      bind:selected={$filterState.nguoiTao}
    />

    <DropdownFilter 
      label="Trạng thái" 
      options={$uniqueFilters.trangThai} 
      bind:selected={$filterState.trangThai}
    />

    <DateRangeFilter />
    
    <div class="ml-auto">
      <button 
        on:click={resetFilters}
        class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
        title="Đặt lại bộ lọc"
      >
        <i data-lucide="rotate-ccw"></i>
      </button>
    </div>
  </div>
</div>
