
<script lang="ts">
  import UploadSection from '../upload/UploadSection.svelte';
  import { fade } from 'svelte/transition';
</script>

<div class="min-h-[80vh] flex flex-col items-center justify-center px-4" in:fade>
  <div class="text-center mb-12">
    <div class="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black tracking-widest uppercase mb-6 border border-indigo-100">
      Mwg Business Intelligence
    </div>
    <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
      Biến dữ liệu thành <br/> <span class="text-indigo-600">Lợi nhuận.</span>
    </h1>
    <p class="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
      Hệ thống phân tích báo cáo YCX thông minh. Tự động tính toán Doanh thu Quy đổi, 
      Hiệu quả ngành hàng và Xếp hạng nhân viên trong vài giây.
    </p>
  </div>

  <UploadSection />

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-5xl">
    <div class="flex flex-col items-center text-center">
      <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
        <i data-lucide="bar-chart"></i>
      </div>
      <h3 class="font-bold text-slate-800 mb-2">Trực quan hóa</h3>
      <p class="text-sm text-slate-500">Biểu đồ xu hướng ca, ngày, tuần tự động cập nhật.</p>
    </div>
    <div class="flex flex-col items-center text-center">
      <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
        <i data-lucide="users"></i>
      </div>
      <h3 class="font-bold text-slate-800 mb-2">Quản trị nhân sự</h3>
      <p class="text-sm text-slate-500">Theo dõi chi tiết khả năng khai thác của từng nhân viên.</p>
    </div>
    <div class="flex flex-col items-center text-center">
      <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
        <i data-lucide="sparkles"></i>
      </div>
      <h3 class="font-bold text-slate-800 mb-2">Trợ lý AI</h3>
      <p class="text-sm text-slate-500">Tự động đưa ra nhận xét và cảnh báo hiệu suất kém.</p>
    </div>
  </div>
</div>
