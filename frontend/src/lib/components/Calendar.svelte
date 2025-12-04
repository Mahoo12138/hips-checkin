<script lang="ts">
	import { onMount } from 'svelte';
	import type { TimeSheetRecord } from '$lib/types';

	interface Props {
		selectedDate: string;
		timeSheetData: Record<string, TimeSheetRecord>; // Key: YYYY-MM-DD
		currentMonthStr: string; // YYYYMM 用于初始化日历月份
		onSelect: (date: string, record: TimeSheetRecord | null) => void;
	}

	let { selectedDate, timeSheetData, currentMonthStr, onSelect }: Props = $props();

	// 解析传入的月份字符串 YYYYMM
	const initialYear = parseInt(currentMonthStr.slice(0, 4));
	const initialMonth = parseInt(currentMonthStr.slice(4, 6)) - 1;

	let currentYear = $state(initialYear);
	let currentMonth = $state(initialMonth); // 0-11

	// 监听外部月份变化（如果有需要）
	$effect(() => {
		if (currentMonthStr) {
			const y = parseInt(currentMonthStr.slice(0, 4));
			const m = parseInt(currentMonthStr.slice(4, 6)) - 1;
			if (!isNaN(y) && !isNaN(m)) {
				currentYear = y;
				currentMonth = m;
			}
		}
	});

	// 计算当月天数和第一天是周几
	const daysInMonth = $derived(new Date(currentYear, currentMonth + 1, 0).getDate());
	const firstDayOfMonth = $derived(new Date(currentYear, currentMonth, 1).getDay());

	// 生成日历网格数据
	const calendarDays = $derived.by(() => {
		const days = [];
		// 填充上个月的空白
		for (let i = 0; i < firstDayOfMonth; i++) {
			days.push(null);
		}
		// 填充当月日期
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(i);
		}
		return days;
	});

	const monthNames = [
		'一月', '二月', '三月', '四月', '五月', '六月',
		'七月', '八月', '九月', '十月', '十一月', '十二月'
	];

	function formatDate(day: number): string {
		const m = String(currentMonth + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		return `${currentYear}-${m}-${d}`;
	}

	function handlePrevMonth() {
		if (currentMonth === 0) {
			currentYear--;
			currentMonth = 11;
		} else {
			currentMonth--;
		}
	}

	function handleNextMonth() {
		if (currentMonth === 11) {
			currentYear++;
			currentMonth = 0;
		} else {
			currentMonth++;
		}
	}

	function isToday(day: number): boolean {
		const today = new Date();
		return (
			day === today.getDate() &&
			currentMonth === today.getMonth() &&
			currentYear === today.getFullYear()
		);
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'Approved':
				return 'text-red-500 dark:text-red-400';
			case 'Draft':
				return 'text-blue-500 dark:text-blue-400';
			case 'Rejected':
				return 'text-purple-500 dark:text-purple-400';
			default:
				return 'text-slate-400 dark:text-slate-500';
		}
	}

	function getStatusBg(status: string): string {
		switch (status) {
			case 'Approved':
				return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
			case 'Draft':
				return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
			case 'Rejected':
				return 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20';
			default:
				return 'bg-slate-50 dark:bg-slate-800/30 border-transparent';
		}
	}
</script>

<div class="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg select-none transition-colors duration-300">
	<div class="flex items-center justify-between mb-4 px-2">
		<button
			onclick={handlePrevMonth}
			class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
		</button>
		<span class="text-lg font-bold text-slate-800 dark:text-slate-200">
			{currentYear}年 {monthNames[currentMonth]}
		</span>
		<button
			onclick={handleNextMonth}
			class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
		</button>
	</div>

	<div class="grid grid-cols-7 gap-1 text-center mb-2">
		{#each ['日', '一', '二', '三', '四', '五', '六'] as day}
			<div class="text-slate-400 dark:text-slate-500 text-xs font-medium py-2">{day}</div>
		{/each}
	</div>

	<div class="grid grid-cols-7 gap-x-1 gap-y-6 pb-4">
		{#each calendarDays as day}
			{#if day === null}
				<div class="flex flex-col items-center pointer-events-none" aria-hidden="true">
					<div class="w-8 h-8 md:w-9 md:h-9"></div>
				</div>
			{:else}
				{@const dateStr = formatDate(day)}
				{@const record = timeSheetData[dateStr]}
				{@const isSelected = dateStr === selectedDate}
				{@const isCurrentDay = isToday(day)}
				{@const isDisabled = record?.enable === 'N'}
				{@const status = record?.status || 'Empty'}
				{@const projName = record?.proj || ''}
				
				<button
					onclick={() => !isDisabled && onSelect(dateStr, record)}
					disabled={isDisabled}
					class="group relative flex flex-col items-center"
				>
					<!-- 日期圆圈 -->
					<div class="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all duration-200 border
						{isSelected ? 'ring-2 ring-cyan-500 z-10 bg-white dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
						{isCurrentDay && !isSelected ? 'ring-1 ring-cyan-500/30 dark:ring-cyan-500/50' : ''}
						{getStatusBg(status)}
						{isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer shadow-sm'}
					">
						<span class="text-sm font-medium {isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}">
							{day}
						</span>
					</div>
					
					<!-- 下方信息 -->
					<div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[140%] flex flex-col items-center gap-0.5 pointer-events-none z-20">
						{#if projName}
							<span class="text-[10px] leading-tight text-center truncate text-slate-500 dark:text-slate-400 w-full px-0.5 scale-90 origin-top">
								{projName}
							</span>
						{/if}
					</div>
				</button>
			{/if}
		{/each}
	</div>
</div>
