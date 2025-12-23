<script lang="ts">
  import { currentView, ViewType } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';
  import { fade, fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  let isCollapsed = false;
  let isMobileOpen = false;

  const menuItems: { id: ViewType; label: string; icon: string; color: string }[] = [
    { id: 'dashboard', label: 'Báo cáo YCX', icon: 'layout-dashboard', color: 'indigo' },
    { id: 'efficiency', label: 'Hiệu suất NV', icon: 'trending-up', color: 'emerald' },
    { id: 'tax', label: 'Thuế TNCN', icon: 'calculator', color: 'rose' },
    { id: 'coupon', label: 'Đổi Coupon', icon: 'ticket', color: 'amber' },
    { id: 'shift', label: 'Phân ca tuần', icon: 'calendar-days', color: 'blue' },
    { id: 'checklist', label: 'Checklist', icon: 'clipboard-check', color: 'violet' }
  ];

  function setView(id: ViewType) {
    currentView.set(id);
    isMobileOpen = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMount(() => {
    // Check screen size for initial collapse
    if (window.innerWidth < 1280) isCollapsed = true;
  });
</script>

<!-- Mobile Overlay -->
{#if isMobileOpen}
  <div 
    class="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm md:hidden"
    on:click={() => isMobileOpen = false}
    transition:fade
  ></div>
{/if}

<div class="flex h-screen w-full">
  <!-- Sidebar -->
  <aside 
    class="fixed left-0 top-0 h-full z-[110] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-500 ease-in-out shadow-2xl flex flex-col
      {isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
      {isCollapsed ? 'md:w-20' : 'md:w-72'}"
  >
    <!-- Logo Section -->
    <div class="p-6 mb-6 flex items-center gap-3 overflow-hidden">
      <div class="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none shrink-0">
        <Icon name="zap" size={6} />
      </div>
      {#if !isCollapsed}
        <div in:fade={{ delay: 100 }}>
          <h2 class="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Hub <span class="text-indigo-600">2.0</span></h2>
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">BI Intelligence</p>
        </div>
      {/if}
    </div>

    <!-- Navigation -->
    <nav class="flex-grow px-3 space-y-1.5 custom-scrollbar overflow-y-auto">
      {#each menuItems as item}
        <button 
          on:click={() => setView(item.id)}
          class="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative
            { $currentView === item.id 
              ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 dark:shadow-none font-bold' 
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 font-medium' 
            }"
        >
          <div class="shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
            <Icon name={item.icon} size={5} className={$currentView === item.id ? 'text-white' : `text-${item.color}-500`} />
          </div>
          
          {#if !isCollapsed}
            <span in:fade={{ duration: 150 }} class="text-sm tracking-tight whitespace-nowrap">{item.label}</span>
          {/if}

          {#if $currentView === item.id && !isCollapsed}
            <div in:fly={{ x: 10 }} class="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"></div>
          {/if}
        </button>
      {/each}
    </nav>

    <!-- Footer Actions -->
    <div class="p-4 mt-auto border-t border-slate-50 dark:border-slate-800 space-y-4">
      <button 
        on:click={() => isCollapsed = !isCollapsed}
        class="hidden md:flex w-full items-center gap-4 p-3 rounded-2xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
      >
        <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size={5} />
        {#if !isCollapsed}
          <span in:fade class="text-sm font-bold">Thu gọn menu</span>
        {/if}
      </button>

      <div class="flex items-center gap-3 {isCollapsed ? 'justify-center' : 'px-3 py-2'}">
        <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-inner">
          <Icon name="user" size={5} className="text-slate-400" />
        </div>
        {#if !isCollapsed}
          <div in:fade class="overflow-hidden">
            <p class="text-[11px] font-black text-slate-800 dark:text-white truncate uppercase">Admin Hub</p>
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Certified 2025</p>
          </div>
        {/if}
      </div>
    </div>
  </aside>

  <!-- Mobile Toggle Button -->
  <button 
    on:click={() => isMobileOpen = true}
    class="md:hidden fixed bottom-6 left-6 z-[120] w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
  >
    <Icon name="menu" size={6} />
  </button>

  <!-- Content Slot Area -->
  <main 
    class="flex-grow min-h-screen transition-all duration-500 ease-in-out
      {isCollapsed ? 'md:ml-20' : 'md:ml-72'}"
  >
    <slot />
  </main>
</div>

<style>
  :global(.custom-scrollbar::-webkit-scrollbar) {
    width: 0px;
  }
</style>