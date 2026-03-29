<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let syncing = $state<Record<string, boolean>>({});

	const resourceLabels: Record<string, string> = {
		commodities: 'MATIERES_PREMIERES',
		items: 'OBJETS',
		locations: 'LIEUX',
		terminals: 'TERMINAUX'
	};

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}

	async function forceSync(resource: string) {
		syncing[resource] = true;
		try {
			const resp = await fetch('/api/admin/sync/force', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ resource })
			});
			if (resp.ok) {
				await invalidateAll();
			}
		} finally {
			syncing[resource] = false;
		}
	}
</script>

<svelte:head>
	<title>WACKASTOR - Synchronisation UEX</title>
</svelte:head>

<SectionHeader title="SYNCHRONISATION UEXCORP" />

<div class="sync-grid">
	{#each data.syncStatus as { resource, latest }}
		<div class="sync-card">
			<div class="sync-card-header">
				<span class="sync-resource">{resourceLabels[resource] ?? resource}</span>
				<span class="sync-count">{data.recordCounts[resource] ?? 0} enregistrements</span>
			</div>
			<div class="sync-card-body">
				{#if latest}
					<div class="sync-row">
						<span class="sync-label">DERNIER_SYNC</span>
						<span class="sync-value">{formatDate(latest.syncedAt)}</span>
					</div>
					<div class="sync-row">
						<span class="sync-label">STATUT</span>
						<Badge
							variant={latest.status === 'success' ? 'success' : latest.status === 'partial' ? 'warning' : 'error'}
							label={latest.status === 'success' ? 'Succes' : latest.status === 'partial' ? 'Partiel' : 'Erreur'}
						/>
					</div>
					<div class="sync-row">
						<span class="sync-label">ENREGISTREMENTS</span>
						<span class="sync-value mono">{latest.recordCount}</span>
					</div>
					<div class="sync-row">
						<span class="sync-label">DUREE</span>
						<span class="sync-value mono">{formatDuration(latest.durationMs)}</span>
					</div>
					{#if latest.errorMessage}
						<div class="sync-error">{latest.errorMessage}</div>
					{/if}
				{:else}
					<p class="no-sync">JAMAIS_SYNCHRONISE</p>
				{/if}
			</div>
			<div class="sync-card-footer">
				<button
					class="btn-sync clipped-corner"
					disabled={syncing[resource]}
					onclick={() => forceSync(resource)}
				>
					{syncing[resource] ? 'SYNCHRONISATION...' : 'FORCER_SYNCHRONISATION'}
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.sync-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-md);
		margin-top: var(--space-md);
	}
	.sync-card {
		border: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-tertiary);
		display: flex;
		flex-direction: column;
	}
	.sync-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-panel);
	}
	.sync-resource {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.sync-count {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-accent-cyan);
	}
	.sync-card-body {
		padding: var(--space-md);
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.sync-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.sync-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.sync-value {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}
	.sync-value.mono {
		font-family: var(--font-mono);
		color: var(--color-accent-cyan);
	}
	.sync-error {
		margin-top: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		background: var(--color-bg-primary);
		border-left: 2px solid var(--color-accent-red);
		font-size: var(--font-size-xs);
		color: var(--color-accent-red);
		word-break: break-word;
	}
	.no-sync {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		letter-spacing: 0.1em;
	}
	.sync-card-footer {
		padding: var(--space-sm) var(--space-md);
		border-top: 1px solid rgba(72, 72, 73, 0.2);
	}
	.btn-sync {
		width: 100%;
		padding: 10px var(--space-md);
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		border: none;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		cursor: pointer;
	}
	.btn-sync:hover:not(:disabled) { filter: brightness(1.1); }
	.btn-sync:active:not(:disabled) { transform: scale(0.97); }
	.btn-sync:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
