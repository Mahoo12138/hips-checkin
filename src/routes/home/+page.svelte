<script lang="ts">
	import { onMount } from 'svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import CheckInForm from '$lib/components/CheckInForm.svelte';
	import type { CheckInRecord, TimeSheetRecord } from '$lib/data';
	import { MOCK_TIMESHEET_DATA } from '$lib/mock';

	let user = $state<{ name: string } | null>(null);
	// let records = $state<Record<string, CheckInRecord>>({}); // 旧逻辑，暂时保留或整合
	let timeSheetMap = $state<Record<string, TimeSheetRecord>>({}); // 新逻辑，存储后端返回的 TimeSheet
	let currentMonthStr = $state('202511'); // 默认月份，实际应根据日期或接口返回动态设置
	
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
			return;
		}

		// 2. 加载 Mock 数据 (模拟 API 调用)
		loadMockData();
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
		currentMonthStr = MOCK_TIMESHEET_DATA.month;
	}

	function logout() {
		localStorage.removeItem('token');
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

		alert('打卡提交成功 (Mock)！');
		
		// 移动端保存后返回日历
		if (window.innerWidth < 768) {
			mobileView = 'calendar';
		}
	}

	function handleBackToCalendar() {
		mobileView = 'calendar';
	}
</script>

<div class="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
	<!-- 顶部导航栏 -->
	<header class="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<!-- 移动端表单视图下的返回按钮 -->
				<button 
					class="md:hidden p-1 -ml-1 rounded-lg text-slate-400 hover:text-white {mobileView === 'calendar' ? 'hidden' : ''}"
					onclick={handleBackToCalendar}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				</button>
				
				<h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 truncate">
					{mobileView === 'form' ? '填写打卡' : '打卡助手'}
				</h1>
			</div>

			<div class="flex items-center gap-4">
				<span class="hidden sm:block text-sm text-slate-400">欢迎, {user?.name || '...'}</span>
				<button
					onclick={logout}
					class="text-sm px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
				>
					退出
				</button>
			</div>
		</div>
	</header>

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
				<div class="md:hidden mt-6 text-center text-slate-500 text-sm">
					点击日期进行打卡或查看详情
				</div>

				<!-- 图例 -->
				<div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-red-400"></span> Approved
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Draft
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Rejected
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Empty
					</div>
				</div>
			</div>

			<!-- 右侧：表单视图 -->
			<div class="w-full md:w-1/2 lg:w-7/12 {mobileView === 'calendar' ? 'hidden md:block' : 'block'}">
				<CheckInForm 
					date={selectedDate}
					initialData={mapToFormRecord(selectedDate, timeSheetMap[selectedDate])}
					onSave={handleSave}
				/>
			</div>
		</div>
	</main>
</div>
