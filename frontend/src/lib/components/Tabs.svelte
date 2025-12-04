<script lang="ts">
	interface Props {
		items: { id: string; label: string }[];
		activeId: string;
		onChange: (id: string) => void;
	}

	let { items, activeId, onChange }: Props = $props();
</script>

<div class="flex space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
	{#each items as item}
		<button
			type="button"
			onclick={() => onChange(item.id)}
			class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
			{activeId === item.id
				? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm'
				: 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}"
		>
			{item.label}
		</button>
	{/each}
</div>
