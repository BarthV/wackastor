<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import { goto } from '$app/navigation';
	import { formatQuantity } from '$lib/utils/formatQuantity.js';

	let { data } = $props();

	let q = $state(data.filters.q);
	let category = $state(data.filters.category);
	let location = $state(data.filters.location);
	let player = $state(data.filters.player);
	let qualityMin = $state(data.filters.qualityMin);
	let qualityMax = $state(data.filters.qualityMax);

	$effect(() => {
		q = data.filters.q;
		category = data.filters.category;
		location = data.filters.location;
		player = data.filters.player;
		qualityMin = data.filters.qualityMin;
		qualityMax = data.filters.qualityMax;
	});

	function applyFilters() {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (category) params.set('category', category);
		if (location) params.set('location', location);
		if (player) params.set('player', player);
		if (qualityMin) params.set('quality_min', qualityMin);
		if (qualityMax) params.set('quality_max', qualityMax);
		const qs = params.toString();
		goto(`/stock${qs ? '?' + qs : ''}`, { invalidateAll: true });
	}

	function clearFilters() {
		q = ''; category = ''; location = ''; player = ''; qualityMin = ''; qualityMax = '';
		goto('/stock', { invalidateAll: true });
	}
</script>

<svelte:head>
	<title>WACKASTOR - Stock corporatif</title>
</svelte:head>

<div class="stock-page">
	<SectionHeader title="STOCK DE CORPO" />

	<div class="filters-bar">
		<input type="text" bind:value={q} placeholder="RESSOURCE..." class="filter-input" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
		<input type="text" bind:value={location} placeholder="LIEU..." class="filter-input" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
		<select bind:value={category} class="filter-select">
			<option value="">TOUS_TYPES</option>
			<option value="commodity">COMMODITE</option>
			<option value="item">OBJET</option>
			<option value="equipment">EQUIPEMENT</option>
			<option value="other">AUTRE</option>
		</select>
		<select bind:value={player} class="filter-select">
			<option value="">TOUS_JOUEURS</option>
			{#each data.players as p}
				<option value={p.id}>{p.username.toUpperCase()}</option>
			{/each}
		</select>
		<div class="filter-quality">
			<input type="number" bind:value={qualityMin} placeholder="QUALITE_MIN" min="0" max="1000" class="filter-input filter-input-sm" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
			<span class="filter-sep">–</span>
			<input type="number" bind:value={qualityMax} placeholder="MAX" min="0" max="1000" class="filter-input filter-input-sm" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
		</div>
		<button class="btn-filter" onclick={applyFilters}>FILTRER</button>
		{#if q || location || category || player || qualityMin || qualityMax}
			<button class="btn-clear" onclick={clearFilters}>✕</button>
		{/if}
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
						<th>QUALITE</th>
						<th>LOCALISATION</th>
						<th>PROPRIETAIRE</th>
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
								<span class="quality-value">{item.quality > 0 ? item.quality : '—'}</span>
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

	/* ── Filters bar ── */
	.filters-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
	}
	.filter-input {
		padding: 7px 10px;
		background: var(--color-bg-secondary);
		border: none;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		min-width: 140px;
	}
	.filter-input-sm { min-width: 80px; width: 80px; }
	.filter-input:focus { outline: none; border-bottom-color: var(--color-accent-cyan); }
	.filter-input::placeholder { color: var(--color-border); font-size: var(--font-size-xs); }
	.filter-select {
		padding: 7px 10px;
		background: var(--color-bg-secondary);
		border: none;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text-secondary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		letter-spacing: 0.1em;
	}
	.filter-select:focus { outline: none; border-bottom-color: var(--color-accent-cyan); }
	.filter-quality { display: flex; align-items: center; gap: 4px; }
	.filter-sep { color: var(--color-text-muted); font-size: var(--font-size-xs); }
	.btn-filter {
		padding: 7px 16px;
		border: 1px solid var(--color-accent-cyan);
		color: var(--color-accent-cyan);
		background: transparent;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
	}
	.btn-filter:hover { background: var(--color-accent-cyan); color: var(--color-bg-primary); }
	.btn-clear {
		padding: 7px 10px;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}
	.btn-clear:hover { color: var(--color-accent-red); }

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
	.th-right {
		text-align: right;
	}
	td {
		padding: 10px var(--space-md);
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
	.quality-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
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
