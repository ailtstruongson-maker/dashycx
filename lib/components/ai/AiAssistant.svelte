
<script lang="ts">
  import { processedData } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';
  import { fly, fade } from 'svelte/transition';
  import { GoogleGenAI } from "@google/genai";

  let isOpen = false;
  let query = "";
  let messages: { role: 'user' | 'bot'; text: string }[] = [
    { role: 'bot', text: 'Xin chào! Tôi là Trợ lý AI. Tôi đã đọc dữ liệu của bạn, bạn cần tôi phân tích điều gì?' }
  ];
  let isTyping = false;

  async function sendMessage() {
    if (!query.trim() || isTyping) return;

    const userText = query;
    messages = [...messages, { role: 'user', text: userText }];
    query = "";
    isTyping = true;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = JSON.stringify({
        kpis: $processedData?.kpis,
        topIndustries: $processedData?.industryData.slice(0, 5)
      });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Bối cảnh dữ liệu Dashboard: ${context}. Câu hỏi người dùng: ${userText}. Hãy trả lời súc tích, chuyên nghiệp bằng tiếng Việt.`
      });

      messages = [...messages, { role: 'bot', text: response.text }];
    } catch (e) {
      messages = [...messages, { role: 'bot', text: 'Có lỗi kết nối AI. Vui lòng thử lại sau.' }];
    } finally {
      isTyping = false;
    }
  }
</script>

<button 
  on:click={() => isOpen = !isOpen}
  class="fixed bottom-8 right-8 z-[120] w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
>
  <Icon name={isOpen ? 'x' : 'sparkles'} size={6} />
  {#if !isOpen}
    <span class="absolute -top-1 -right-1 flex h-4 w-4">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
    </span>
  {/if}
</button>

{#if isOpen}
  <div 
    transition:fly={{ y: 20, duration: 300 }}
    class="fixed bottom-28 right-8 z-[120] w-[350px] h-[500px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
  >
    <div class="p-6 bg-indigo-600 text-white flex items-center gap-3">
      <div class="p-2 bg-white/20 rounded-xl"><Icon name="bot" size={5} /></div>
      <div>
        <h3 class="font-black uppercase tracking-widest text-xs">AI Strategic Hub</h3>
        <p class="text-[10px] opacity-70 font-bold uppercase">Online & Analyzing</p>
      </div>
    </div>

    <div class="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
      {#each messages as msg}
        <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[85%] p-3 rounded-2xl text-sm {msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'}">
            {msg.text}
          </div>
        </div>
      {/each}
      {#if isTyping}
        <div class="flex justify-start animate-pulse">
          <div class="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-xs font-bold text-slate-400">AI đang suy nghĩ...</div>
        </div>
      {/if}
    </div>

    <form on:submit|preventDefault={sendMessage} class="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
      <input bind:value={query} placeholder="Hỏi AI về báo cáo..." class="flex-grow bg-white dark:bg-slate-700 border-none rounded-xl px-4 text-sm focus:ring-2 focus:ring-indigo-500" />
      <button class="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"><Icon name="send" size={4} /></button>
    </form>
  </div>
{/if}
