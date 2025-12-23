
<script lang="ts">
  import Modal from '../../common/Modal.svelte';
  import { Icon } from '../../common/Icon';
  import type { ColumnConfig } from '../../../types';

  export let isOpen = false;
  export let onSave: (col: ColumnConfig) => void;
  export let onClose: () => void;
  export let existingColumns: ColumnConfig[] = [];
  export let editingColumn: ColumnConfig | null = null;

  let col: ColumnConfig = {
    id: 'col_' + Date.now(),
    label: '',
    type: 'data',
    metric: 'quantity',
    filters: { industries: [], subgroups: [] }
  };

  $: if (editingColumn) {
    col = { ...editingColumn };
  } else if (isOpen) {
    col = {
      id: 'col_' + Date.now(),
      label: '',
      type: 'data',
      metric: 'quantity',
      filters: { industries: [], subgroups: [] }
    };
  }

  function handleSave() {
    if (!col.label) return alert("Vui lòng nhập tên cột!");
    onSave(col);
    onClose();
  }
</script>

<Modal {isOpen} title={editingColumn ? "Sửa cột" : "Thêm cột mới"} {onClose}>
  <div class="space-y-6">
    <!-- Tên cột -->
    <div>
      <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Tên hiển thị trên bảng</label>
      <input 
        bind:value={col.label} 
        placeholder="VD: SL iPhone 15"
        class="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500"
      />
    </div>

    <!-- Loại cột -->
    <div class="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
      <button 
        on:click={() => col.type = 'data'}
        class="py-2.5 text-xs font-black uppercase rounded-xl transition-all {col.type === 'data' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}"
      >
        Lấy từ Dữ liệu
      </button>
      <button 
        on:click={() => col.type = 'calculated'}
        class="py-2.5 text-xs font-black uppercase rounded-xl transition-all {col.type === 'calculated' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}"
      >
        Công thức tính
      </button>
    </div>

    {#if col.type === 'data'}
      <!-- Cấu hình dữ liệu -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Chỉ số tính</label>
          <select bind:value={col.metric} class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold">
            <option value="quantity">Số lượng đơn</option>
            <option value="revenue">Doanh thu Thực</option>
            <option value="revenueQD">Doanh thu Quy đổi</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Dạng hiển thị</label>
          <select bind:value={col.displayAs} class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold">
            <option value="currency">Tiền tệ (Tr, Tỷ)</option>
            <option value="number">Số nguyên</option>
            <option value="percentage">Phần trăm (%)</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Lọc mức giá (Tùy chọn)</label>
        <div class="flex items-center gap-4">
          <input type="number" bind:value={col.filters.priceMin} placeholder="Từ giá" class="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold" />
          <span class="text-slate-400 font-bold">→</span>
          <input type="number" bind:value={col.filters.priceMax} placeholder="Đến giá" class="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold" />
        </div>
      </div>
    {:else}
      <!-- Cấu hình công thức -->
      <div class="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-800">
        <div class="flex flex-wrap items-center justify-center gap-4">
          <select bind:value={col.operand1} class="px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl font-bold shadow-sm min-w-[150px]">
            <option value="">Chọn cột A</option>
            {#each existingColumns as ec}
              {#if ec.id !== col.id} <option value={ec.id}>{ec.label}</option> {/if}
            {/each}
          </select>

          <select bind:value={col.operator} class="w-16 px-2 py-3 bg-indigo-600 text-white border-none rounded-xl font-black text-center shadow-lg">
            <option value="/">/</option>
            <option value="+">+</option>
            <option value="-">-</option>
            <option value="*">*</option>
          </select>

          <select bind:value={col.operand2} class="px-4 py-3 bg-white dark:bg-slate-800 border-none rounded-xl font-bold shadow-sm min-w-[150px]">
            <option value="">Chọn cột B</option>
            {#each existingColumns as ec}
              {#if ec.id !== col.id} <option value={ec.id}>{ec.label}</option> {/if}
            {/each}
          </select>
        </div>
        <p class="mt-4 text-center text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Mẹo: Cột A / Cột B * 100 nếu chọn hiển thị Phần trăm</p>
      </div>
    {/if}
  </div>

  <div slot="footer">
    <button on:click={onClose} class="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">Hủy</button>
    <button on:click={handleSave} class="px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-200 transition-all">Lưu cài đặt</button>
  </div>
</Modal>
