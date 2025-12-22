
<script lang="ts">
  import { originalData, appState, isProcessing, statusMessage, fileInfo } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';
  import { fade } from 'svelte/transition';

  let isDragging = false;

  async function processFile(file: File) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Vui lòng chọn file Excel (.xlsx)');
      return;
    }

    isProcessing.set(true);
    statusMessage.set({ message: 'Đang đọc dữ liệu Excel...', type: 'info', progress: 20 });

    const worker = new Worker(new URL('../../services/worker.ts', import.meta.url), { type: 'module' });
    
    worker.postMessage({ file });

    worker.onmessage = (e) => {
      if (e.data.type === 'SUCCESS') {
        originalData.set(e.data.payload);
        fileInfo.set({
          filename: file.name,
          savedAt: new Date().toLocaleString('vi-VN')
        });
        statusMessage.set({ message: 'Xử lý thành công!', type: 'success', progress: 100 });
        setTimeout(() => {
          appState.set('dashboard');
          isProcessing.set(false);
        }, 500);
      } else {
        alert('Lỗi: ' + e.data.message);
        isProcessing.set(false);
      }
      worker.terminate();
    };
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) processFile(file);
  }
</script>

<div 
  on:dragover|preventDefault={() => isDragging = true}
  on:dragleave|preventDefault={() => isDragging = false}
  on:drop|preventDefault={handleDrop}
  class="relative w-full max-w-2xl mx-auto p-12 border-2 border-dashed rounded-3xl transition-all duration-300
    {isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-indigo-400'}"
>
  <input 
    type="file" 
    id="file-upload" 
    class="hidden" 
    accept=".xlsx,.xls" 
    on:change={handleFileSelect}
  />
  
  <label for="file-upload" class="flex flex-col items-center cursor-pointer">
    <div class="w-20 h-20 mb-6 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
      <i data-lucide="file-spreadsheet" class="w-10 h-10"></i>
    </div>
    
    <h2 class="text-2xl font-bold text-slate-800 mb-2">Tải lên file YCX</h2>
    <p class="text-slate-500 text-center mb-8">Kéo thả file .xlsx vào đây hoặc <span class="text-indigo-600 font-bold underline">chọn từ máy tính</span></p>
    
    <div class="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
      <span class="flex items-center gap-1"><i data-lucide="shield-check" class="w-3 h-3"></i> Bảo mật 100%</span>
      <span class="flex items-center gap-1"><i data-lucide="zap" class="w-3 h-3"></i> Xử lý cực nhanh</span>
    </div>
  </label>

  {#if $isProcessing}
    <div 
      transition:fade
      class="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-10"
    >
      <div class="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="font-bold text-indigo-600">{$statusMessage.message}</p>
      <div class="w-48 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
        <div class="h-full bg-indigo-600 transition-all duration-300" style="width: {$statusMessage.progress}%"></div>
      </div>
    </div>
  {/if}
</div>
