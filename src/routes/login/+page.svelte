<script lang="ts">
	import { login } from '$lib/api';

	let phone = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await login(phone, password);
			// 存储 token
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('token', res.token);
				localStorage.setItem('user', JSON.stringify(res.user));
			}
			// 登录成功跳转到主页
			window.location.href = '/home';
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = '登录失败，请重试';
			}
		} finally {
			loading = false;
		}
	}
</script>

<section
	class="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-cyan-950 to-indigo-950 flex items-center justify-center px-6"
>
	<!-- 背景动画 -->
	<div class="absolute inset-0 pointer-events-none">
		<div
			class="absolute top-[-10%] left-[-10%] h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl animate-pulse"
		></div>
		<div
			class="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl animate-[pulse_7s_ease-in-out_infinite]"
		></div>
	</div>

	<div
		class="relative z-10 max-w-md w-full bg-slate-900/60 border border-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
	>
		<div class="text-center mb-8">
			<h1
				class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400"
			>
				欢迎回来
			</h1>
			<p class="text-slate-400 mt-2 text-sm">登录您的账号以继续打卡</p>
		</div>

		<form onsubmit={handleLogin} class="space-y-6">
			<div>
				<label for="phone" class="block text-sm font-medium text-slate-300 mb-2">手机号</label>
				<input
					type="tel"
					id="phone"
					required
					bind:value={phone}
					placeholder="请输入手机号"
					class="w-full rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none px-4 py-3 transition"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-slate-300 mb-2">密码</label>
				<input
					type="password"
					id="password"
					required
					bind:value={password}
					placeholder="请输入密码"
					class="w-full rounded-xl bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none px-4 py-3 transition"
				/>
			</div>

			{#if error}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					{error}
				</div>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<div
					class="relative rounded-xl bg-slate-900/0 group-hover:bg-white/5 transition-colors px-6 py-3.5"
				>
					<span class="relative flex items-center justify-center gap-2 font-semibold text-white">
						{#if loading}
							<svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
									fill="none"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							登录中...
						{:else}
							立即登录
						{/if}
					</span>
				</div>
			</button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-slate-500 text-sm">
				还没有账号？ <a href="#" class="text-cyan-400 hover:text-cyan-300 transition">联系管理员</a>
			</p>
		</div>
	</div>
</section>
