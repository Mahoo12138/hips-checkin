<script lang="ts">
	import { onMount } from 'svelte';

	let user = $state<{ name: string } | null>(null);

	onMount(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			user = JSON.parse(userData);
		} else {
			// 未登录跳转回登录页
			window.location.href = '/login';
		}
	});

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.location.href = '/login';
	}
</script>

<section class="min-h-screen bg-slate-950 text-slate-100 p-6">
	<header class="flex justify-between items-center mb-8">
		<h1
			class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400"
		>
			打卡助手
		</h1>
		<button
			onclick={logout}
			class="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-sm"
		>
			退出登录
		</button>
	</header>

	<main class="max-w-lg mx-auto">
		<div class="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
			<h2 class="text-xl font-semibold mb-4">欢迎, {user?.name || '用户'}</h2>
			<p class="text-slate-400 mb-6">这是您的主页，打卡功能即将上线。</p>

			<div
				class="h-32 rounded-xl bg-slate-800/50 border border-dashed border-slate-700 flex items-center justify-center text-slate-500"
			>
				打卡地图 / 记录区域占位
			</div>
		</div>
	</main>
</section>
