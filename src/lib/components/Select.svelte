<script lang="ts">
	interface Option {
		value: string | number | boolean;
		label: string;
	}

	interface Props {
		value?: string | number | boolean;
		options: Option[];
		placeholder?: string;
		label?: string;
		disabled?: boolean;
		required?: boolean;
		onChange?: (value: string | number | boolean) => void;
	}

	let { value = $bindable(), options, placeholder = '请选择', label, disabled = false, required = false, onChange }: Props = $props();

	let isOpen = $state(false);
	let selectedLabel = $derived(options.find(o => o.value === value)?.label || '');
	let container: HTMLElement;

	function toggle() {
		if (!disabled) isOpen = !isOpen;
	}

	function select(option: Option) {
		value = option.value;
		isOpen = false;
		onChange?.(value);
	}

	function onClickOutside(node: HTMLElement, callback: () => void) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && isOpen) {
				callback();
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<div class="w-full relative" use:onClickOutside={() => isOpen = false}>
	{#if label}
		<label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
			{label}
			{#if required}<span class="text-red-500 ml-1">*</span>{/if}
		</label>
	{/if}
	
	<button
		type="button"
		onclick={toggle}
		disabled={disabled}
		class="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-left transition-all
		{isOpen ? 'ring-2 ring-cyan-500/50 border-cyan-500' : ''}
		{disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-500/50'}
		"
	>
		{#if value !== undefined && value !== ''}
			<span class="text-slate-900 dark:text-slate-200 block truncate">{selectedLabel}</span>
		{:else}
			<span class="text-slate-400 dark:text-slate-500 block truncate">{placeholder}</span>
		{/if}
		
		<svg 
			class="w-5 h-5 text-slate-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
			fill="none" stroke="currentColor" viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-auto py-1 animate-in fade-in slide-in-from-top-2 duration-200">
			{#if options.length === 0}
				<div class="px-4 py-2 text-slate-400 text-sm text-center">无选项</div>
			{:else}
				{#each options as option}
					<button
						type="button"
						class="w-full px-4 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center justify-between
						{value === option.value ? 'bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400' : ''}
						"
						onclick={() => select(option)}
					>
						<span class="truncate">{option.label}</span>
						{#if value === option.value}
							<svg class="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
