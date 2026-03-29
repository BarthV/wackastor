<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { invalidateAll } from '$app/navigation';

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

	async function handleCancel(id: string) {
		const resp = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
		if (resp.ok) invalidateAll();
	}

	async function handleFulfill(id: string) {
		const resp = await fetch(`/api/orders/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'fulfilled' })
		});
		if (resp.ok) invalidateAll();
	}
</script>

<svelte:head>
	<title>WACKASTOR - Mes commandes</title>
</svelte:head>

<div class="orders-page">
	<div class="page-header">
		<SectionHeader title="MES COMMANDES" />
		<a href="/commandes/nouveau" class="btn-add clipped-corner">NOUVELLE_COMMANDE</a>
	</div>

	{#if data.orders.length === 0}
		<div class="empty-state">
			<p class="empty-text">Aucune commande passée. Creez-en une pour annoncer votre besoin.</p>
		</div>
	{:else}
		<div class="orders-table clipped-corner">
			<table>
				<thead>
					<tr>
						<th>RESSOURCE</th>
						<th class="th-right">QUANTITE</th>
						<th class="th-right">QUALITE</th>
						<th>STATUT</th>
						<th>CORRESPONDANCES</th>
						<th>ACTIONS</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orders as order}
						<tr>
							<td>
								<a href="/commandes/{order.id}" class="order-link">{order.name.toUpperCase().replace(/ /g, '_')}</a>
							</td>
							<td class="td-right">
								<span class="qty-value">{order.quantity.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {order.unit}</span>
							</td>
							<td class="td-right">
								<span class="quality-value">{order.quality > 0 ? order.quality : '—'}</span>
							</td>
							<td>
								<Badge
									variant={statusVariants[order.status] ?? 'info'}
									label={statusLabels[order.status] ?? order.status}
								/>
							</td>
							<td>
								{#if order.matchCount > 0}
									<span class="match-indicator">{order.matchCount} joueur{order.matchCount > 1 ? 's' : ''}</span>
								{:else}
									<span class="no-match">Aucune</span>
								{/if}
							</td>
							<td>
								<div class="actions">
									{#if order.status === 'open' || order.status === 'matched'}
										<button class="action-fulfill" onclick={() => handleFulfill(order.id)}>REMPLIE</button>
										<button class="action-cancel" onclick={() => handleCancel(order.id)}>ANNULER</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.orders-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}
	.btn-add {
		display: inline-block;
		padding: 10px 20px;
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		text-decoration: none;
	}
	.btn-add:hover { filter: brightness(1.1); }
	.empty-state {
		padding: var(--space-2xl);
		text-align: center;
		border: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-secondary);
	}
	.empty-text {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.orders-table {
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}
	table { width: 100%; border-collapse: collapse; }
	thead { background: var(--color-bg-panel); }
	th {
		text-align: left;
		padding: 10px var(--space-md);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
		white-space: nowrap;
	}
	.th-right { text-align: right; }
	td {
		padding: 10px var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	.td-right { text-align: right; }
	tbody tr:hover { background: rgba(255, 193, 93, 0.05); }
	.order-link {
		color: var(--color-text-primary);
		text-decoration: none;
		font-weight: 700;
		font-size: var(--font-size-sm);
	}
	.order-link:hover { color: var(--color-accent-gold); }
	.qty-value { font-family: var(--font-mono); color: var(--color-accent-cyan); }
	.quality-value { font-family: var(--font-mono); color: var(--color-text-primary); }
	.match-indicator { color: var(--color-accent-green); font-weight: 700; font-size: var(--font-size-xs); }
	.no-match { color: var(--color-text-muted); font-size: var(--font-size-xs); }
	.actions { display: flex; gap: var(--space-sm); }
	.action-fulfill, .action-cancel {
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		background: none;
		border: none;
		cursor: pointer;
		letter-spacing: 0.05em;
	}
	.action-fulfill { color: var(--color-accent-green); }
	.action-fulfill:hover { text-decoration: underline; }
	.action-cancel { color: var(--color-text-muted); }
	.action-cancel:hover { color: var(--color-accent-red); }
</style>
