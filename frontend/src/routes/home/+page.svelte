<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Calendar from '$lib/components/Calendar.svelte';
	import CheckInForm from '$lib/components/CheckInForm.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { CheckInRecord, TimeSheetRecord, DefaultProjectResponse } from '$lib/types';
	import { MOCK_TIMESHEET_DATA } from '$lib/mock';
	import Header from '$lib/components/Header.svelte';
	import { logout as apiLogout, fetchUserInfo, fetchUserDetail, fetchDefaultProject, fetchCalendar } from '$lib/api';
	import { userStore } from '$lib/stores';

	let user = $state<{ name: string } | null>(null);
	let timeSheetMap = $state<Record<string, TimeSheetRecord>>({});
	let currentMonthStr = $state(new Date().toISOString().slice(0, 7).replace('-', '')); // YYYYMM
	
	// Location State
	let savedLocations = $state<any[]>([]);
	let currentSimLocationId = $state('');

	// Modal State
	let isModalOpen = $state(false);
	let modalMessage = $state('');
	let modalTitle = $state('提示');

	// 初始化选中日期为当天
	let selectedDate = $state(new Date().toISOString().slice(0, 10)); 
	
	// 移动端视图控制：'calendar' | 'form'
	let mobileView = $state<'calendar' | 'form'>('calendar');

	// 默认项目信息
	let defaultProject = $state<DefaultProjectResponse | null>(null);

	onMount(async () => {
		// 初始化 userStore
		userStore.init();

		// 1. 检查登录状态并获取用户信息
		let currentUser: any;
		const unsub = userStore.subscribe(u => currentUser = u);
		unsub();

		if (!currentUser) {
			try {
				// 并行请求两个用户信息接口
				const [info, detail] = await Promise.all([
					fetchUserInfo().catch(e => console.warn('UserInfo failed', e)),
					fetchUserDetail()
				]);
				
				if (detail) {
					userStore.set(detail);
					currentUser = detail;
					user = { name: detail.realName };
				}
			} catch (e) {
				console.error('Failed to load user info', e);
				goto('/login');
				return;
			}
		} else {
			user = { name: currentUser.realName };
		}

		if (!currentUser || !currentUser.employeeNum) {
			console.error('Missing employeeNum');
			return;
		}

		// 2. 请求默认项目
		try {
			const proj = await fetchDefaultProject(currentUser.employeeNum);
			if (proj) {
				defaultProject = proj;
			}
		} catch (e) {
			console.error('Failed to fetch default project', e);
		}

		// 3. 请求日历数据
		try {
			const calendarData = await fetchCalendar(currentUser.employeeNum, currentMonthStr);
			loadCalendarData(calendarData.timesheet);
		} catch (e) {
			console.error('Failed to fetch calendar', e);
			// Fallback to mock if needed
			// loadMockData();
		}

		// 4. 加载已存地点
		const locs = localStorage.getItem('locations');
		if (locs) {
			try {
				savedLocations = JSON.parse(locs);
				const def = savedLocations.find((l: any) => l.isDefault);
				if (def) currentSimLocationId = def.id;
			} catch (e) {
				console.error(e);
			}
		}
	});

	function loadCalendarData(timesheet: TimeSheetRecord[]) {
		const map: Record<string, TimeSheetRecord> = {};
		timesheet.forEach(record => {
			// each_day 格式为 YYYYMMDD，需转换为 YYYY-MM-DD
			const dateStr = `${record.each_day.slice(0, 4)}-${record.each_day.slice(4, 6)}-${record.each_day.slice(6, 8)}`;
			map[dateStr] = record;
		});
		timeSheetMap = map;
	}

	function loadMockData() {
		const map: Record<string, TimeSheetRecord> = {};
		MOCK_TIMESHEET_DATA.timesheet.forEach(record => {
			const dateStr = `${record.each_day.slice(0, 4)}-${record.each_day.slice(4, 6)}-${record.each_day.slice(6, 8)}`;
			map[dateStr] = record;
		});
		timeSheetMap = map;
		currentMonthStr = MOCK_TIMESHEET_DATA.month;
	}

	async function logout() {
		await apiLogout();
		localStorage.removeItem('user');
		goto('/login');
	}

	function handleDateSelect(date: string, record: TimeSheetRecord | null) {
		selectedDate = date;
		if (window.innerWidth < 768) {
			mobileView = 'form';
		}
	}

	// 转换 TimeSheetRecord 到 CheckInForm 需要的格式
	function mapToFormRecord(date: string, tsRecord?: TimeSheetRecord): CheckInRecord | null {
		if (!tsRecord) return null;
		// 如果是 Empty，视为空表单
		if (tsRecord.status === 'Empty') return null;

		// TimeSheetRecord 缺少 location 等字段，这里做简单映射
		// 如果是已提交的记录，理想情况下应该再请求详情，这里暂时只回显项目名
		return {
			id: 'mock-id-' + date,
			date: date,
			projectId: tsRecord.proj, // 注意：这里可能是项目名而不是ID，Select可能匹配不上
			location: '',
			office: '',
			hasFlyback: false,
			description: '',
			status: tsRecord.status === 'Submitted' || tsRecord.status === 'Approved' ? 'submitted' : 'draft'
		};
	}

	function handleFormSubmit(data: Omit<CheckInRecord, 'id' | 'submittedAt'>) {
		console.log('Submitting:', data);
		// TODO: Implement submit API
		
		// Optimistic update
		const newRecord: TimeSheetRecord = {
			status: 'Submitted',
			lockflag: '0',
			each_day: data.date.replace(/-/g, ''),
			enable: 'Y',
			day: data.date.slice(8, 10),
			proj: data.projectId, // This should be name, but we only have ID here. Ideally update from response.
			allowance: '0'
		};
		
		timeSheetMap = {
			...timeSheetMap,
			[data.date]: newRecord
		};
		
		modalTitle = '成功';
		modalMessage = '打卡提交成功';
		isModalOpen = true;
	}

	function handleViewChange(view: 'calendar' | 'form') {
		mobileView = view;
	}
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
	<Header 
		user={{ name: user?.name || 'User' }} 
		onLogout={logout}
	/>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<div class="flex flex-col lg:flex-row gap-8">
			<!-- Calendar Section -->
			<div class="w-full lg:w-7/12 xl:w-2/3 {mobileView === 'form' ? 'hidden lg:block' : ''}">
				<Calendar 
					timeSheetData={timeSheetMap} 
					{selectedDate} 
					{currentMonthStr}
					onSelect={handleDateSelect} 
				/>
			</div>

			<!-- Form Section -->
			<div class="w-full lg:w-5/12 xl:w-1/3 {mobileView === 'calendar' ? 'hidden lg:block' : ''}">
				<div class="sticky top-24 z-10">
					<div class="lg:hidden mb-4">
						<button 
							onclick={() => handleViewChange('calendar')}
							class="flex items-center text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
						>
							<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
							</svg>
							返回日历
						</button>
					</div>
					
					<CheckInForm 
						record={mapToFormRecord(selectedDate, timeSheetMap[selectedDate])}
						date={selectedDate}
						defaultProject={defaultProject}
						onSubmit={handleFormSubmit}
						onBack={mobileView === 'form' ? () => handleViewChange('calendar') : undefined}
					/>
				</div>
			</div>
		</div>
	</main>

	<Modal
		isOpen={isModalOpen}
		title={modalTitle}
		onClose={() => isModalOpen = false}
	>
		<p class="text-slate-600 dark:text-slate-300">{modalMessage}</p>
	</Modal>
</div>
