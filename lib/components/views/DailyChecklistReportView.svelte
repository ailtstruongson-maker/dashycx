
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { Icon } from '../common/Icon';
  import { getSetting, saveSetting } from '../../services/dbService';

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

  onMount(async () => {
    const saved = await getSetting<Task[]>('daily_checklist_v2');
    const lastUpdate = await getSetting<string>('daily_checklist_date');
    const today = new Date().toLocaleDateString();

    if (saved && lastUpdate === today) {
      tasks = saved;
    } else {
      await saveSetting('daily_checklist_date', today);
      await save();
    }
  });

  async function toggle(id: string) {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    await save();
  }

  async function save() {
    await saveSetting('daily_checklist_v2', tasks);
  }

  $: completedCount = tasks.filter(t => t.done).length;
  $: progress = (completedCount / tasks.length) * 100;
</script>

<div class="animate-fade-in" in:fade>
  <!-- UI remains same as before, but backed by IndexedDB -->
  <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
    <div>
      <h2 class="text-4xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Daily Checklist</h2>
      <p class="text-slate-500 font-bold mt-2">Dữ liệu được lưu trữ an toàn trong IndexedDB</p>
    </div>

    <div class="w-full md:w-64">
      <div class="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
        <span>Tiến độ ngày</span>
        <span class="text-indigo-600">{Math.round(progress)}%</span>
      </div>
      <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200">
        <div class="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style="width: {progress}%"></div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {#each tasks as task}
      <button on:click={() => toggle(task.id)} class="group chart-card p-5 flex items-center gap-5 text-left {task.done ? 'opacity-50' : ''}">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center {task.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}">
          <Icon name={task.done ? 'check' : 'circle'} size={5} />
        </div>
        <div>
          <span class="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{task.time}</span>
          <h3 class="text-sm font-bold {task.done ? 'line-through' : 'text-slate-700 dark:text-slate-200'}">{task.text}</h3>
        </div>
      </button>
    {/each}
  </div>
</div>
