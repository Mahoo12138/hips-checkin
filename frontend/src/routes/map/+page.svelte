<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { goto } from '$app/navigation';
	import { toastStore } from '$lib/components/toast';

	interface LocationItem {
		id: string;
		name: string;
		address: string;
		lng: number;
		lat: number;
		isDefault: boolean;
	}

	let mapContainer: HTMLElement;
	let map: any = null;
	let marker: any = null;
	let geocoder: any = null;
	let autoComplete: any = null;

	let searchText = $state('');
	let searchResults = $state<any[]>([]);
	let showSearchResults = $state(false);
	
	let selectedLocation = $state<{
		lng: number;
		lat: number;
		address: string;
		name: string;
	} | null>(null);

	let savedLocations = $state<LocationItem[]>([]);
	let isEditMode = $state(false); // If true, we are selecting a point to add

	// Import/Export Modal
	let isIOModalOpen = $state(false);
	let ioJsonContent = $state('');
	let ioError = $state('');

	onMount(async () => {
		loadSavedLocations();
		try {
			await loadAMap();
			initMap();
		} catch (e) {
			console.error('Failed to load AMap', e);
			toastStore.error('地图加载失败，请检查网络或 Key 配置');
		}
	});

	onDestroy(() => {
		if (map) {
			map.destroy();
		}
	});

	function loadSavedLocations() {
		const stored = localStorage.getItem('locations');
		if (stored) {
			try {
				savedLocations = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse locations', e);
			}
		}
	}

	function saveLocationsToStorage() {
		localStorage.setItem('locations', JSON.stringify(savedLocations));
	}

	function loadAMap() {
		return new Promise((resolve, reject) => {
			if ((window as any).AMap) {
				resolve((window as any).AMap);
				return;
			}
			
			(window as any)._AMapSecurityConfig = {
				securityJsCode: import.meta.env.VITE_AMAP_CODE,
			};

			const script = document.createElement('script');
			script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY}&plugin=AMap.AutoComplete,AMap.PlaceSearch,AMap.Geocoder`;
			script.async = true;
			script.onload = () => resolve((window as any).AMap);
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	function initMap() {
		const AMap = (window as any).AMap;
		
		// Default center (Shanghai or user's default)
		let center = [121.473701, 31.230416];
		const defaultLoc = savedLocations.find(l => l.isDefault);
		if (defaultLoc) {
			center = [defaultLoc.lng, defaultLoc.lat];
		}

		map = new AMap.Map(mapContainer, {
			zoom: 13,
			center: center,
			viewMode: '3D'
		});

		geocoder = new AMap.Geocoder({
			city: '全国'
		});

		autoComplete = new AMap.AutoComplete({
			city: '全国'
		});

		map.on('click', (e: any) => {
			const lnglat = e.lnglat;
			updateMarker(lnglat.lng, lnglat.lat);
			getAddress([lnglat.lng, lnglat.lat]);
		});

		// If we have a default location, show it
		if (defaultLoc) {
			updateMarker(defaultLoc.lng, defaultLoc.lat);
			selectedLocation = {
				lng: defaultLoc.lng,
				lat: defaultLoc.lat,
				address: defaultLoc.address,
				name: defaultLoc.name
			};
		}
	}

	function updateMarker(lng: number, lat: number) {
		const AMap = (window as any).AMap;
		if (!marker) {
			marker = new AMap.Marker({
				position: [lng, lat],
				map: map
			});
		} else {
			marker.setPosition([lng, lat]);
		}
		map.setCenter([lng, lat]);
	}

	function getAddress(lnglat: [number, number]) {
		geocoder.getAddress(lnglat, (status: string, result: any) => {
			if (status === 'complete' && result.regeocode) {
				const address = result.regeocode.formattedAddress;
				// Try to find a POI or just use address
				const aois = result.regeocode.aois;
				const pois = result.regeocode.pois;
				let name = address;
				if (pois && pois.length > 0) {
					name = pois[0].name;
				} else if (aois && aois.length > 0) {
					name = aois[0].name;
				}

				selectedLocation = {
					lng: lnglat[0],
					lat: lnglat[1],
					address: address,
					name: name
				};
				
				// Update search text but don't trigger search
				searchText = name; 
			}
		});
	}

	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchText = val;
		if (!val) {
			searchResults = [];
			showSearchResults = false;
			return;
		}

		autoComplete.search(val, (status: string, result: any) => {
			if (status === 'complete' && result.tips) {
				searchResults = result.tips;
				showSearchResults = true;
			} else {
				searchResults = [];
				showSearchResults = false;
			}
		});
	}

	function selectSearchResult(tip: any) {
		if (tip.location) {
			updateMarker(tip.location.lng, tip.location.lat);
			selectedLocation = {
				lng: tip.location.lng,
				lat: tip.location.lat,
				address: tip.district + tip.address,
				name: tip.name
			};
			searchText = tip.name;
			showSearchResults = false;
		}
	}

	function addLocation() {
		if (!selectedLocation) return;
		
		// Check for duplicates (simple check by name or coordinates)
		const isDuplicate = savedLocations.some(l => 
			l.name === selectedLocation?.name || 
			(Math.abs(l.lng - selectedLocation!.lng) < 0.0001 && Math.abs(l.lat - selectedLocation!.lat) < 0.0001)
		);

		if (isDuplicate) {
			toastStore.warning('该地点已在列表中');
			return;
		}

		const newLoc: LocationItem = {
			id: Date.now().toString(),
			name: selectedLocation.name,
			address: selectedLocation.address,
			lng: selectedLocation.lng,
			lat: selectedLocation.lat,
			isDefault: savedLocations.length === 0 // First one is default
		};

		savedLocations = [...savedLocations, newLoc];
		saveLocationsToStorage();
		toastStore.success('地点已添加');
	}

	function deleteLocation(id: string) {
		if (!confirm('确定删除该地点吗？')) return;
		savedLocations = savedLocations.filter(l => l.id !== id);
		saveLocationsToStorage();
	}

	function setDefault(id: string) {
		savedLocations = savedLocations.map(l => ({
			...l,
			isDefault: l.id === id
		}));
		saveLocationsToStorage();
	}

	function openImportExport() {
		ioJsonContent = JSON.stringify(savedLocations, null, 2);
		ioError = '';
		isIOModalOpen = true;
	}

	function handleImport() {
		try {
			const data = JSON.parse(ioJsonContent);
			if (!Array.isArray(data)) throw new Error('格式必须是数组');
			// Simple validation
			data.forEach(item => {
				if (typeof item.lng !== 'number' || typeof item.lat !== 'number') {
					throw new Error('缺少经纬度信息');
				}
			});
			savedLocations = data;
			saveLocationsToStorage();
			isIOModalOpen = false;
			toastStore.success('导入成功');
		} catch (e: any) {
			ioError = '导入失败: ' + e.message;
		}
	}

	function handleBack() {
		goto('/home');
	}
</script>

<!-- Header -->
<div class="absolute top-0 left-0 w-full z-50">
	<Header 
		title="地点管理" 
		showBack={true}
		onBack={handleBack}
	/>
	<!-- Force back button visibility on desktop if needed, but Header component handles md:hidden. 
	     We need to override or modify Header. simpler to add a custom back button in extra slot or modify Header style.
	     Let's check Header again. It has `md:hidden`.
	     The user requested to fix "Map page has no back button on wide screen".
	     I will pass a custom extra slot to Header or just add a fixed back button here? 
	     Better: modify Header to accept a prop to force back button visibility or just render a custom one.
	     Actually, I'll just add a custom back button in the extra slot for desktop, or modify Header.
	     Let's look at Header usage. It takes `showBack` which toggles a button with `md:hidden`.
	     I can change Header to not use `md:hidden` if I pass a specific prop, or just hack it here by adding a button in `extra`.
	     But `extra` is on the right side.
	     
	     Let's modify Header.svelte first to allow forcing back button visibility.
	     Wait, I can't modify Header inside this tool call easily without context switch.
	     
	     Alternative: Add a floating back button on top left for desktop? No, inconsistent.
	     
	     Let's go with modifying Header.svelte in next step. For now, finish this file.
	-->
</div>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 flex flex-col h-screen">
	
	<!-- Top: Map & Search -->
	<div class="h-3/5 relative w-full">
		<div bind:this={mapContainer} class="w-full h-full"></div>
		
		<!-- Search Box -->
		<div class="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto">
			<div class="relative shadow-xl">
				<input
					type="text"
					value={searchText}
					oninput={handleSearchInput}
					placeholder="输入地址查找..."
					class="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-4 py-3 pr-12 focus:ring-2 focus:ring-cyan-500 outline-none"
				/>
				<div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
				</div>

				<!-- Search Results -->
				{#if showSearchResults && searchResults.length > 0}
					<div class="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-auto">
						{#each searchResults as result}
							<button
								onclick={() => selectSearchResult(result)}
								class="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
							>
								<div class="text-sm font-medium text-slate-800 dark:text-slate-200">{result.name}</div>
								<div class="text-xs text-slate-500 dark:text-slate-400 truncate">{result.district}{result.address}</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Add Button (Floating) -->
		{#if selectedLocation}
			<div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
				<button
					onclick={addLocation}
					class="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
					添加到列表
				</button>
			</div>
		{/if}
	</div>

	<!-- Bottom: List & Management -->
	<div class="flex-1 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 overflow-auto">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-bold text-slate-800 dark:text-slate-200">已存地点</h2>
			<button
				onclick={openImportExport}
				class="text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
			>
				导入/导出
			</button>
		</div>

		{#if savedLocations.length === 0}
			<div class="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
				暂无已存地点，请在地图上选择并添加
			</div>
		{:else}
			<div class="space-y-3">
				{#each savedLocations as loc (loc.id)}
					<div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
						<div class="min-w-0 flex-1 mr-4">
							<div class="flex items-center gap-2">
								<span class="font-medium text-slate-800 dark:text-slate-200 truncate">{loc.name}</span>
								{#if loc.isDefault}
									<span class="px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 font-bold">默认</span>
								{/if}
							</div>
							<div class="text-xs text-slate-500 dark:text-slate-400 truncate">{loc.address}</div>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							{#if !loc.isDefault}
								<button
									onclick={() => setDefault(loc.id)}
									class="p-2 text-slate-400 hover:text-cyan-600 transition"
									title="设为默认"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
								</button>
							{/if}
							<button
								onclick={() => deleteLocation(loc.id)}
								class="p-2 text-slate-400 hover:text-red-600 transition"
								title="删除"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<Modal
	isOpen={isIOModalOpen}
	title="导入/导出地点数据 (JSON)"
	onClose={() => isIOModalOpen = false}
>
	<div class="space-y-4">
		<textarea
			bind:value={ioJsonContent}
			rows="10"
			class="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono p-3 outline-none focus:border-cyan-500"
			placeholder="在此粘贴 JSON 数据..."
		></textarea>
		
		{#if ioError}
			<div class="text-red-500 text-sm">{ioError}</div>
		{/if}
	</div>
	
	{#snippet footer()}
		<div class="flex gap-2 w-full justify-end">
			<button
				onclick={() => {
					navigator.clipboard.writeText(ioJsonContent);
					toastStore.info('已复制到剪贴板');
				}}
				class="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
			>
				复制内容
			</button>
			<button
				onclick={handleImport}
				class="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-medium"
			>
				导入并保存
			</button>
		</div>
	{/snippet}
</Modal>
