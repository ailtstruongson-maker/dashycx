
<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { Icon } from './Icon';

  export let isOpen = false;
  export let title = "Cửa sổ";
  export let size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  export let onClose: () => void;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };
</script>

{#if isOpen}
  <!-- Overlay -->
  <div 
    class="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    on:click|self={onClose}
    in:fade={{ duration: 200 }}
    out:fade={{ duration: 200 }}
  >
    <!-- Modal Content -->
    <div 
      class="bg-white dark:bg-slate-900 w-full {sizeClasses[size]} rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
      in:fly={{ y: 20, duration: 300 }}
      out:fly={{ y: 20, duration: 200 }}
    >
      <!-- Header -->
      <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
        <button 
          on:click={onClose}
          class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Icon name="x" size={6} />
        </button>
      </div>

      <!-- Body -->
      <div class="flex-grow overflow-y-auto p-8 custom-scrollbar max-h-[80vh]">
        <slot />
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-3">
        <slot name="footer" />
      </div>
    </div>
  </div>
{/if}
