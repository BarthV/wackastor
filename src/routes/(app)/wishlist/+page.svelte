<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TabBar from '$lib/components/ui/TabBar.svelte';
	import TerminalCard from '$lib/components/ui/TerminalCard.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let activeTab = $state('reservations');

	const tabs = [
		{ key: 'reservations', label: 'RESERVATIONS' },
		{ key: 'recherches', label: 'RECHERCHES' }
	];

	function statusVariant(status: string): 'info' | 'success' | 'error' | 'default' {
		if (status === 'active') return 'info';
		if (status === 'fulfilled') return 'success';
		if (status === 'cancelled') return 'error';
		return 'default';
	}

	function statusLabel(status: string): string {
		if (status === 'active') return 'ACTIVE';
		if (status === 'fulfilled') return 'VALIDEE';
		if (status === 'cancelled') return 'ANNULEE';
		return status.toUpperCase();
	}

	async function cancelReservation(id: string) {
		const resp = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
		if (resp.ok) {
			invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>WACKASTOR - Liste de souhaits</title>
</svelte:head>

<div class="wishlist-page">
	<SectionHeader title="LISTE DE SOUHAITS" />

	<TabBar {tabs} active={activeTab} onSelect={(key) => (activeTab = key)} />

	{#if activeTab === 'reservations'}
		{#if data.myReservations.length === 0}
			<div class="empty-state">
				<p class="empty-text">Aucune reservation. Reservez des objets depuis le stock de la corporation.</p>
			</div>
		{:else}
			<div class="wish-table clipped-corner">
				<table>
					<thead>
						<tr>
							<th>ITEM</th>
							<th class="th-right">QTE RESERVEE</th>
							<th>PROPRIETAIRE</th>
							<th>LOCALISATION</th>
							<th>STATUT</th>
							<th>ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{#each data.myReservations as res}
							<tr>
								<td>
									<div class="cell-stack">
										<span class="item-name">{res.item.name.toUpperCase().replace(/ /g, '_')}</span>
										{#if res.item.quality > 0}
											<span class="item-quality">Q: {res.item.quality}</span>
										{/if}
									</div>
								</td>
								<td class="td-right">
									<span class="qty-value">{res.quantity} {res.item.unit}</span>
								</td>
								<td>
									<a
										href="https://discord.com/users/{res.owner.discordId}"
										target="_blank"
										rel="noopener"
										class="player-link"
									>{res.owner.username.toUpperCase()}</a>
								</td>
								<td>
									<span class="loc-value">{res.item.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span>
								</td>
								<td>
									<Badge variant={statusVariant(res.status)} label={statusLabel(res.status)} />
								</td>
								<td>
									{#if res.status === 'active'}
										<button class="btn-cancel" onclick={() => cancelReservation(res.id)}>
											ANNULER
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	{#if activeTab === 'recherches'}
		<TerminalCard title="RECHERCHES">
			<div class="placeholder">
				<span class="placeholder-code">// EN_TRAVAUX</span>
				<span class="placeholder-sub">FONCTIONNALITE_A_VENIR</span>
			</div>
		</TerminalCard>
	{/if}
</div>

<style>
	.wishlist-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.wish-table {
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: var(--color-bg-panel);
	}

	th {
		text-align: left;
		padding: 5px var(--space-md);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
		white-space: nowrap;
	}

	.th-right {
		text-align: right;
	}

	td {
		padding: 5px var(--space-md);
		height: 43px;
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}

	.td-right {
		text-align: right;
	}

	tbody tr:hover {
		background: rgba(255, 193, 93, 0.05);
	}

	.cell-stack {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-name {
		font-weight: 700;
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}

	.item-quality {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.qty-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-accent-cyan);
	}

	.player-link {
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		text-decoration: none;
		text-transform: uppercase;
	}

	.player-link:hover {
		color: var(--color-accent-cyan);
	}

	.loc-value {
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.btn-cancel {
		padding: 4px 12px;
		background: transparent;
		border: 1px solid var(--color-accent-red);
		color: var(--color-accent-red);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
	}

	.btn-cancel:hover {
		background: var(--color-accent-red);
		color: var(--color-bg-primary);
	}

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

	.placeholder {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-xl);
		text-align: center;
		align-items: center;
	}

	.placeholder-code {
		font-family: var(--font-mono);
		font-size: var(--font-size-lg);
		color: var(--color-accent-cyan);
		letter-spacing: 0.1em;
	}

	.placeholder-sub {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.2em;
	}
</style>
