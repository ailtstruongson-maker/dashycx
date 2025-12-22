
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { Icon } from '../common/Icon';

  interface Task {
    id: string;
    text: string;
    time: string;
    done: boolean;
    important: boolean;
  }

  let tasks: Task[] = [
    { id: '1', text: 'Đỗ số sáng & Gửi báo cáo Ca 1', time: '08:30', done: false, important: true },
    { id: '2', text: 'Kiểm tra hồ sơ Trả chậm duyệt sáng', time: '10:00', done: false, important: false },
    { id: '3', text: 'Đỗ số trưa & Phân tích Tỷ lệ HQ', time: '11:30', done: false, important: true },
    { id: '4', text: 'Chụp ảnh tồn kho Phụ kiện hot', time: '14:00', done: false, important: false },
    { id: '5', text: 'Đỗ số chiều & Đẩy mạnh tư vấn Trả góp', time: '17:30', done: false, important: true },
    { id: '6', text: 'Kiểm tra danh sách Đơn hàng Chờ xuất', time: '19:00', done: false, important: false },
    { id: '7', text: 'Đỗ số tối & Chốt doanh thu ca cuối', time: '21:30', done: false, important: true },
    { id: '8', text: 'Vệ sinh quầy kệ & Bàn giao ca sau', time: '22:00', done: false, important: false },
  ];

  onMount(() => {
    const saved = localStorage.getItem('daily_checklist_v1');
    const lastUpdate = localStorage.getItem('daily_checklist_date');
    const today = new Date().toLocaleDateString();

    if (saved && lastUpdate === today) {
      tasks = JSON.parse(saved);
    } else {
      localStorage.setItem('daily_checklist_date', today);
      save();
    }
  });

  function toggle(id: string) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    save();
  }

  function save() {
    localStorage.setItem('daily_checklist_v1', JSON.stringify(tasks));
  }

  $: completedCount = tasks.filter(t => t.done).length;
  $: progress = (completedCount / tasks.length) * 100;
</script>

<div class="animate-fade-in" in:fade>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
    <div>
      <h2 class="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Daily Checklist</h2>
      <p class="text-slate-500 font-bold mt-2">Lộ trình đỗ số và báo cáo dành cho Chiến binh Hub</p>
    </div>

    <div class="w-full md:w-64">
      <div class="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">
        <span>Tiến độ ngày</span>
        <span class="text-indigo-600">{Math.round(progress)}%</span>
      </div>
      <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
        <div 
          class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-1000 ease-out"
          style="width: {progress}%"
        ></div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {#each tasks as task}
      <button 
        on:click={() => toggle(task.id)}
        class="group chart-card p-5 flex items-center gap-5 text-left transition-all hover:scale-[1.01]
          {task.done ? 'opacity-60 bg-slate-50 dark:bg-slate-900/50' : ''}"
      >
        <div class="relative">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center transition-all
            {task.done ? 'bg-emerald-500 text-white scale-90' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}">
            {#if task.done}
              <Icon name="check" size={5} />
            {:else}
              <Icon name="circle" size={5} />
            {/if}
          </div>
          {#if task.important && !task.done}
            <div class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>
          {/if}
        </div>

        <div class="flex-grow">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-tighter">
              {task.time}
            </span>
            {#if task.important}
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-rose-50 text-rose-500 uppercase tracking-tighter">
                Quan trọng
              </span>
            {/if}
          </div>
          <h3 class="text-sm font-bold {task.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}">
            {task.text}
          </h3>
        </div>

        {#if task.done}
          <div in:fade class="text-emerald-500 font-black text-[10px] uppercase">Hoàn tất</div>
        {/if}
      </button>
    {/each}
  </div>

  <div class="mt-12 p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center">
    <p class="text-slate-400 text-sm font-medium italic">
      "Sự kỷ luật trong việc đỗ số đúng giờ là chìa khóa để nắm bắt xu hướng thị trường."
    </p>
  </div>
</div>
