<script lang="ts">
	interface Props {
		title: string;
		number?: string;
	}

	let { title, number }: Props = $props();
</script>

<div class="section-header">
	<h2 class="section-title">{title.toUpperCase().replace(/ /g, '_')}</h2>
	{#if number}
		<span class="section-number">{number}</span>
	{/if}
</div>

<style>
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.section-title {
		font-family: var(--font-headline);
		font-size: var(--font-size-3xl);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: -0.02em;
		line-height: 1.1;
	}
	.section-number {
		font-family: var(--font-mono);
		font-size: var(--font-size-md);
		color: var(--color-text-muted);
	}
</style>
