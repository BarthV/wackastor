<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="admin-section">
	<nav class="admin-nav">
		<a href="/admin" class="admin-nav-link">TABLEAU_DE_BORD</a>
		<a href="/admin/members" class="admin-nav-link">MEMBRES</a>
		<a href="/admin/sync" class="admin-nav-link">SYNCHRONISATION</a>
	</nav>
	{@render children()}
</div>

<style>
	.admin-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.admin-nav {
		display: flex;
		gap: var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.3);
		padding-bottom: 2px;
	}
	.admin-nav-link {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-text-secondary);
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		padding: 6px var(--space-md);
		border-bottom: 2px solid transparent;
	}
	.admin-nav-link:hover {
		color: var(--color-accent-gold);
		border-bottom-color: var(--color-accent-gold);
	}
</style>
