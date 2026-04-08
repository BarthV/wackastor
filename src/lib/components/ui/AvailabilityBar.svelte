<script lang="ts">
	interface Props {
		reserved: number;
		total: number;
		unit: string;
	}

	let { reserved, total, unit }: Props = $props();

	const free = $derived(Math.max(0, total - reserved));
	const reservedPct = $derived(total > 0 ? Math.min(100, (reserved / total) * 100) : 0);
	const freePct = $derived(100 - reservedPct);
</script>

{#if total === 0}
	<span class="qty-value">0 {unit}</span>
{:else}
	<div class="avail-wrap">
		<div class="avail-bar">
			{#if reservedPct > 0}
				<div class="bar-reserved" style="width: {reservedPct}%"></div>
			{/if}
			{#if freePct > 0}
				<div class="bar-free" style="width: {freePct}%"></div>
			{/if}
		</div>
		<div class="avail-text">
			<span class="free-qty">{free} {unit} libre</span>
			{#if reserved > 0}
				<span class="sep">·</span>
				<span class="reserved-qty">{reserved} réservé</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.avail-wrap {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 120px;
	}

	.avail-bar {
		display: flex;
		height: 6px;
		width: 100%;
		background: rgba(72, 72, 73, 0.3);
		overflow: hidden;
	}

	.bar-reserved {
		background: var(--color-accent-gold);
		height: 100%;
		transition: width 200ms;
	}

	.bar-free {
		background: var(--color-accent-cyan);
		height: 100%;
		transition: width 200ms;
	}

	.avail-text {
		display: flex;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		white-space: nowrap;
	}

	.free-qty {
		color: var(--color-accent-cyan);
	}

	.sep {
		color: var(--color-text-muted);
	}

	.reserved-qty {
		color: var(--color-accent-gold);
	}

	.qty-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-accent-cyan);
	}
</style>
