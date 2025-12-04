// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		go: any;
		runtime: any;
	}

	interface ImportMeta {
		env: Record<string, string>;
	}
}

declare module '$lib/assets/favicon.svg' {
	const content: string;
	export default content;
}

export {};
