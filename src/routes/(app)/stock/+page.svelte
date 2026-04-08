<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TabBar from '$lib/components/ui/TabBar.svelte';
	import AvailabilityBar from '$lib/components/ui/AvailabilityBar.svelte';
	import ReservationModal from '$lib/components/reservations/ReservationModal.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { formatQuantity } from '$lib/utils/formatQuantity.js';

	let { data } = $props();

	let activeTab = $state('stock');

	const tabs = [
		{ key: 'stock', label: 'STOCK' },
		{ key: 'reservations', label: 'RESERVATIONS' }
	];

	let q = $state(data.filters.q);
	let category = $state(data.filters.category);
	let location = $state(data.filters.location);
	let player = $state(data.filters.player);
	let qualityMin = $state(data.filters.qualityMin);
	let qualityMax = $state(data.filters.qualityMax);

	// Player autocomplete
	let playerQuery = $state(
		data.players.find((p) => p.id === data.filters.player)?.username ?? ''
	);
	let playerResults = $state<typeof data.players>([]);
	let playerOpen = $state(false);
	let playerSelectedIndex = $state(-1);

	function onPlayerInput() {
		const val = playerQuery.trim().toLowerCase();
		player = '';
		if (val.length === 0) {
			playerResults = [];
			playerOpen = false;
			return;
		}
		playerResults = data.players.filter((p) =>
			p.username.toLowerCase().includes(val)
		);
		playerOpen = playerResults.length > 0;
		playerSelectedIndex = -1;
	}

	function selectPlayer(p: (typeof data.players)[number]) {
		player = p.id;
		playerQuery = p.username;
		playerOpen = false;
	}

	function onPlayerKeydown(e: KeyboardEvent) {
		if (!playerOpen) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			playerSelectedIndex = Math.min(playerSelectedIndex + 1, playerResults.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			playerSelectedIndex = Math.max(playerSelectedIndex - 1, 0);
		} else if (e.key === 'Enter' && playerSelectedIndex >= 0) {
			e.preventDefault();
			selectPlayer(playerResults[playerSelectedIndex]);
		} else if (e.key === 'Escape') {
			playerOpen = false;
		}
	}

	$effect(() => {
		q = data.filters.q;
		category = data.filters.category;
		location = data.filters.location;
		player = data.filters.player;
		playerQuery = data.players.find((p) => p.id === data.filters.player)?.username ?? '';
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
		q = ''; category = ''; location = ''; player = ''; playerQuery = ''; qualityMin = ''; qualityMax = '';
		goto('/stock', { invalidateAll: true });
	}

	// Reservation modal
	type StockItem = typeof data.items[number];
	let reservationTarget = $state<StockItem | null>(null);

	async function handleReserve(payload: { inventoryItemId: string; quantity: number }) {
		const resp = await fetch('/api/reservations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		reservationTarget = null;
		if (resp.ok) {
			invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>WACKASTOR - Stock corporatif</title>
</svelte:head>

<div class="stock-page">
	<SectionHeader title="STOCK DE CORPO" />

	<TabBar {tabs} active={activeTab} onSelect={(key) => (activeTab = key)} />

	{#if activeTab === 'stock'}
		<div class="filters-bar">
			<input type="text" bind:value={q} placeholder="RESSOURCE..." class="filter-input" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
			<div class="filter-quality">
				<input type="number" bind:value={qualityMin} placeholder="MIN" min="0" max="1000" class="filter-input filter-input-sm" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
				<span class="filter-sep">–</span>
				<input type="number" bind:value={qualityMax} placeholder="MAX" min="0" max="1000" class="filter-input filter-input-sm" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
			</div>
			<input type="text" bind:value={location} placeholder="LIEU..." class="filter-input" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
			<div class="player-autocomplete">
				<input
					type="text"
					bind:value={playerQuery}
					oninput={onPlayerInput}
					onkeydown={onPlayerKeydown}
					onblur={() => setTimeout(() => { playerOpen = false; }, 200)}
					onfocus={() => { if (playerResults.length > 0) playerOpen = true; }}
					placeholder="JOUEUR..."
					class="filter-input"
					autocomplete="off"
				/>
				{#if playerOpen}
					<ul class="player-results">
						{#each playerResults as p, i}
							<li
								class="player-result"
								class:selected={i === playerSelectedIndex}
								onmousedown={() => selectPlayer(p)}
								role="option"
								aria-selected={i === playerSelectedIndex}
							>{p.username.toUpperCase()}</li>
						{/each}
					</ul>
				{/if}
			</div>
			<select bind:value={category} class="filter-select">
				<option value="">TOUS_TYPES</option>
				<option value="commodity">COMMODITE</option>
				<option value="item">OBJET</option>
				<option value="equipment">EQUIPEMENT</option>
				<option value="other">AUTRE</option>
			</select>
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
							<th>DISPONIBILITE</th>
							<th>QUALITE</th>
							<th>LOCALISATION</th>
							<th>PROPRIETAIRE</th>
						</tr>
					</thead>
					<tbody>
						{#each data.items as item}
							{@const isOwn = item.userId === data.user?.id}
							{@const available = item.quantity - (item.reservedQuantity ?? 0)}
							<tr
								class:tr-clickable={!isOwn}
								onclick={() => { if (!isOwn) reservationTarget = item; }}
							>
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
								<td>
									<AvailabilityBar
										reserved={item.reservedQuantity ?? 0}
										total={item.quantity}
										unit={item.unit}
									/>
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
										onclick={(e) => e.stopPropagation()}
									>{item.username.toUpperCase()}</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	{#if activeTab === 'reservations'}
		{#if data.allReservations.length === 0}
			<div class="empty-state">
				<p class="empty-text">Aucune reservation active dans la corporation.</p>
			</div>
		{:else}
			<div class="stock-table clipped-corner">
				<table>
					<thead>
						<tr>
							<th>ITEM</th>
							<th>DEMANDEUR</th>
							<th>PROPRIETAIRE</th>
							<th class="th-right">QTE</th>
							<th>LOCALISATION</th>
							<th>STATUT</th>
							<th>DATE</th>
						</tr>
					</thead>
					<tbody>
						{#each data.allReservations as res}
							<tr>
								<td>
									<span class="item-name">{res.itemName.toUpperCase().replace(/ /g, '_')}</span>
								</td>
								<td>
									<span class="player-name">{(res.requesterUsername ?? '—').toUpperCase()}</span>
								</td>
								<td>
									<span class="player-name">{(res.ownerUsername ?? '—').toUpperCase()}</span>
								</td>
								<td class="td-right">
									<span class="qty-value">{res.quantity} {res.unit}</span>
								</td>
								<td>
									<span class="loc-value">{res.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span>
								</td>
								<td>
									<span class="status-active">ACTIVE</span>
								</td>
								<td>
									<span class="date-value">{new Date(res.createdAt).toLocaleDateString('fr-FR')}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>

{#if reservationTarget}
	{@const available = reservationTarget.quantity - (reservationTarget.reservedQuantity ?? 0)}
	<ReservationModal
		item={{
			id: reservationTarget.id,
			name: reservationTarget.name,
			quantity: reservationTarget.quantity,
			unit: reservationTarget.unit,
			locationName: reservationTarget.locationName,
			quality: reservationTarget.quality,
			username: reservationTarget.username
		}}
		{available}
		onSubmit={handleReserve}
		onClose={() => (reservationTarget = null)}
	/>
{/if}

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
	.player-autocomplete {
		position: relative;
	}
	.player-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		min-width: 160px;
		max-height: 200px;
		overflow-y: auto;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-top: none;
		z-index: 100;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.player-result {
		padding: 6px 10px;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		letter-spacing: 0.1em;
		cursor: pointer;
	}
	.player-result:hover,
	.player-result.selected {
		background: var(--color-bg-tertiary);
		color: var(--color-accent-orange);
	}
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
	tbody tr:hover {
		background: rgba(255, 193, 93, 0.05);
	}
	.td-right {
		text-align: right;
	}
	.tr-clickable {
		cursor: pointer;
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
	.player-name {
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		text-transform: uppercase;
	}
	.quality-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}
	.status-active {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-cyan);
		letter-spacing: 0.1em;
	}
	.date-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
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
