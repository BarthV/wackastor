<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import MatchSidebar from '$lib/components/orders/MatchSidebar.svelte';
	import { goto, invalidateAll } from '$app/navigation';

	let { data } = $props();

	const statusLabels: Record<string, string> = {
		open: 'En attente',
		matched: 'Correspondance',
		fulfilled: 'Remplie',
		cancelled: 'Annulee'
	};

	const statusVariants: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
		open: 'info',
		matched: 'success',
		fulfilled: 'success',
		cancelled: 'error'
	};

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function handleFulfill() {
		const resp = await fetch(`/api/orders/${data.order.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'fulfilled' })
		});
		if (resp.ok) invalidateAll();
	}

	async function handleCancel() {
		const resp = await fetch(`/api/orders/${data.order.id}`, { method: 'DELETE' });
		if (resp.ok) goto('/commandes');
	}
</script>

<svelte:head>
	<title>WACKASTOR - Commande: {data.order.name}</title>
</svelte:head>

<div class="order-detail">
	<div class="page-header">
		<SectionHeader title="DETAIL COMMANDE" />
		<div class="header-actions">
			<a href="/commandes" class="btn-back">RETOUR</a>
			{#if data.order.status === 'open' || data.order.status === 'matched'}
				<button class="btn-fulfill" onclick={handleFulfill}>MARQUER_REMPLIE</button>
				<button class="btn-cancel" onclick={handleCancel}>ANNULER</button>
			{/if}
		</div>
	</div>

	<div class="detail-layout">
		<div class="detail-main">
			<div class="info-card clipped-corner">
				<div class="info-header">
					<span class="info-header-title">INFORMATIONS</span>
				</div>
				<div class="info-grid">
					<div class="info-row">
						<span class="info-label">RESSOURCE</span>
						<span class="info-value">{data.order.name.toUpperCase().replace(/ /g, '_')}</span>
					</div>
					<div class="info-row">
						<span class="info-label">CATEGORIE</span>
						<span class="info-value">{data.order.category.toUpperCase()}</span>
					</div>
					<div class="info-row">
						<span class="info-label">QUANTITE</span>
						<span class="info-value mono">{data.order.quantity} {data.order.unit}</span>
					</div>
					{#if data.order.quality > 0}
						<div class="info-row">
							<span class="info-label">QUALITE</span>
							<span class="info-value mono">{data.order.quality}</span>
						</div>
					{/if}
					{#if data.order.locationName}
						<div class="info-row">
							<span class="info-label">LIEU_PREFERE</span>
							<span class="info-value">{data.order.locationName.toUpperCase().replace(/ /g, '_')}</span>
						</div>
					{/if}
					<div class="info-row">
						<span class="info-label">STATUT</span>
						<span class="info-value">
							<Badge
								variant={statusVariants[data.order.status] ?? 'info'}
								label={statusLabels[data.order.status] ?? data.order.status}
							/>
						</span>
					</div>
					<div class="info-row">
						<span class="info-label">CREEE_LE</span>
						<span class="info-value">{formatDate(data.order.createdAt)}</span>
					</div>
					{#if data.order.notes}
						<div class="info-row notes-row">
							<span class="info-label">NOTES</span>
							<span class="info-value">{data.order.notes}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<div class="detail-sidebar">
			<MatchSidebar matches={data.matches} />
		</div>
	</div>
</div>

<style>
	.order-detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}
	.header-actions {
		display: flex;
		gap: var(--space-sm);
	}
	.btn-back {
		padding: 8px 16px;
		border: 1px solid var(--color-border-dim);
		color: var(--color-text-secondary);
		background: var(--color-bg-panel);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		text-decoration: none;
		letter-spacing: 0.15em;
	}
	.btn-back:hover {
		color: var(--color-accent-gold);
		background: rgba(255, 193, 93, 0.1);
	}
	.btn-fulfill {
		padding: 8px 16px;
		background: transparent;
		border: 1px solid var(--color-accent-green);
		color: var(--color-accent-green);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		cursor: pointer;
	}
	.btn-fulfill:hover {
		background: var(--color-accent-green);
		color: var(--color-bg-primary);
	}
	.btn-cancel {
		padding: 8px 16px;
		background: transparent;
		border: 1px solid var(--color-accent-red);
		color: var(--color-accent-red);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		cursor: pointer;
	}
	.btn-cancel:hover {
		background: var(--color-accent-red);
		color: var(--color-bg-primary);
	}
	.detail-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: var(--space-lg);
	}
	.info-card {
		border: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-secondary);
	}
	.info-header {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-panel);
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
	}
	.info-header-title {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.info-grid {
		display: flex;
		flex-direction: column;
	}
	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
	}
	.info-row:last-child { border-bottom: none; }
	.notes-row {
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-xs);
	}
	.info-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}
	.info-value {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}
	.info-value.mono {
		font-family: var(--font-mono);
		color: var(--color-accent-cyan);
	}
</style>
