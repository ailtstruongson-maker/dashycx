
<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  export let name: string;
  export let size: number = 5;
  export let className: string = '';

  function refreshIcons() {
    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }

  onMount(refreshIcons);
  afterUpdate(refreshIcons);
</script>

<i data-lucide={name} class="w-{size} h-{size} {className}"></i>
