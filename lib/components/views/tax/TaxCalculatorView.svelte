<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { Icon } from '../../common/Icon';
  import { formatCurrency } from '../../../utils/formatters';
  import { calculateProgressiveTax, PERSONAL_DEDUCTION, DEPENDENT_DEDUCTION } from '../../../services/taxService';
  import { scanSalarySlip } from '../../../services/aiService';
  import { showToast } from '../../../stores/dashboardStore';

  let name = "";
  let totalIncome = 0;
  let dependents = 0;
  let proxyAmount = 0;
  let insurance = 0;
  let unionFee = 0;
  
  let isAiScanning = false;
  let results: any = null;

  $: {
    if (totalIncome > 0) {
      const totalDeductions = PERSONAL_DEDUCTION + (dependents * DEPENDENT_DEDUCTION) + insurance + unionFee;
      const assessableWithProxy = Math.max(0, totalIncome - totalDeductions);
      const taxWithProxy = calculateProgressiveTax(assessableWithProxy);

      const incomeNoProxy = Math.max(0, totalIncome - proxyAmount);
      const assessableNoProxy = Math.max(0, incomeNoProxy - totalDeductions);
      const taxNoProxy = calculateProgressiveTax(assessableNoProxy);

      results = {
        taxDiff: taxWithProxy - taxNoProxy,
        totalDeductions,
        taxWithProxy,
        taxNoProxy
      };
    } else {
      results = null;
    }
  }

  async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    isAiScanning = true;
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const data = await scanSalarySlip(base64Data, file.type);
        
        name = data.fullName || "";
        totalIncome = data.totalIncome || 0;
        dependents = data.dependents || 0;
        insurance = data.insurance || 0;
        unionFee = data.unionFee || 0;
        
        isAiScanning = false;
        showToast("Quét phiếu lương thành công!", "success");
      };
    } catch (err) {
      console.error(err);
      isAiScanning = false;
      showToast("AI không thể đọc được ảnh. Vui lòng nhập tay.", "error");
    }
  }
</script>

<div class="animate-fade-in" in:fade>
  <div class="mb-10 text-center md:text-left">
    <h2 class="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Máy tính thuế TNCN AI</h2>
    <p class="text-slate-500 font-bold mt-2">Tự động bóc tách phiếu lương và tính tiền thuế chênh lệch</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-1 space-y-6">
      <div class="chart-card p-6 border-indigo-100 dark:border-indigo-900/50">
        <label class="block cursor-pointer group mb-6">
          <div class="p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-[2rem] flex flex-col items-center gap-3 group-hover:border-indigo-500 transition-all bg-indigo-50/30 dark:bg-indigo-900/10">
            {#if isAiScanning}
              <div class="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm font-black text-indigo-600 animate-pulse">AI đang phân tích...</span>
            {:else}
              <div class="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Icon name="camera" size={6} />
              </div>
              <span class="text-sm font-black text-slate-600 dark:text-slate-300">Quét phiếu lương (AI)</span>
            {/if}
            <input type="file" accept="image/*" capture="environment" class="hidden" on:change={handleFileUpload} disabled={isAiScanning} />
          </div>
        </label>

        <div class="space-y-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nhân viên</label>
            <input bind:value={name} placeholder="Họ và tên" class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold border-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tổng thu nhập chịu thuế</label>
            <input type="number" bind:value={totalIncome} class="w-full px-4 py-2.5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl font-black text-indigo-600 border-none" />
          </div>
          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
            <label class="text-[10px] font-black uppercase text-red-500 mb-1 block">Tiền nhận thay (Thưởng/Khoán)</label>
            <input type="number" bind:value={proxyAmount} class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl font-black text-red-600 border-none shadow-sm" />
          </div>
          <div class="grid grid-cols-2 gap-4">
             <div>
                <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Người phụ thuộc</label>
                <input type="number" bind:value={dependents} class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold border-none" />
             </div>
             <div>
                <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Bảo hiểm/C.Đoàn</label>
                <input type="number" bind:value={insurance} class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold border-none" />
             </div>
          </div>
        </div>
      </div>
    </div>

    <div class="lg:col-span-2 space-y-6">
      {#if results}
        <div class="chart-card p-10 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-2xl relative overflow-hidden" in:slide>
          <div class="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div class="text-center md:text-left flex-grow">
              <p class="text-indigo-200 font-black text-xs uppercase tracking-widest mb-2">Tiền thuế cần hoàn trả</p>
              <h1 class="text-7xl font-black mb-6">{formatCurrency(results.taxDiff)}</h1>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                   <p class="text-[10px] font-bold text-indigo-100 uppercase mb-1">Thuế thực nộp</p>
                   <p class="text-xl font-black">{formatCurrency(results.taxWithProxy)}</p>
                </div>
                <div class="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                   <p class="text-[10px] font-bold text-indigo-100 uppercase mb-1">Thuế đáng lẻ</p>
                   <p class="text-xl font-black">{formatCurrency(results.taxNoProxy)}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-[2.5rem] shadow-2xl flex flex-col items-center shrink-0">
              <img 
                src="https://img.vietqr.io/image/vietinbank-1133666888-compact2.png?amount={Math.round(results.taxDiff)}&addInfo=HOAN%20THUE%20{encodeURIComponent(name || 'NV')}" 
                alt="QR" 
                class="w-48 h-48" 
              />
              <span class="text-slate-900 text-[10px] font-black mt-3 uppercase">Quét để hoàn tiền</span>
            </div>
          </div>
        </div>

        <div class="chart-card p-8" in:fade>
          <h3 class="font-black text-slate-800 dark:text-white uppercase text-sm mb-6 flex items-center gap-2">
            <Icon name="info" size={4} className="text-indigo-500" />
            Chi tiết giảm trừ (Biểu thuế 2024)
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
              <span class="text-slate-500 font-bold">Giảm trừ gia cảnh (Bản thân):</span>
              <span class="font-black">{formatCurrency(PERSONAL_DEDUCTION)}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800">
              <span class="text-slate-500 font-bold">Người phụ thuộc (x{dependents}):</span>
              <span class="font-black">{formatCurrency(dependents * DEPENDENT_DEDUCTION)}</span>
            </div>
            <div class="flex justify-between items-center py-4 text-lg">
              <span class="text-slate-900 dark:text-white font-black uppercase">Tổng cộng giảm trừ:</span>
              <span class="text-indigo-600 font-black">{formatCurrency(results.totalDeductions)}</span>
            </div>
          </div>
        </div>
      {:else}
        <div class="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-20 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3.5rem]">
          <div class="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8">
            <Icon name="calculator" size={12} className="text-slate-200" />
          </div>
          <h3 class="text-2xl font-black text-slate-300 uppercase tracking-widest">Sẵn sàng phân tích</h3>
          <p class="text-slate-300 text-sm mt-3 font-medium max-w-sm">Tải lên ảnh phiếu lương hoặc nhập các chỉ số thu nhập để bắt đầu tính toán.</p>
        </div>
      {/if}
    </div>
  </div>
</div>