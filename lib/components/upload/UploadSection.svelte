
<script lang="ts">
  import { triggerFileUpload, fileInfo } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';

  async function handleFile(file: File) {
    if (!file) return;
    
    fileInfo.set({
      filename: file.name,
      savedAt: new Date().toLocaleTimeString('vi-VN')
    });
    
    // Gọi hàm trigger đã được tối ưu với timer
    triggerFileUpload(file);
  }

  function onFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.xlsx')) handleFile(file);
  }
</script>

<div 
  class="chart-card p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 transition-all text-center group"
  on:dragover|preventDefault
  on:drop|preventDefault={handleDrop}
>
  <input type="file" id="file-input" class="hidden" on:change={onFileSelect} accept=".xlsx" />
  <label for="file-input" class="cursor-pointer block">
    <div class="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
      <i data-lucide="upload-cloud" class="w-10 h-10"></i>
    </div>
    <h2 class="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Bắt đầu phân tích dữ liệu</h2>
    <p class="text-slate-500 font-medium mb-8">Kéo thả file Excel YCX vào đây hoặc nhấn để chọn</p>
    <span class="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all inline-block">
      TẢI TỆP LÊN NGAY
    </span>
  </label>
</div>
