<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		number?: string;
		clipped?: boolean;
		children: Snippet;
	}

	let { title, number, clipped = false, children }: Props = $props();
</script>

<div class="terminal-card" class:clipped-corner={clipped}>
	{#if title}
		<div class="terminal-card-header">
			<span class="terminal-card-title">{title}</span>
			{#if number}
				<span class="terminal-card-number">{number}</span>
			{/if}
		</div>
	{/if}
	<div class="terminal-card-body">
		{@render children()}
	</div>
</div>

<style>
	.terminal-card {
		border: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-secondary);
	}
	.terminal-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-panel);
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
	}
	.terminal-card-title {
		font-family: var(--font-label);
		font-size: var(--font-size-md);
		font-weight: 700;
		color: var(--color-accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}
	.terminal-card-number {
		font-family: var(--font-mono);
		font-size: var(--font-size-md);
		color: var(--color-text-muted);
	}
	.terminal-card-body {
		padding: var(--space-md);
	}
</style>
