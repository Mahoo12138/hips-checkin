<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';

	let skipNext = $state(false);
	const isTest = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

	onMount(() => {
		const flag = typeof localStorage !== 'undefined' ? localStorage.getItem('skipWelcome') : null;
		if (flag === '1' && !isTest) {
			window.location.assign('/login');
		}
	});

	function start() {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('skipWelcome', skipNext ? '1' : '0');
		}
		window.location.assign('/login');
	}
</script>

<!-- Header 悬浮 -->
<div class="absolute top-0 left-0 w-full z-50">
	<Header title="TS 打卡助手" />
</div>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-cyan-500/30 relative overflow-hidden transition-colors duration-300">
	<!-- 动态背景装饰 -->
	<div class="absolute inset-0 pointer-events-none">
		<div
			class="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-cyan-200/20 dark:bg-cyan-900/10 rounded-full blur-[120px] animate-pulse"
		></div>
		<div
			class="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite]"
		></div>
		<div
			class="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-[100px] animate-[pulse_10s_ease-in-out_infinite]"
		></div>
	</div>

	<!-- 内容区域增加顶部内边距，避免被 Header 遮挡 -->
	<div class="relative z-10 container mx-auto px-6 pt-32 pb-20 max-w-6xl">
		<!-- Hero 区域 -->
		<div class="text-center mb-24 space-y-8">
			<div
				class="inline-flex items-center justify-center p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 backdrop-blur-md shadow-2xl mb-6 ring-1 ring-slate-900/5 dark:ring-white/5"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-10 h-10 text-cyan-600 dark:text-cyan-400"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 2v20M2 12h20" />
					<path d="m12 2 4 4-4-4-4 4 4-4" opacity="0.5" />
					<path d="m2 12 4-4-4 4 4 4-4-4" opacity="0.5" />
					<path d="m22 12-4-4 4 4-4 4 4-4" opacity="0.5" />
					<path d="m12 22 4-4-4 4-4 4 4-4" opacity="0.5" />
				</svg>
			</div>
			
			<h1 class="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white drop-shadow-lg">
				TS <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-400 dark:via-blue-500 dark:to-indigo-500">打卡助手</span>
			</h1>
			
			<p class="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
				专为极客打造的打卡模拟工具。
				<span class="block md:inline text-slate-500 dark:text-slate-500">无需后台，完全本地化运行，安全、自由、可定制。</span>
			</p>

			<div class="flex flex-col items-center gap-8 pt-6">
				<button
					onclick={start}
					class="group relative px-10 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
				>
					<div
						class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
					></div>
					<span class="relative z-10 flex items-center gap-3">
						立即开启
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-5 h-5 group-hover:translate-x-1 transition-transform"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
						</svg>
					</span>
				</button>

				<label
					class="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group select-none"
				>
					<div class="relative">
						<input
							type="checkbox"
							class="peer sr-only"
							checked={skipNext}
							onchange={(e) => (skipNext = e.currentTarget.checked)}
						/>
						<div
							class="w-5 h-5 border-2 border-slate-400 dark:border-slate-600 rounded transition-all peer-checked:bg-cyan-500 peer-checked:border-cyan-500 group-hover:border-slate-500"
						></div>
						<svg
							class="w-3.5 h-3.5 text-white dark:text-slate-950 absolute top-[3px] left-[3px] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="4"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</div>
					下次不再展示，直接进入
				</label>
			</div>
		</div>

		<!-- 特性介绍 -->
		<div class="grid md:grid-cols-3 gap-6 lg:gap-8">
			<!-- Feature 1 -->
			<div
				class="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all duration-300 group hover:-translate-y-1 shadow-sm hover:shadow-md"
			>
				<div
					class="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-7 h-7"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
						<circle cx="12" cy="10" r="3" />
					</svg>
				</div>
				<h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">自由模拟</h3>
				<p class="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
					支持自定义打卡<span class="text-slate-700 dark:text-slate-300 font-medium">地点</span>与<span class="text-slate-700 dark:text-slate-300 font-medium">设备信息</span>，完美还原真实环境，让每一次打卡都精准无误。
				</p>
			</div>

			<!-- Feature 2 -->
			<div
				class="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-300 group hover:-translate-y-1 shadow-sm hover:shadow-md"
			>
				<div
					class="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-7 h-7"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
				<h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">隐私至上</h3>
				<p class="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
					<span class="text-slate-700 dark:text-slate-300 font-medium">无服务端后台</span>，所有数据均存储在您的本地设备中。您的行踪与记录，只有您自己知道。
				</p>
			</div>

			<!-- Feature 3 -->
			<div
				class="bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-8 rounded-3xl backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/60 hover:border-purple-500/30 transition-all duration-300 group hover:-translate-y-1 shadow-sm hover:shadow-md"
			>
				<div
					class="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-7 h-7"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" x2="12" y1="15" y2="3" />
					</svg>
				</div>
				<h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">配置导出</h3>
				<p class="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
					一键<span class="text-slate-700 dark:text-slate-300 font-medium">导入导出</span>打卡配置与历史记录。轻松迁移数据，备份无忧，管理更加高效便捷。
				</p>
			</div>
		</div>
	</div>
</div>
