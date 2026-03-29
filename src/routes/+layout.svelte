<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';

	interface Props {
		data: { user: { id: string; username: string; avatar: string | null } | null };
		children: Snippet;
	}

	let { data, children }: Props = $props();
</script>

<div class="terminal-shell">
	<header class="terminal-header">
		<div class="header-hatching"></div>
		<div class="header-content">
			<span class="header-title">WACKASTOR</span>
			<span class="header-module">// INVENTAIRE CORPORATION</span>
		</div>
		<div class="header-right">
			{#if !data.user}
				<a href="/login" class="header-login">
					<span class="material-symbols-outlined login-icon">login</span>
					<span class="login-label">CONNEXION</span>
				</a>
			{/if}
		</div>
		<div class="header-hatching"></div>
	</header>

	<main class="terminal-main">
		{@render children()}
	</main>
</div>

<style>
	.terminal-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.terminal-header {
		display: flex;
		align-items: stretch;
		background: var(--color-bg-secondary);
		border-bottom: 1px solid var(--color-border);
	}
	.header-hatching {
		flex: 1;
		min-width: 40px;
		background: repeating-linear-gradient(
			-45deg,
			transparent,
			transparent 2px,
			var(--color-border) 2px,
			var(--color-border) 4px
		);
		opacity: 0.4;
	}
	.header-content {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		padding: var(--space-sm) var(--space-lg);
		white-space: nowrap;
	}
	.header-right {
		display: flex;
		align-items: center;
		padding: 0 var(--space-md);
	}
	.header-login {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 6px 14px;
		border: 1px solid var(--color-accent-gold);
		color: var(--color-accent-gold);
		background: transparent;
		text-decoration: none;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		white-space: nowrap;
	}
	.header-login:hover {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
	}
	.login-icon {
		font-size: 16px;
	}
	.login-label {
		line-height: 1;
	}
	.header-title {
		font-family: var(--font-condensed);
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--color-accent-orange);
		letter-spacing: 0.15em;
	}
	.header-module {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
	.terminal-main {
		flex: 1;
		padding: var(--space-lg);
	}
</style>
