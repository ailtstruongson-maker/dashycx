
<script lang="ts">
  import { currentView, ViewType } from '../../stores/dashboardStore';
  import { Icon } from '../common/Icon';
  import { fade, fly, slide } from 'svelte/transition';

  let isCollapsed = false;
  let isMobileMenuOpen = false;

  const menuItems: { id: ViewType; label: string; icon: string; color: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', color: 'indigo' },
    { id: 'tax', label: 'Tính thuế TNCN', icon: 'calculator', color: 'rose' },
    { id: 'coupon', label: 'Chuyển Coupon', icon: 'ticket', color: 'amber' },
    { id: 'shift', label: 'Phân ca tuần', icon: 'calendar-range', color: 'blue' },
    { id: 'efficiency', label: 'Thi đua & Hiệu suất', icon: 'trending-up', color: 'emerald' },
    { id: 'checklist', label: 'Checklist báo cáo', icon: 'clipboard-check', color: 'violet' }
  ];

  function setView(id: ViewType) {
    currentView.set(id);
    isMobileMenuOpen = false;
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }
</script>

<!-- Mobile Menu Button (Floating) -->
<div class="md:hidden fixed bottom-6 left-6 z-[110]">
  <button 
    on:click={toggleMobileMenu}
    class="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-transform active:scale-95"
  >
    <Icon name={isMobileMenuOpen ? 'x' : 'menu'} size={6} />
  </button>
</div>

<!-- Sidebar Container -->
<aside 
  class="fixed left-0 top-0 h-screen z-[100] transition-all duration-500 ease-in-out border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
    {isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
    {isCollapsed ? 'md:w-20' : 'md:w-72'}"
>
  <div class="flex flex-col h-full p-4 overflow-hidden">
    <!-- Logo area -->
    <div class="flex items-center gap-3 mb-10 px-2">
      <div class="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none shrink-0">
        <Icon name="zap" size={6} />
      </div>
      {#if !isCollapsed || isMobileMenuOpen}
        <div in:fade={{ duration: 200 }}>
          <h2 class="text-xl font-black text-slate-800 dark:text-white tracking-tight">HUB <span class="text-indigo-600">2.0</span></h2>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence Platform</p>
        </div>
      {/if}
    </div>

    <!-- Navigation menu -->
    <nav class="flex-grow space-y-2 overflow-y-auto custom-scrollbar pr-2">
      {#each menuItems as item}
        <button 
          on:click={() => setView(item.id)}
          class="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group
            { $currentView === item.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600' 
            }"
        >
          <div class="shrink-0 flex items-center justify-center">
            <Icon name={item.icon} size={5} className={$currentView === item.id ? 'text-white' : `text-${item.color}-500`} />
          </div>
          {#if !isCollapsed || isMobileMenuOpen}
            <span in:fade={{ duration: 150 }} class="text-sm font-bold tracking-tight whitespace-nowrap">{item.label}</span>
          {/if}
          
          {#if (!isCollapsed || isMobileMenuOpen) && $currentView === item.id}
             <div in:fly={{ x: 10 }} class="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-60"></div>
          {/if}
        </button>
      {/each}
    </nav>

    <!-- Bottom Actions -->
    <div class="mt-auto space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
      <button 
        on:click={() => isCollapsed = !isCollapsed}
        class="hidden md:flex w-full items-center gap-4 p-3.5 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size={5} />
        {#if !isCollapsed}
          <span in:fade class="text-sm font-bold">Thu gọn menu</span>
        {/if}
      </button>
      
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
          <Icon name="user" size={5} className="text-slate-400" />
        </div>
        {#if !isCollapsed || isMobileMenuOpen}
          <div in:fade class="overflow-hidden">
            <p class="text-xs font-black text-slate-800 dark:text-white truncate">Administrator</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Bi Analyst 2025</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</aside>

<!-- Overlay for Mobile -->
{#if isMobileMenuOpen}
  <div 
    on:click={() => isMobileMenuOpen = false}
    class="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90]"
    transition:fade={{ duration: 200 }}
  ></div>
{/if}

<!-- Main Content Area Wrapper -->
<div 
  class="transition-all duration-500 ease-in-out 
    {isCollapsed ? 'md:pl-20' : 'md:pl-72'} 
    w-full min-h-screen"
>
  <slot />
</div>

<style>
  aside {
    box-shadow: 10px 0 30px -10px rgba(0,0,0,0.03);
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 0px;
  }
</style>
