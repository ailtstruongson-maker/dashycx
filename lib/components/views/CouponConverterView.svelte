
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { Icon } from '../common/Icon';
  import { formatCurrency } from '../../utils/formatters';

  let totalAmount: number = 0;
  let denominations = [500000, 200000, 100000, 50000, 20000, 10000];
  let results: { val: number; count: number }[] = [];

  $: {
    let remaining = totalAmount;
    results = denominations.map(d => {
      const count = Math.floor(remaining / d);
      remaining %= d;
      return { val: d, count };
    }).filter(r => r.count > 0);
  }

  function clear() {
    totalAmount = 0;
  }

  function addAmount(amt: number) {
    totalAmount += amt;
  }
</script>

<div class="animate-fade-in" in:fade>
  <div class="mb-10">
    <h2 class="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Công cụ đổi Coupon</h2>
    <p class="text-slate-500 font-bold mt-2">Quy đổi tổng tiền thưởng thành các mệnh giá tối ưu số tờ</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
    <!-- Nhập liệu -->
    <div class="space-y-6">
      <div class="chart-card p-8">
        <label class="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Tổng số tiền cần đổi</label>
        <div class="relative mb-6">
          <input 
            type="number" 
            bind:value={totalAmount}
            placeholder="0"
            class="w-full text-5xl font-black p-0 border-none bg-transparent focus:ring-0 text-indigo-600 placeholder:text-slate-200"
          />
          <div class="text-xs font-black text-slate-400 mt-2 uppercase">{formatCurrency(totalAmount)}</div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          {#each [100000, 500000, 1000000, 2000000, 5000000, 10000000] as amt}
            <button 
              on:click={() => addAmount(amt)}
              class="py-3 text-xs font-bold bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl border border-slate-100 dark:border-slate-700 transition-all"
            >
              +{formatCurrency(amt)}
            </button>
          {/each}
        </div>

        <button 
          on:click={clear}
          class="w-full mt-6 py-4 text-sm font-black text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-100 transition-all uppercase tracking-widest"
        >
          Xóa trắng dữ liệu
        </button>
      </div>

      <div class="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-3xl">
        <h4 class="text-amber-800 dark:text-amber-300 font-black text-xs uppercase mb-2 flex items-center gap-2">
           <Icon name="info" size={4} /> Lưu ý thủ kho
        </h4>
        <p class="text-amber-700 dark:text-amber-400 text-xs leading-relaxed font-medium italic">
          Hệ thống ưu tiên sử dụng mệnh giá lớn nhất trước để giảm thiểu số lượng tờ Coupon cần quản lý. Vui lòng kiểm tra thực tế kho để điều chỉnh nếu thiếu mệnh giá cụ thể.
        </p>
      </div>
    </div>

    <!-- Kết quả -->
    <div class="space-y-4">
      {#if results.length > 0}
        {#each results as res, i}
          <div 
            in:fly={{ x: 20, delay: i * 50 }}
            class="chart-card p-5 flex items-center justify-between border-l-8 
              {res.val >= 500000 ? 'border-indigo-500' : res.val >= 100000 ? 'border-emerald-500' : 'border-slate-300'}"
          >
            <div class="flex items-center gap-4">
              <div class="w-14 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center font-black text-slate-400 text-[10px] uppercase">
                Coupon
              </div>
              <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Mệnh giá</p>
                <h4 class="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(res.val)}</h4>
              </div>
            </div>

            <div class="text-right">
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Số lượng</p>
              <h4 class="text-3xl font-black text-indigo-600 dark:text-indigo-400">x{res.count} <span class="text-sm">tờ</span></h4>
            </div>
          </div>
        {/each}

        <div class="chart-card p-6 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200" in:fade>
          <div class="flex justify-between items-center font-black uppercase text-xs">
            <span>Tổng cộng tờ:</span>
            <span class="text-2xl">{results.reduce((a, b) => a + b.count, 0)} tờ</span>
          </div>
        </div>
      {:else}
        <div class="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-12 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
          <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <Icon name="ticket" size={8} className="text-slate-300" />
          </div>
          <p class="text-slate-400 font-bold uppercase text-xs tracking-widest">Đang đợi số tiền...</p>
        </div>
      {/if}
    </div>
  </div>
</div>
