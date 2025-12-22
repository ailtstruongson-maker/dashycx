
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { 
    appState, 
    originalData, 
    departmentMap, 
    fileInfo 
  } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';

  let deptClearSuccess = false;
  let dataClearSuccess = false;
  let isDeptInfoVisible = false;
  let isClearingDepartments = false;

  // Lấy ra các giá trị từ store để logic gọn hơn
  $: hasDeptData = Object.keys($departmentMap).length > 0;
  $: lastUpdated = $fileInfo ? $fileInfo.savedAt : '';

  function handleNewFile() {
    document.getElementById('main-file-input')?.click();
  }

  function handleLoadShiftFile() {
    document.getElementById('shift-file-input')?.click();
  }

  async function handleClearDepartments() {
    if (confirm('Xóa dữ liệu phân ca sẽ làm mất thông tin bộ phận của nhân viên. Tiếp tục?')) {
      isClearingDepartments = true;
      // Giả lập xóa từ IndexedDB (logic thực tế nằm ở DashboardView/Logic)
      // Trong Svelte, chúng ta có thể gọi trực tiếp hàm xóa ở đây hoặc qua store
      departmentMap.set({});
      deptClearSuccess = true;
      isClearingDepartments = false;
      setTimeout(() => (deptClearSuccess = false), 3000);
    }
  }

  function handleClearData() {
    if (confirm('Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu bán hàng đã lưu?')) {
      dataClearSuccess = true;
      setTimeout(() => {
        originalData.set([]);
        appState.set('upload');
        dataClearSuccess = false;
      }, 1000);
    }
  }

  function toggleDeptInfo() {
    isDeptInfoVisible = !isDeptInfoVisible;
  }
</script>

<header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-50">
  <!-- Brand & Timestamp -->
  <div>
    <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
      <span class="p-2 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-200">
        <i data-lucide="bar-chart-3"></i>
      </span>
      BI <span class="text-indigo-600">HUB</span>
    </h1>
    {#if lastUpdated}
      <p class="text-slate-500 text-sm mt-1 flex items-center gap-1">
        <i data-lucide="calendar" class="w-3 h-3"></i>
        Cập nhật: <span class="font-bold text-slate-700 dark:text-slate-300">{lastUpdated}</span>
      </p>
    {:else}
      <p class="text-slate-500 text-sm mt-1">Dữ liệu thời gian thực từ tệp Excel</p>
    {/if}
  </div>

  <!-- Action Buttons -->
  <div class="flex flex-wrap items-center gap-3">
    
    <!-- Nhóm Phân Ca -->
    <div class="flex items-center">
      <div class="inline-flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button 
          on:click={handleLoadShiftFile}
          class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors border-r border-slate-200 dark:border-slate-700"
          title="Tải lên file phân ca (.xlsx)"
        >
          <i data-lucide="users-2"></i>
          <span class="hidden sm:inline">Phân ca</span>
        </button>
        
        <a 
          href="https://office.thegioididong.com/quan-ly-phan-ca" 
          target="_blank" 
          class="bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-500 hover:text-indigo-600 transition-colors"
          title="Mở Office để xuất file"
        >
          <i data-lucide="external-link"></i>
        </a>

        {#if hasDeptData}
          {#if deptClearSuccess}
            <div in:fade class="bg-green-100 dark:bg-green-900/40 px-3 py-2 text-green-600 font-bold text-xs flex items-center gap-1">
              <i data-lucide="check-circle" class="w-4 h-4"></i> Đã xóa
            </div>
          {:else}
            <button 
              on:click={handleClearDepartments}
              disabled={isClearingDepartments}
              class="bg-red-50 dark:bg-red-900/30 px-3 py-2 text-red-500 hover:bg-red-100 transition-colors"
              title="Xóa dữ liệu phân ca"
            >
              {#if isClearingDepartments}
                <i data-lucide="loader-2" class="animate-spin"></i>
              {:else}
                <i data-lucide="trash-2"></i>
              {/if}
            </button>
          {/if}
        {/if}
      </div>

      <!-- Hướng dẫn Popup -->
      <div class="relative ml-2">
        <button 
          on:click={toggleDeptInfo}
          class="p-2 text-slate-400 hover:text-indigo-500 rounded-full hover:bg-slate-100 transition-all"
        >
          <i data-lucide="help-circle"></i>
        </button>
        
        {#if isDeptInfoVisible}
          <div 
            use:fade={{ duration: 150 }}
            class="absolute top-full right-0 mt-3 w-80 bg-slate-800 text-white rounded-2xl shadow-2xl p-5 border border-slate-700 animate-fade-in-up"
          >
            <h4 class="font-bold mb-3 flex items-center gap-2 text-indigo-400">
              <i data-lucide="info" class="w-4 h-4"></i> Hướng dẫn Phân ca
            </h4>
            <div class="text-xs space-y-3 text-slate-300 leading-relaxed">
              <p>Để Dashboard có thể tự động chia nhóm nhân viên theo bộ phận (Gia dụng, Phụ kiện, v.v.), bạn cần:</p>
              <ol class="list-decimal list-inside space-y-2">
                <li>Truy cập <span class="text-white underline">Office MWG</span>.</li>
                <li>Chọn <span class="font-bold text-white">Quản lý phân ca</span> -> Xuất Excel tuần.</li>
                <li>Tải toàn bộ file của các siêu thị trong cụm lên đây. App sẽ tự động gộp dữ liệu.</li>
              </ol>
            </div>
            <button on:click={toggleDeptInfo} class="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors">Đã hiểu</button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Nhóm Dữ Liệu Bán Hàng -->
    <div class="flex items-center">
      <div class="inline-flex rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button 
          on:click={handleNewFile}
          class="flex items-center gap-2 bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <i data-lucide="file-plus"></i>
          Nhập YCX
        </button>
        
        <a 
          href="https://report.mwgroup.vn/home/dashboard/77" 
          target="_blank" 
          class="bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-500 hover:text-indigo-600 transition-colors border-l border-slate-200 dark:border-slate-700"
        >
          <i data-lucide="link-2"></i>
        </a>

        {#if dataClearSuccess}
          <div in:fade class="bg-green-100 dark:bg-green-900/40 px-3 py-2 text-green-600 font-bold text-xs flex items-center gap-1">
             <i data-lucide="check" class="w-4 h-4"></i> Đã xóa
          </div>
        {:else}
          <button 
            on:click={handleClearData}
            class="bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-400 hover:text-red-500 transition-colors border-l border-slate-200 dark:border-slate-700"
            title="Reset toàn bộ App"
          >
            <i data-lucide="rotate-ccw"></i>
          </button>
        {if}
      </div>
    </div>
  </div>
</header>

<style>
  /* Mũi tên của popup hướng dẫn */
  .animate-fade-in-up::before {
    content: '';
    position: absolute;
    bottom: 100%;
    right: 12px;
    border: 8px solid transparent;
    border-bottom-color: rgb(30, 41, 59);
  }
</style>
