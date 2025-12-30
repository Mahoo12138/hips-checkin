<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Calendar from '$lib/components/Calendar.svelte';
	import CheckInForm from '$lib/components/CheckInForm.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import type { CheckInRecord, TimeSheetRecord, DefaultProjectResponse, CheckInSubmitData } from '$lib/types';
	import { MOCK_TIMESHEET_DATA } from '$lib/mock';
	import Header from '$lib/components/Header.svelte';
	import { logout as apiLogout, fetchUserInfo, fetchUserDetail, fetchDefaultProject, fetchCalendar, saveTimeSheet } from '$lib/api';
	import { userStore } from '$lib/stores';

	let user = $state<{ name: string } | null>(null);
	let employeeNum = $state('');
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
					employeeNum = detail.employeeNum || '';
				}
			} catch (e) {
				console.error('Failed to load user info', e);
				goto('/login');
				return;
			}
		} else {
			user = { name: currentUser.realName };
			employeeNum = currentUser.employeeNum || '';
		}

		if (!currentUser || !currentUser.employeeNum) {
			console.error('Missing employeeNum');
			return;
		}

		// 2. 请求默认项目
		try {
			const proj = await fetchDefaultProject(currentUser.employeeNum);
			console.log('Fetched default project:', proj);
			if (proj && proj.every_day) {
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

	async function handleFormSubmit(data: CheckInSubmitData) {
		console.log('Submitting:', data);
		
		try {
			// Find simulated location if any
			const simLoc = savedLocations.find(l => l.id === currentSimLocationId);
			
			const res = await saveTimeSheet({
				employeeNum: employeeNum,
				date: data.date,
				projectId: data.projectId,
				description: data.description,
				addressId: data.locationId,
				flybackId: data.flybackId,
				addressDetail: data.officeName, // Use Office Name as Address Detail for now, or construct it
				officeId: data.officeId,
				longitude: simLoc?.lng?.toString(),
				latitude: simLoc?.lat?.toString(),
				// equipmentNumber: ??? // Optional, defaults to mock
			});

			if (res.status === 'S' || res.refresh_status === 'S') {
				// Refresh calendar data from response
				if (res.refresh_timesheet && res.refresh_timesheet.timesheet) {
					loadCalendarData(res.refresh_timesheet.timesheet);
				} else {
					// Fallback if no timesheet in response, maybe fetch calendar again?
					// Or just do optimistic update as before?
					// Let's re-fetch calendar to be safe if response is missing data
					try {
						const calendarData = await fetchCalendar(employeeNum, currentMonthStr);
						loadCalendarData(calendarData.timesheet);
					} catch (e) {
						console.warn('Failed to refresh calendar after submit', e);
					}
				}

				modalTitle = '成功';
				modalMessage = '打卡提交成功';
				isModalOpen = true;
			} else {
				throw new Error(res.message || res.refresh_message || '提交失败');
			}
		} catch (e: any) {
			console.error('Submit failed:', e);
			modalTitle = '错误';
			modalMessage = e.message || '提交失败，请重试';
			isModalOpen = true;
		}
	}

	function handleViewChange(view: 'calendar' | 'form') {
		mobileView = view;
	}

	async function handleMonthChange(year: number, month: number) {
		const m = String(month + 1).padStart(2, '0');
		const monthStr = `${year}${m}`;
		currentMonthStr = monthStr;
		
		try {
			const calendarData = await fetchCalendar(employeeNum, monthStr);
			loadCalendarData(calendarData.timesheet);
		} catch (e) {
			console.error('Failed to fetch calendar for month:', monthStr, e);
		}
	}
</script>

{#snippet headerExtra()}
	<button
		onclick={() => goto('/map')}
		class="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition-all"
		title="位置管理"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
	</button>
{/snippet}

<div class="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
	<Header 
		user={{ name: user?.name || 'User' }} 
		onLogout={logout}
		extra={headerExtra}
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
					onMonthChange={handleMonthChange}
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

					<!-- Location Selection Card -->
					<div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/60 mb-6 transition-all duration-300">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
								模拟位置
							</h2>
							<button 
								onclick={() => goto('/map')} 
								class="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded transition-colors"
							>
								管理
							</button>
						</div>
						
						{#if savedLocations.length === 0}
							<div class="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
								<p class="text-sm text-slate-500 dark:text-slate-400 mb-2">暂无模拟位置</p>
								<button 
									onclick={() => goto('/map')}
									class="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
								>
									去添加位置
								</button>
							</div>
						{:else}
							<div class="grid gap-3">
								{#each savedLocations as loc}
									<button 
										class="w-full text-left p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden
										{currentSimLocationId === loc.id 
											? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-500/20' 
											: 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800'}"
										onclick={() => currentSimLocationId = loc.id}
									>
										<div class="flex items-start justify-between">
											<div class="flex-1 min-w-0 mr-2">
												<div class="font-medium text-sm text-slate-900 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
													{loc.name}
												</div>
												<div class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
													{loc.address}
												</div>
											</div>
											{#if currentSimLocationId === loc.id}
												<div class="flex-shrink-0 text-indigo-500">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
												</div>
											{/if}
										</div>
									</button>
								{/each}
							</div>
						{/if}
					</div>
					
					<CheckInForm 
						record={null}
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
