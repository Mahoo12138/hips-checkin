<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Calendar from '$lib/components/Calendar.svelte';
	import CheckInForm from '$lib/components/CheckInForm.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { CheckInRecord, TimeSheetRecord } from '$lib/data';
	import { MOCK_TIMESHEET_DATA } from '$lib/mock';
	import Header from '$lib/components/Header.svelte';

	let user = $state<{ name: string } | null>(null);
	// let records = $state<Record<string, CheckInRecord>>({}); // 旧逻辑，暂时保留或整合
	let timeSheetMap = $state<Record<string, TimeSheetRecord>>({}); // 新逻辑，存储后端返回的 TimeSheet
	let currentMonthStr = $state('202511'); // 默认月份，实际应根据日期或接口返回动态设置
	
	// Location State
	let savedLocations = $state<any[]>([]);
	let currentSimLocationId = $state('');

	// Modal State
	let isModalOpen = $state(false);
	let modalMessage = $state('');
	let modalTitle = $state('提示');

	// 初始化选中日期为 2025-11-19 (根据用户上下文) 或 当天
	// 为了演示 mock 数据效果，默认选中 2025-11-19
	let selectedDate = $state('2025-11-19'); 
	
	// 移动端视图控制：'calendar' | 'form'
	let mobileView = $state<'calendar' | 'form'>('calendar');

	onMount(() => {
		// 1. 用户校验
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		} else {
			// window.location.href = '/login';
			// return;
		}

		// 2. 加载 Mock 数据 (模拟 API 调用)
		loadMockData();

		// 3. 加载已存地点
		const locs = localStorage.getItem('locations');
		if (locs) {
			try {
				savedLocations = JSON.parse(locs);
				const def = savedLocations.find(l => l.isDefault);
				if (def) currentSimLocationId = def.id;
			} catch (e) {
				console.error(e);
			}
		}
	});

	function loadMockData() {
		// 将 List 转换为 Map，方便通过日期 key (YYYY-MM-DD) 查找
		const map: Record<string, TimeSheetRecord> = {};
		MOCK_TIMESHEET_DATA.timesheet.forEach(record => {
			// each_day 格式为 YYYYMMDD，需转换为 YYYY-MM-DD
			const dateStr = `${record.each_day.slice(0, 4)}-${record.each_day.slice(4, 6)}-${record.each_day.slice(6, 8)}`;
			map[dateStr] = record;
		});
		timeSheetMap = map;
		console.log(timeSheetMap)
		currentMonthStr = MOCK_TIMESHEET_DATA.month;
	}

	function logout() {
		localStorage.removeItem('access_token');
		localStorage.removeItem('user');
		window.location.href = '/login';
	}

	function handleDateSelect(date: string, record: TimeSheetRecord | null) {
		selectedDate = date;
		// 移动端选中日期后自动跳转到表单视图
		if (window.innerWidth < 768) {
			mobileView = 'form';
		}
	}

	// 转换 TimeSheetRecord 到 CheckInForm 需要的格式 (单向，用于回显)
	// 注意：真实场景下，后端 TimeSheetRecord 字段可能不全，这里做简单映射
	function mapToFormRecord(date: string, tsRecord?: TimeSheetRecord): CheckInRecord | null {
		if (!tsRecord) return null;
		// 如果是 Empty，视为空表单
		if (tsRecord.status === 'Empty') return null;

		// 这里简单 mock 一下回显数据，因为 TimeSheetRecord 缺少 location 等字段
		// 实际项目中可能需要再调详情接口，或者 TimeSheetRecord 本身包含更多信息
		return {
			id: 'mock-id',
			date: date,
			projectId: 'p6', // 默认映射到 "上海电氢智运机"
			location: '中国大陆',
			office: '上海办公室',
			hasFlyback: false,
			description: tsRecord.proj || '',
			submittedAt: Date.now()
		};
	}

	function handleSave(data: Omit<CheckInRecord, 'id' | 'submittedAt'>) {
		// 模拟保存：更新本地 state
		if (timeSheetMap[data.date]) {
			timeSheetMap[data.date].status = 'Draft';
			timeSheetMap[data.date].proj = '上海电氢智运机'; // 模拟更新项目名
		} else {
			// 新增
			timeSheetMap[data.date] = {
				status: 'Draft',
				lockflag: '0',
				each_day: data.date.replace(/-/g, ''),
				enable: 'Y',
				day: data.date.split('-')[2],
				proj: '上海电氢智运机',
				allowance: '0'
			};
		}

		modalTitle = '成功';
		modalMessage = '打卡提交成功 (Mock)！';
		isModalOpen = true;
		
		// 移动端保存后返回日历
		if (window.innerWidth < 768) {
			mobileView = 'calendar';
		}
	}

	function handleBackToCalendar() {
		mobileView = 'calendar';
	}
</script>

{#snippet headerExtra()}
	<button 
		onclick={() => goto('/map')}
		class="p-2 rounded-lg text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition hover:bg-slate-100 dark:hover:bg-slate-800"
		title="地图选点"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
	</button>
{/snippet}

<!-- Header 悬浮 -->
<div class="absolute top-0 left-0 w-full z-50">
	<Header 
		title={mobileView === 'form' ? '填写打卡' : '打卡助手'}
		user={user}
		showBack={mobileView === 'form'}
		onBack={handleBackToCalendar}
		onLogout={logout}
		extra={headerExtra}
	/>
</div>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex flex-col pt-16 transition-colors duration-300">
	<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
		<div class="flex flex-col md:flex-row gap-6 h-full">
			
			<!-- 左侧：日历视图 -->
			<div class="w-full md:w-1/2 lg:w-5/12 {mobileView === 'form' ? 'hidden md:block' : 'block'}">
				<Calendar 
					{selectedDate} 
					timeSheetData={timeSheetMap}
					{currentMonthStr}
					onSelect={handleDateSelect} 
				/>
				
				<!-- 移动端日历下方的提示 -->
				<div class="md:hidden mt-6 text-center text-slate-500 dark:text-slate-400 text-sm">
					点击日期进行打卡或查看详情
				</div>

				<!-- 图例 -->
				<div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-red-500 dark:bg-red-400"></span> Approved
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400"></span> Draft
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-purple-500 dark:bg-purple-400"></span> Rejected
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500"></span> Empty
					</div>
				</div>
			</div>

			<!-- 右侧：表单视图 -->
			<div class="w-full md:w-1/2 lg:w-7/12 {mobileView === 'calendar' ? 'hidden md:block' : 'block'} space-y-6">
				<!-- 模拟定位卡片 -->
				<div class="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg transition-colors duration-300">
					<h2 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyan-600 dark:text-cyan-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
						模拟定位
					</h2>
					{#if savedLocations.length === 0}
						<p class="text-slate-500 dark:text-slate-400 text-sm py-2 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
							没有添加地点，将使用默认位置
						</p>
					{:else}
						<Select
							bind:value={currentSimLocationId}
							options={savedLocations.map(l => ({ value: l.id, label: l.name }))}
							placeholder="请选择模拟位置"
						/>
					{/if}
				</div>

				<CheckInForm 
					date={selectedDate}
					initialData={mapToFormRecord(selectedDate, timeSheetMap[selectedDate])}
					onSave={handleSave}
				/>
			</div>
		</div>
	</main>
</div>

<Modal 
	isOpen={isModalOpen} 
	title={modalTitle}
	onClose={() => isModalOpen = false}
>
	<p class="text-slate-600 dark:text-slate-300">{modalMessage}</p>
	
	{#snippet footer()}
		<button 
			class="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium shadow-sm shadow-cyan-500/20"
			onclick={() => isModalOpen = false}
		>
			确定
		</button>
	{/snippet}
</Modal>
