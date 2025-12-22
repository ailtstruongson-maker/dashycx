
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { GoogleGenAI, Type } from "@google/genai";
  import { Icon } from '../../common/Icon';
  import { formatCurrency } from '../../../utils/formatters';
  import { calculateProgressiveTax, PERSONAL_DEDUCTION, DEPENDENT_DEDUCTION } from '../../../services/taxService';
  import { saveCalculation, getCalculations, deleteCalculation } from '../../../../components/views/tax/TaxDb';

  // State form
  let name = "";
  let totalIncome = 0;
  let dependents = 0;
  let proxyAmount = 0;
  let insurance = 0;
  let unionFee = 0;
  
  // State kết quả
  let results: any = null;
  let isAiProcessing = false;
  let qrCodeUrl = "";
  let savedHistory: any[] = [];

  // Tính toán tự động khi input thay đổi
  $: {
    if (totalIncome > 0) {
      const totalDeductions = PERSONAL_DEDUCTION + (dependents * DEPENDENT_DEDUCTION) + insurance + unionFee;
      
      // TH1: Có tính tiền nhận thay
      const assessableWithProxy = Math.max(0, totalIncome - totalDeductions);
      const taxWithProxy = calculateProgressiveTax(assessableWithProxy);

      // TH2: Không tính tiền nhận thay
      const incomeNoProxy = Math.max(0, totalIncome - proxyAmount);
      const assessableNoProxy = Math.max(0, incomeNoProxy - totalDeductions);
      const taxNoProxy = calculateProgressiveTax(assessableNoProxy);

      results = {
        taxDiff: taxWithProxy - taxNoProxy,
        totalDeductions,
        taxWithProxy,
        taxNoProxy,
        assessableWithProxy
      };

      // Tạo QR mặc định (VD VietinBank - Thay đổi theo nhu cầu siêu thị)
      if (results.taxDiff > 0) {
        const amount = Math.round(results.taxDiff);
        qrCodeUrl = `https://img.vietqr.io/image/vietinbank-1133666888-compact2.png?amount=${amount}&addInfo=HOAN%20THUE%20TNCN%20${encodeURIComponent(name || 'NHAN%20VIEN')}`;
      }
    } else {
      results = null;
      qrCodeUrl = "";
    }
  }

  onMount(async () => {
    savedHistory = await getCalculations();
  });

  async function handleImageUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    isAiProcessing = true;
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            { inlineData: { mimeType: file.type, data: base64Data } },
            { text: "Trích xuất từ phiếu lương: fullName, totalIncome (Thu nhập chịu thuế), dependents (Người phụ thuộc), insurance (Bảo hiểm), unionFee (Công đoàn). Trả về JSON." }
          ],
          config: { responseMimeType: "application/json" }
        });

        const data = JSON.parse(response.text);
        name = data.fullName || "";
        totalIncome = data.totalIncome || 0;
        dependents = data.dependents || 0;
        insurance = data.insurance || 0;
        unionFee = data.unionFee || 0;
        isAiProcessing = false;
      };
    } catch (err) {
      console.error(err);
      isAiProcessing = false;
      alert("AI không thể đọc được ảnh này. Vui lòng nhập tay.");
    }
  }

  async function handleSave() {
    const entry = { name: name || "Chưa đặt tên", totalIncome, proxyAmount, createdAt: new Date().toISOString() };
    await saveCalculation(entry);
    savedHistory = await getCalculations();
  }

  async function removeHistory(id: number) {
    await deleteCalculation(id);
    savedHistory = await getCalculations();
  }
</script>

<div class="animate-fade-in" in:fade>
  <div class="mb-10">
    <h2 class="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Tính thuế TNCN Nhận Thay</h2>
    <p class="text-slate-500 font-bold mt-2">Hỗ trợ tính tiền thuế chênh lệch khi nhận thưởng/khoán hộ Siêu thị</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Cột Nhập Liệu -->
    <div class="lg:col-span-1 space-y-6">
      <div class="chart-card p-6">
        <h3 class="text-lg font-black mb-6 flex items-center gap-2">
          <Icon name="edit-3" className="text-indigo-600" /> Nhập thông tin
        </h3>

        <div class="space-y-4">
          <!-- AI Upload -->
          <label class="block group cursor-pointer">
            <div class="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center gap-2 group-hover:border-indigo-500 transition-all bg-slate-50/50 dark:bg-slate-900/50">
              {#if isAiProcessing}
                <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-xs font-bold text-indigo-600">AI đang quét ảnh...</span>
              {:else}
                <Icon name="sparkles" size={8} className="text-indigo-500" />
                <span class="text-xs font-bold text-slate-500">Quét phiếu lương bằng AI</span>
              {/if}
              <input type="file" accept="image/*" class="hidden" on:change={handleImageUpload} />
            </div>
          </label>

          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Họ và tên</label>
            <input bind:value={name} placeholder="Nhập tên nhân viên" class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-none rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>

          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Tổng thu nhập chịu thuế</label>
            <input type="number" bind:value={totalIncome} class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-none rounded-xl font-bold text-indigo-600" />
          </div>

          <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
            <label class="text-[10px] font-black uppercase text-red-500 mb-1 block">Số tiền nhận thay (Thưởng/Khoán)</label>
            <input type="number" bind:value={proxyAmount} class="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-xl font-black text-red-600 shadow-sm" />
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div>
                <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Người phụ thuộc</label>
                <input type="number" bind:value={dependents} class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-none rounded-xl font-bold" />
             </div>
             <div>
                <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Bảo hiểm/Công đoàn</label>
                <input type="number" bind:value={insurance} class="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 border-none rounded-xl font-bold" />
             </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button on:click={() => { name=""; totalIncome=0; proxyAmount=0; }} class="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-all">Xóa trắng</button>
            <button on:click={handleSave} class="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Lưu kết quả</button>
          </div>
        </div>
      </div>

      <!-- Lịch sử -->
      <div class="chart-card p-6">
        <h3 class="text-sm font-black mb-4 uppercase text-slate-400">Lịch sử gần đây</h3>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          {#each savedHistory as item}
            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl group">
              <div class="overflow-hidden">
                <p class="text-xs font-black truncate">{item.name}</p>
                <p class="text-[10px] text-slate-400 font-bold">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <button on:click={() => removeHistory(item.id)} class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                <Icon name="trash-2" size={4} />
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Cột Kết Quả -->
    <div class="lg:col-span-2 space-y-6">
      {#if results}
        <div class="chart-card p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-2xl shadow-indigo-200 relative overflow-hidden" in:slide>
          <div class="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div class="text-center md:text-left">
              <p class="text-indigo-200 font-black text-xs uppercase tracking-[0.2em] mb-2">Tiền thuế chênh lệch cần hoàn</p>
              <h1 class="text-6xl font-black mb-4">{formatCurrency(results.taxDiff)}</h1>
              <div class="flex gap-4">
                <div class="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                   <p class="text-[10px] font-bold text-indigo-200 uppercase">Thuế thực nộp</p>
                   <p class="text-lg font-black">{formatCurrency(results.taxWithProxy)}</p>
                </div>
                <div class="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                   <p class="text-[10px] font-bold text-indigo-200 uppercase">Thuế đáng lẻ</p>
                   <p class="text-lg font-black">{formatCurrency(results.taxNoProxy)}</p>
                </div>
              </div>
            </div>

            <div class="bg-white p-4 rounded-3xl shadow-2xl flex flex-col items-center">
              <img src={qrCodeUrl} alt="QR Hoàn tiền" class="w-40 h-40" />
              <p class="text-slate-900 text-[10px] font-black mt-2 uppercase tracking-tight">Scan để hoàn tiền</p>
            </div>
          </div>
        </div>

        <div class="chart-card p-6" in:fade>
          <h3 class="font-black text-slate-800 dark:text-white uppercase text-sm mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Phân tích chi tiết (Biểu thuế 2024)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div class="space-y-4">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500 font-bold">Giảm trừ gia cảnh bản thân:</span>
                <span class="font-black text-slate-700 dark:text-slate-200">{formatCurrency(PERSONAL_DEDUCTION)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500 font-bold">Giảm trừ người phụ thuộc ({dependents}):</span>
                <span class="font-black text-slate-700 dark:text-slate-200">{formatCurrency(dependents * DEPENDENT_DEDUCTION)}</span>
              </div>
              <div class="flex justify-between text-sm pt-4 border-t border-slate-50 dark:border-slate-800">
                <span class="text-slate-500 font-black uppercase text-xs">Tổng giảm trừ:</span>
                <span class="font-black text-slate-800 dark:text-white">{formatCurrency(results.totalDeductions)}</span>
              </div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p class="text-xs text-slate-400 font-bold italic">
                * Lưu ý: Kết quả trên dựa trên dữ liệu bạn cung cấp. Thuế TNCN thực tế có thể thay đổi tùy thuộc vào quyết toán thuế năm của cá nhân.
              </p>
              <button class="mt-4 w-full py-2 bg-white dark:bg-slate-800 text-indigo-600 font-black text-xs rounded-xl shadow-sm border border-indigo-100 dark:border-slate-700">
                TẢI KẾT QUẢ (.PNG)
              </button>
            </div>
          </div>
        </div>
      {:else}
        <div class="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-20 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
          <div class="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6">
            <Icon name="calculator" size={10} className="text-slate-300" />
          </div>
          <h3 class="text-xl font-bold text-slate-400 uppercase tracking-widest">Đang chờ dữ liệu đầu vào</h3>
          <p class="text-slate-300 text-sm mt-2 font-medium">Nhập thu nhập chịu thuế để xem kết quả phân tích</p>
        </div>
      {/if}
    </div>
  </div>
</div>
