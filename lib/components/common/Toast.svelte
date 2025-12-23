
<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { toastMessage } from '../../stores/dashboardStore';
  import { Icon } from './Icon';
</script>

{#if $toastMessage}
  <div 
    class="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
    in:fly={{ y: 50, duration: 400 }}
    out:fade
  >
    <div class="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl bg-white/90 dark:bg-slate-800/90
      {$toastMessage.type === 'success' ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600' : 
       $toastMessage.type === 'error' ? 'border-red-200 dark:border-red-800 text-red-600' : 
       'border-indigo-200 dark:border-indigo-800 text-indigo-600'}"
    >
      <Icon name={$toastMessage.type === 'success' ? 'check-circle' : 'alert-circle'} size={5} />
      <span class="text-sm font-black uppercase tracking-tight">{$toastMessage.message}</span>
    </div>
  </div>
{/if}
