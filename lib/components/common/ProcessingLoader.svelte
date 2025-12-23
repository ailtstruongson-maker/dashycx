
<script lang="ts">
  import { processingTime } from '../../stores/dashboardStore';
  import { fade } from 'svelte/transition';
  import { Icon } from './Icon';

  $: seconds = ($processingTime / 1000).toFixed(1);
</script>

<div 
  class="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
  transition:fade
>
  <!-- Pong Loader Animation -->
  <div class="pong-loader mb-10">
    <div class="pong-ball bg-indigo-500"></div>
    <div class="pong-paddle left bg-indigo-500"></div>
    <div class="pong-paddle right bg-indigo-500"></div>
  </div>

  <div class="text-center space-y-4">
    <h2 class="text-2xl font-black text-white uppercase tracking-widest animate-pulse">
      Đang phân tích dữ liệu
    </h2>
    
    <div class="flex flex-col items-center">
      <div class="text-6xl font-black text-indigo-400 font-mono tabular-nums">
        {seconds}s
      </div>
      <p class="text-slate-400 text-sm font-bold uppercase mt-2 tracking-tighter">
        Thời gian thực thi hệ thống
      </p>
    </div>

    <div class="max-w-md w-full bg-slate-800 rounded-2xl p-4 border border-slate-700 mt-8">
      <div class="flex items-center gap-3 text-left">
        <div class="p-2 bg-indigo-500/20 rounded-lg">
          <i data-lucide="cpu" class="w-5 h-5 text-indigo-400"></i>
        </div>
        <div>
          <p class="text-xs font-bold text-slate-300">Công nghệ Multi-threading Web Workers</p>
          <p class="text-[10px] text-slate-500">Hệ thống đang sử dụng luồng phụ để không làm treo trình duyệt của bạn.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .pong-loader {
    position: relative;
    width: 80px;
    height: 40px;
  }
  .pong-ball {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pong-ball-move 2s infinite linear;
  }
  .pong-paddle {
    position: absolute;
    width: 4px;
    height: 16px;
    top: 12px;
    border-radius: 2px;
  }
  .pong-paddle.left { left: 0; animation: paddle-left 2s infinite linear; }
  .pong-paddle.right { right: 0; animation: paddle-right 2s infinite linear; }

  @keyframes pong-ball-move {
    0%, 100% { left: 4px; top: 16px; }
    50% { left: 68px; top: 16px; }
    25% { top: 4px; }
    75% { top: 28px; }
  }
  @keyframes paddle-left {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-8px); }
    75% { transform: translateY(8px); }
  }
  @keyframes paddle-right {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-8px); }
    75% { transform: translateY(8px); }
  }
</style>
