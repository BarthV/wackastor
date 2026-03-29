<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import { goto } from '$app/navigation';
	import { formatQuantity } from '$lib/utils/formatQuantity.js';
	import { page } from '$app/stores';

	let { data } = $props();

	let q = $state('');
	let category = $state('');
	let location = $state('');
	let player = $state('');

	$effect(() => {
		q = data.filters.q;
		category = data.filters.category;
		location = data.filters.location;
		player = data.filters.player;
	});

	function applyFilters() {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (category) params.set('category', category);
		if (location) params.set('location', location);
		if (player) params.set('player', player);
		const qs = params.toString();
		goto(`/stock${qs ? '?' + qs : ''}`, { invalidateAll: true });
	}

	function clearFilters() {
		q = '';
		category = '';
		location = '';
		player = '';
		goto('/stock', { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>WACKASTOR - Stock corporatif</title>
</svelte:head>

<div class="stock-page">
	<div class="page-top">
		<div class="page-title-area">
			<SectionHeader title="STOCK DE CORPO" />
			<div class="page-status">
				<span class="status-dot"></span>
				<span class="status-label">SYSTEME OPERATIONNEL</span>
				<span class="status-sep">/</span>
				<span class="status-label">DEPOT CENTRAL</span>
			</div>
		</div>
		<div class="page-actions">
			<div class="search-wrap">
				<span class="material-symbols-outlined search-icon">search</span>
				<input
					type="text"
					bind:value={q}
					placeholder="RECHERCHER_STOCK..."
					class="search-input"
					onkeydown={(e) => { if (e.key === 'Enter') applyFilters(); }}
				/>
			</div>
			<div class="action-buttons">
				<button class="btn-action" onclick={applyFilters}>FILTRER</button>
				<button class="btn-action" onclick={clearFilters}>EFFACER</button>
			</div>
		</div>
	</div>

	<div class="filter-tabs">
		<button
			class="tab"
			class:active={!category}
			onclick={() => { category = ''; applyFilters(); }}
		>TOUT</button>
		<button
			class="tab"
			class:active={category === 'commodity'}
			onclick={() => { category = 'commodity'; applyFilters(); }}
		>COMMODITIES</button>
		<button
			class="tab"
			class:active={category === 'item'}
			onclick={() => { category = 'item'; applyFilters(); }}
		>EQUIPEMENT</button>
	</div>

	{#if data.items.length === 0}
		<div class="empty-state">
			<p class="empty-text">Aucun objet trouve avec ces filtres.</p>
		</div>
	{:else}
		<div class="stock-table clipped-corner">
			<table>
				<thead>
					<tr>
						<th>ITEM</th>
						<th class="th-right">QUANTITE</th>
						<th>LOCALISATION</th>
						<th>PROPRIETAIRE</th>
						<th>NOTES</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item}
						<tr>
							<td>
								<div class="item-cell">
									<div class="item-icon">
										<span class="material-symbols-outlined">{item.sectionIcon ?? (item.category === 'commodity' ? 'diamond' : 'category')}</span>
									</div>
									<div>
										<div class="item-name">{item.name.toUpperCase().replace(/ /g, '_')}</div>
									</div>
								</div>
							</td>
							<td class="td-right">
								<span class="qty-value">{formatQuantity(item.quantity, item.unit)}</span>
							</td>
							<td>
								<span class="loc-value">{item.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span>
							</td>
							<td>
								<a
									href="https://discord.com/users/{item.userDiscordId}"
									target="_blank"
									rel="noopener"
									class="player-link"
								>{item.username.toUpperCase()}</a>
							</td>
							<td>
								<span class="notes-value">{item.notes?.toUpperCase().replace(/ /g, '_') || ''}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.stock-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	/* ── Page top ── */
	.page-top {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-end;
		gap: var(--space-lg);
	}
	.page-title-area {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.page-status {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		color: var(--color-text-secondary);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.status-dot {
		width: 6px;
		height: 6px;
		background: var(--color-accent-green);
	}
	.status-sep {
		color: var(--color-border);
	}
	.page-actions {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}
	.search-wrap {
		position: relative;
		width: 320px;
	}
	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 20px;
		color: rgba(255, 193, 93, 0.5);
	}
	.search-input {
		width: 100%;
		background: var(--color-bg-secondary);
		border: none;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		padding: 12px 12px 12px 44px;
		outline: none;
		font-family: var(--font-body);
	}
	.search-input:focus {
		border-bottom-color: var(--color-accent-cyan);
	}
	.search-input::placeholder {
		color: var(--color-border);
	}
	.action-buttons {
		display: flex;
		gap: var(--space-sm);
	}
	.btn-action {
		background: var(--color-bg-panel);
		padding: 8px 16px;
		font-size: var(--font-size-xs);
		font-weight: 700;
		font-family: var(--font-label);
		color: var(--color-accent-gold);
		border: 1px solid var(--color-border-dim);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		cursor: pointer;
	}
	.btn-action:hover {
		background: rgba(255, 193, 93, 0.1);
	}

	/* ── Filter tabs ── */
	.filter-tabs {
		display: flex;
		gap: var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.3);
		padding-bottom: 2px;
	}
	.tab {
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 6px var(--space-md);
		font-size: var(--font-size-xs);
		font-weight: 700;
		font-family: var(--font-label);
		letter-spacing: 0.15em;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		cursor: pointer;
	}
	.tab:hover {
		color: var(--color-text-primary);
	}
	.tab.active {
		color: var(--color-accent-cyan);
		border-bottom-color: var(--color-accent-cyan);
	}

	/* ── Table ── */
	.stock-table {
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
		padding: var(--space-md);
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
		padding: var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	tbody tr:hover {
		background: rgba(255, 193, 93, 0.05);
	}
	.td-right {
		text-align: right;
	}

	/* ── Cell content ── */
	.item-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.item-icon {
		width: 32px;
		height: 32px;
		background: var(--color-bg-hover);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid rgba(72, 72, 73, 0.5);
	}
	.item-icon :global(.material-symbols-outlined) {
		font-size: 18px;
		color: var(--color-accent-cyan);
	}
	.item-name {
		font-size: var(--font-size-sm);
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.qty-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-accent-cyan);
	}
	.loc-value {
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
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
	.notes-value {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
	}

	/* ── Empty state ── */
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
</style>
