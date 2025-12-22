
<script lang="ts">
  import { processedData } from '../../stores/dashboardStore';
  import { formatCurrency } from '../../utils/formatters';
  import { Icon } from '../common/Icon';
  import { GoogleGenAI } from "@google/genai";
  import { slide, fade } from 'svelte/transition';

  $: employees = $processedData?.employeeData.fullSellerArray || [];

  let aiResult = "";
  let isAnalyzing = false;

  async function askAI() {
    if (employees.length === 0) return;
    isAnalyzing = true;
    aiResult = "";

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const top3 = employees.slice(0, 3).map(e => `${e.name}: ${formatCurrency(e.doanhThuQD)}`).join(', ');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Dựa vào dữ liệu nhân viên sau, hãy viết 3 câu nhận xét ngắn gọn, sắc bén bằng tiếng Việt.
        Danh sách: ${JSON.stringify(employees.slice(0, 10))}
        Top 3 hiện tại: ${top3}
        Lưu ý: Khen ngợi người có HQQĐ cao (>40%), nhắc nhở người có HQQĐ thấp (<30%).`
      });

      aiResult = response.text;
    } catch (e) {
      aiResult = "Không thể kết nối với Trợ lý AI lúc này.";
    } finally {
      isAnalyzing = false;
    }
  }

  const medals = ['🥇', '🥈', '🥉'];
</script>

<div class="chart-card flex flex-col h-full overflow-hidden">
  <div class="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
    <div>
      <h2 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
        <Icon name="award" size={5} className="text-amber-500" />
        Xếp hạng hiệu suất
      </h2>
      <p class="text-xs text-slate-500 font-bold">Dựa trên Doanh thu Quy đổi (DTQĐ)</p>
    </div>

    <button 
      on:click={askAI}
      disabled={isAnalyzing}
      class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
    >
      {#if isAnalyzing}
        <Icon name="loader-2" size={4} className="animate-spin" />
        Đang đọc...
      {:else}
        <Icon name="sparkles" size={4} />
        AI Nhận xét
      {/if}
    </button>
  </div>

  <!-- AI Result Box -->
  {#if aiResult}
    <div transition:slide class="mx-6 mt-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-lg relative overflow-hidden">
      <div class="absolute right-0 top-0 opacity-10 rotate-12">
        <Icon name="bot" size={20} />
      </div>
      <p class="text-sm italic leading-relaxed relative z-10 font-medium">"{aiResult}"</p>
    </div>
  {/if}

  <div class="flex-grow overflow-y-auto p-4 custom-scrollbar">
    <table class="w-full text-left border-separate border-spacing-y-2">
      <thead class="sticky top-0 bg-white dark:bg-slate-800 z-10">
        <tr class="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          <th class="px-4 py-2">Hạng</th>
          <th class="px-4 py-2">Nhân viên</th>
          <th class="px-4 py-2 text-right">DTQĐ</th>
          <th class="px-4 py-2 text-center">HQQĐ</th>
        </tr>
      </thead>
      <tbody>
        {#each employees as emp, i}
          <tr class="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <td class="px-4 py-3 rounded-l-xl">
              {#if i < 3}
                <span class="text-2xl">{medals[i]}</span>
              {:else}
                <span class="font-bold text-slate-400 ml-1">#{i + 1}</span>
              {/if}
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-col">
                <span class="font-black text-slate-800 dark:text-slate-200 text-sm truncate max-w-[150px]">
                  {emp.name.split(' - ')[1] || emp.name}
                </span>
                <span class="text-[10px] font-bold text-slate-400 uppercase">{emp.department}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(emp.doanhThuQD)}
              </span>
            </td>
            <td class="px-4 py-3 text-center rounded-r-xl">
              <span class="px-2.5 py-1 rounded-lg text-xs font-black
                {emp.hieuQuaValue >= 40 ? 'bg-emerald-100 text-emerald-700' : 
                 emp.hieuQuaValue >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}">
                {emp.hieuQuaValue.toFixed(0)}%
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
