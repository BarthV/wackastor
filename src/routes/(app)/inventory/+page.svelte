<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TerminalCard from '$lib/components/ui/TerminalCard.svelte';
	import ItemForm from '$lib/components/inventory/ItemForm.svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatQuantity } from '$lib/utils/formatQuantity.js';

	let { data } = $props();

	let showForm = $state(false);
	let q = $state(data.filters.q);
	let location = $state(data.filters.location);
	let category = $state(data.filters.category);
	let qualityMin = $state(data.filters.qualityMin);
	let qualityMax = $state(data.filters.qualityMax);

	$effect(() => {
		q = data.filters.q;
		location = data.filters.location;
		category = data.filters.category;
		qualityMin = data.filters.qualityMin;
		qualityMax = data.filters.qualityMax;
	});

	function applyFilters() {
		const params = new URLSearchParams();
		if (q) params.set('q', q);
		if (location) params.set('location', location);
		if (category) params.set('category', category);
		if (qualityMin) params.set('quality_min', qualityMin);
		if (qualityMax) params.set('quality_max', qualityMax);
		const qs = params.toString();
		goto(`/inventory${qs ? '?' + qs : ''}`, { invalidateAll: true });
	}

	function clearFilters() {
		q = ''; location = ''; category = ''; qualityMin = ''; qualityMax = '';
		goto('/inventory', { invalidateAll: true });
	}

	async function handleCreate(formData: Record<string, unknown>) {
		const resp = await fetch('/api/inventory', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		});
		if (resp.ok) {
			showForm = false;
			invalidateAll();
		}
	}

	async function handleDelete(id: string) {
		const resp = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
		if (resp.ok) {
			invalidateAll();
		}
	}
</script>

<svelte:head>
	<title>WACKASTOR - Mon inventaire</title>
</svelte:head>

<div class="inventory-page">
	<div class="page-header">
		<SectionHeader title="MON INVENTAIRE" />
		<button class="btn-add clipped-corner" onclick={() => showForm = !showForm}>
			{showForm ? 'FERMER' : 'CREER'}
		</button>
	</div>

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
		<div class="filter-quality">
			<input type="number" bind:value={qualityMin} placeholder="QUALITE_MIN" min="0" max="1000" class="filter-input filter-input-sm" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
			<span class="filter-sep">–</span>
			<input type="number" bind:value={qualityMax} placeholder="MAX" min="0" max="1000" class="filter-input filter-input-sm" onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
		</div>
		<button class="btn-filter" onclick={applyFilters}>FILTRER</button>
		{#if q || location || category || qualityMin || qualityMax}
			<button class="btn-clear" onclick={clearFilters}>✕</button>
		{/if}
	</div>

	{#if showForm}
		<TerminalCard title="DECLARER_UN_OBJET">
			<ItemForm mode="create" onSubmit={handleCreate} onCancel={() => showForm = false} />
		</TerminalCard>
	{/if}

	{#if data.items.length === 0}
		<div class="empty-state">
			<p class="empty-text">Aucun objet declare. Utilisez le bouton "CREER" pour commencer.</p>
		</div>
	{:else}
		<div class="inventory-table clipped-corner">
			<table>
				<thead>
					<tr>
						<th>ITEM</th>
						<th class="th-right">QUANTITE</th>
						<th class="th-right">QUALITE</th>
						<th>TYPE</th>
						<th>LOCALISATION</th>
						<th>ACTIONS</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item}
						<tr onclick={() => goto(`/inventory/${item.id}${$page.url.search ? '?back=' + encodeURIComponent($page.url.search) : ''}`)} class="tr-clickable">
							<td>
								<span class="item-name">{item.name.toUpperCase().replace(/ /g, '_')}</span>
							</td>
							<td class="td-right"><span class="qty-value">{formatQuantity(item.quantity, item.unit)}</span></td>
							<td class="td-right"><span class="quality-value">{item.quality > 0 ? item.quality : '—'}</span></td>
							<td><span class="cat-value">{item.category.toUpperCase()}</span></td>
							<td><span class="loc-value">{item.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span></td>
							<td>
								<div class="actions">
									<a href="/inventory/{item.id}{$page.url.search ? '?back=' + encodeURIComponent($page.url.search) : ''}" class="action-link">MODIFIER</a>
									<button class="action-delete" onclick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>SUPPRIMER</button>
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

	.inventory-page {
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
		padding: 10px 20px;
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		border: none;
		cursor: pointer;
	}
	.btn-add:hover { filter: brightness(1.1); }
	.btn-add:active { transform: scale(0.97); }
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
	.inventory-table {
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}
	table { width: 100%; border-collapse: collapse; }
	thead { background: var(--color-bg-panel); }
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
	.th-right { text-align: right; }
	td {
		padding: 5px var(--space-md);
		height: 43px;
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	.td-right { text-align: right; }
	tbody tr:hover { background: rgba(255, 193, 93, 0.05); }
	.tr-clickable { cursor: pointer; }
	.item-name {
		color: var(--color-text-primary);
		font-weight: 700;
		font-size: var(--font-size-sm);
		letter-spacing: -0.01em;
	}
	.tr-clickable:hover .item-name { color: var(--color-accent-gold); }
	.cat-value { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
	.qty-value { font-family: var(--font-mono); color: var(--color-accent-cyan); }
	.quality-value { font-family: var(--font-mono); color: var(--color-text-primary); }
	.loc-value { font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); }
	.actions { display: flex; gap: var(--space-sm); }
	.action-link {
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		color: var(--color-accent-cyan);
		text-decoration: none;
		letter-spacing: 0.05em;
	}
	.action-link:hover { text-decoration: underline; }
	.action-delete {
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		color: var(--color-text-muted);
		background: none;
		border: none;
		cursor: pointer;
		letter-spacing: 0.05em;
	}
	.action-delete:hover { color: var(--color-accent-red); }
</style>
