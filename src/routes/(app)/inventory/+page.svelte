<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TabBar from '$lib/components/ui/TabBar.svelte';
	import TerminalCard from '$lib/components/ui/TerminalCard.svelte';
	import MultiItemForm from '$lib/components/inventory/MultiItemForm.svelte';
	import Autocomplete from '$lib/components/ui/Autocomplete.svelte';
	import AttributionList from '$lib/components/reservations/AttributionList.svelte';
	import RequesterSummaryModal from '$lib/components/reservations/RequesterSummaryModal.svelte';
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

	async function handleCreate(items: Record<string, unknown>[]) {
		await Promise.all(
			items.map((item) =>
				fetch('/api/inventory', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(item)
				})
			)
		);
		showForm = false;
		invalidateAll();
	}

	let activeTab = $state('inventory');

	const tabs = [
		{ key: 'inventory', label: 'INVENTAIRE' },
		{ key: 'attributions', label: 'DEMANDES EN COURS' }
	];

	// -- Attributions / requester summary --
	let attrSelectedIds = $state(new Set<string>());
	let showBulkFulfillConfirm = $state(false);
	let summaryModal = $state<{
		requester: { username: string; discordId: string };
		reservations: Array<{ itemName: string; quantity: number; unit: string; locationName: string }>;
	} | null>(null);

	const attrAllSelected = $derived(
		data.attributions.length > 0 && data.attributions.every((a) => attrSelectedIds.has(a.id))
	);

	function toggleAttr(id: string) {
		const next = new Set(attrSelectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		attrSelectedIds = next;
	}

	function toggleAllAttr() {
		if (attrAllSelected) {
			attrSelectedIds = new Set();
		} else {
			attrSelectedIds = new Set(data.attributions.map((a) => a.id));
		}
	}

	async function fulfillReservation(id: string) {
		const resp = await fetch(`/api/reservations/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'fulfilled' })
		});
		if (resp.ok) {
			invalidateAll();
		}
	}

	async function executeBulkFulfill() {
		const ids = [...attrSelectedIds];
		const resp = await fetch('/api/reservations/bulk-fulfill', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ids })
		});
		if (resp.ok) {
			attrSelectedIds = new Set();
			showBulkFulfillConfirm = false;
			invalidateAll();
		}
	}

	async function viewSummary(requesterId: string) {
		const resp = await fetch(`/api/reservations/by-owner/${requesterId}`);
		if (!resp.ok) return;
		const rows = await resp.json();
		if (rows.length === 0) return;
		const firstRow = rows[0];
		summaryModal = {
			requester: firstRow.requester,
			reservations: rows.map((r: { item: { name: string; unit: string; locationName: string }; quantity: number }) => ({
				itemName: r.item.name,
				quantity: r.quantity,
				unit: r.item.unit,
				locationName: r.item.locationName
			}))
		};
	}

	let pendingDeleteId = $state<string | null>(null);

	function confirmDelete(e: MouseEvent, id: string) {
		e.stopPropagation();
		pendingDeleteId = id;
	}

	function cancelDelete() {
		pendingDeleteId = null;
	}

	async function executeDelete() {
		if (!pendingDeleteId) return;
		const resp = await fetch(`/api/inventory/${pendingDeleteId}`, { method: 'DELETE' });
		if (resp.ok) {
			const next = new Set(selectedIds);
			next.delete(pendingDeleteId);
			selectedIds = next;
			pendingDeleteId = null;
			invalidateAll();
		}
	}

	// -- Multi-select & move --
	let selectedIds = $state(new Set<string>());
	let showMoveDialog = $state(false);
	let moveLocationName = $state('');
	let moveLocationId = $state<number | null>(null);
	let moveLocationType = $state<string | null>(null);

	const allSelected = $derived(data.items.length > 0 && data.items.every((i) => selectedIds.has(i.id)));

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(data.items.map((i) => i.id));
		}
	}

	function openMoveDialog() {
		moveLocationName = '';
		moveLocationId = null;
		moveLocationType = null;
		showMoveDialog = true;
	}

	function closeMoveDialog() {
		showMoveDialog = false;
	}

	function handleMoveLocationSelect(item: Record<string, unknown>) {
		moveLocationName = item.name as string;
		moveLocationId = item.id as number;
		moveLocationType = item._kind === 'location' ? (item.type as string) : 'terminal';
	}

	let showBulkDeleteConfirm = $state(false);

	async function executeDeleteSelected() {
		await Promise.all(
			[...selectedIds].map((id) =>
				fetch(`/api/inventory/${id}`, { method: 'DELETE' })
			)
		);
		selectedIds = new Set();
		showBulkDeleteConfirm = false;
		invalidateAll();
	}

	async function executeMove() {
		if (!moveLocationName || selectedIds.size === 0) return;
		await Promise.all(
			[...selectedIds].map((id) =>
				fetch(`/api/inventory/${id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						locationName: moveLocationName,
						locationId: moveLocationId,
						locationType: moveLocationType
					})
				})
			)
		);
		selectedIds = new Set();
		showMoveDialog = false;
		invalidateAll();
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

	<TabBar {tabs} active={activeTab} onSelect={(key) => (activeTab = key)} />

	{#if activeTab === 'attributions'}
		{#if attrSelectedIds.size > 0}
			<div class="selection-bar">
				<span class="selection-count">{attrSelectedIds.size} selectionne(s)</span>
				<button class="btn-fulfill-sel" onclick={() => (showBulkFulfillConfirm = true)}>
					<span class="material-symbols-outlined">check_circle</span>
					VALIDER SELECTION
				</button>
			</div>
		{/if}
		<AttributionList
			attributions={data.attributions}
			selectedIds={attrSelectedIds}
			onToggle={toggleAttr}
			onToggleAll={toggleAllAttr}
			onViewSummary={viewSummary}
			onFulfill={fulfillReservation}
		/>
	{/if}

	{#if activeTab === 'inventory'}
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
		<TerminalCard title="DECLARER_DES_OBJETS">
			<MultiItemForm onSubmit={handleCreate} onCancel={() => showForm = false} />
		</TerminalCard>
	{/if}

	{#if data.items.length === 0}
		<div class="empty-state">
			<p class="empty-text">Aucun objet declare. Utilisez le bouton "CREER" pour commencer.</p>
		</div>
	{:else}
		{#if selectedIds.size > 0}
			<div class="selection-bar">
				<span class="selection-count">{selectedIds.size} selectionne(s)</span>
				<button class="btn-move" onclick={openMoveDialog} title="Deplacer">
					<span class="material-symbols-outlined">local_shipping</span>
					DEPLACER
				</button>
				<button class="btn-delete-sel" onclick={() => showBulkDeleteConfirm = true} title="Supprimer">
					<span class="material-symbols-outlined">delete</span>
					SUPPRIMER
				</button>
			</div>
		{/if}

		<div class="inventory-table clipped-corner">
			<table>
				<thead>
					<tr>
						<th class="th-check">
							<input type="checkbox" checked={allSelected} onchange={toggleAll} />
						</th>
						<th>ITEM</th>
						<th class="th-right">QUANTITE</th>
						<th>QUALITE</th>
						<th>TYPE</th>
						<th>LOCALISATION</th>
						<th>ACTIONS</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item}
						<tr onclick={() => goto(`/inventory/${item.id}${$page.url.search ? '?back=' + encodeURIComponent($page.url.search) : ''}`)} class="tr-clickable" class:row-selected={selectedIds.has(item.id)}>
							<td class="td-check" onclick={(e) => e.stopPropagation()}>
								<input type="checkbox" checked={selectedIds.has(item.id)} onchange={() => toggleSelect(item.id)} />
							</td>
							<td>
								<span class="item-name">{item.name.toUpperCase().replace(/ /g, '_')}</span>
							</td>
							<td class="td-right"><span class="qty-value">{formatQuantity(item.quantity, item.unit)}</span></td>
							<td><span class="quality-value">{item.quality > 0 ? item.quality : '—'}</span></td>
							<td><span class="cat-value">{item.category.toUpperCase()}</span></td>
							<td><span class="loc-value">{item.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span></td>
							<td>
								<div class="actions">
									<a href="/inventory/{item.id}{$page.url.search ? '?back=' + encodeURIComponent($page.url.search) : ''}" class="action-icon" title="Modifier" onclick={(e) => e.stopPropagation()}>
										<span class="material-symbols-outlined">edit</span>
									</a>
									<button class="action-icon action-icon-delete" title="Supprimer" onclick={(e) => confirmDelete(e, item.id)}>
										<span class="material-symbols-outlined">delete</span>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{/if}

	{#if pendingDeleteId}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_autofocus -->
		<div
			class="confirm-overlay"
			tabindex="-1"
			autofocus
			onkeydown={(e) => { if (e.key === 'Escape') cancelDelete(); else if (e.key === 'Enter') executeDelete(); }}
			onclick={cancelDelete}
		>
			<div class="confirm-dialog clipped-corner" onclick={(e) => e.stopPropagation()}>
				<p class="confirm-text">CONFIRMER LA SUPPRESSION ?</p>
				<div class="confirm-actions">
					<button class="btn-cancel-dialog" onclick={cancelDelete}>ANNULER</button>
					<button class="btn-confirm-delete" onclick={executeDelete}>SUPPRIMER</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showBulkDeleteConfirm}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="confirm-overlay"
			onkeydown={(e) => { if (e.key === 'Escape') showBulkDeleteConfirm = false; else if (e.key === 'Enter') executeDeleteSelected(); }}
			onclick={() => showBulkDeleteConfirm = false}
		>
			<div class="confirm-dialog clipped-corner" onclick={(e) => e.stopPropagation()}>
				<p class="confirm-text">SUPPRIMER {selectedIds.size} OBJET(S) ?</p>
				<div class="confirm-actions">
					<button class="btn-cancel-dialog" onclick={() => showBulkDeleteConfirm = false}>ANNULER</button>
					<button class="btn-confirm-delete" onclick={executeDeleteSelected}>SUPPRIMER</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showMoveDialog}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="confirm-overlay"
			onkeydown={(e) => { if (e.key === 'Escape') closeMoveDialog(); }}
			onclick={closeMoveDialog}
		>
			<div class="confirm-dialog move-dialog clipped-corner" onclick={(e) => e.stopPropagation()}>
				<p class="move-title">
					<span class="material-symbols-outlined move-icon">local_shipping</span>
					DEPLACER {selectedIds.size} OBJET(S)
				</p>
				<div class="move-field">
					<label class="move-label">NOUVELLE LOCALISATION</label>
					<Autocomplete
						endpoint="/api/uex/locations"
						placeholder="Rechercher un lieu..."
						value={moveLocationName}
						onSelect={handleMoveLocationSelect}
					/>
				</div>
				<div class="confirm-actions">
					<button class="btn-cancel-dialog" onclick={closeMoveDialog}>ANNULER</button>
					<button class="btn-confirm-move" onclick={executeMove} disabled={!moveLocationName}>DEPLACER</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showBulkFulfillConfirm}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="confirm-overlay"
			onkeydown={(e) => { if (e.key === 'Escape') showBulkFulfillConfirm = false; else if (e.key === 'Enter') executeBulkFulfill(); }}
			onclick={() => (showBulkFulfillConfirm = false)}
		>
			<div class="confirm-dialog clipped-corner" onclick={(e) => e.stopPropagation()}>
				<p class="confirm-text confirm-text-green">VALIDER {attrSelectedIds.size} RESERVATION(S) ?</p>
				<div class="confirm-actions">
					<button class="btn-cancel-dialog" onclick={() => (showBulkFulfillConfirm = false)}>ANNULER</button>
					<button class="btn-confirm-fulfill" onclick={executeBulkFulfill}>VALIDER</button>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if summaryModal}
	<RequesterSummaryModal
		requester={summaryModal.requester}
		reservations={summaryModal.reservations}
		onClose={() => (summaryModal = null)}
	/>
{/if}

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
	.actions { display: flex; gap: var(--space-xs); align-items: center; }
	.action-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: none;
	}
	.action-icon :global(.material-symbols-outlined) { font-size: 18px; }
	.action-icon:hover { color: var(--color-accent-cyan); }
	.action-icon-delete:hover { color: var(--color-accent-red); }

	/* -- Selection -- */
	.th-check, .td-check { width: 42px; text-align: center; }
	.td-check input, .th-check input { cursor: pointer; accent-color: var(--color-accent-cyan); width: 16px; height: 16px; }
	.row-selected { background: rgba(94, 234, 212, 0.06); }
	.row-selected:hover { background: rgba(94, 234, 212, 0.1); }
	.selection-bar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: rgba(94, 234, 212, 0.08);
		border: 1px solid rgba(94, 234, 212, 0.2);
	}
	.selection-count {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-cyan);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.btn-move {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 4px 12px;
		background: transparent;
		border: 1px solid var(--color-accent-cyan);
		color: var(--color-accent-cyan);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
	}
	.btn-move :global(.material-symbols-outlined) { font-size: 16px; }
	.btn-move:hover { background: var(--color-accent-cyan); color: var(--color-bg-primary); }
	.btn-delete-sel {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
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
	.btn-delete-sel :global(.material-symbols-outlined) { font-size: 16px; }
	.btn-delete-sel:hover { background: var(--color-accent-red); color: var(--color-bg-primary); }

	/* -- Move dialog -- */
	.move-dialog { min-width: 380px; }
	.move-title {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-family: var(--font-label);
		font-size: var(--font-size-sm);
		font-weight: 700;
		color: var(--color-accent-cyan);
		letter-spacing: 0.1em;
		text-align: center;
		justify-content: center;
	}
	.move-icon { font-size: 20px; }
	.move-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.move-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
	}
	.btn-confirm-move {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-accent-cyan);
		color: var(--color-accent-cyan);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-confirm-move:hover { background: var(--color-accent-cyan); color: var(--color-bg-primary); }
	.btn-confirm-move:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-confirm-move:disabled:hover { background: transparent; color: var(--color-accent-cyan); }

	/* -- Confirm dialog -- */
	.confirm-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.confirm-dialog {
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border-dim);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		min-width: 300px;
	}
	.confirm-text {
		font-family: var(--font-label);
		font-size: var(--font-size-sm);
		font-weight: 700;
		color: var(--color-accent-red);
		letter-spacing: 0.1em;
		text-align: center;
	}
	.confirm-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: center;
	}
	.btn-cancel-dialog {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-cancel-dialog:hover { border-color: var(--color-text-primary); color: var(--color-text-primary); }
	.btn-confirm-delete {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-accent-red);
		color: var(--color-accent-red);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-confirm-delete:hover { background: var(--color-accent-red); color: var(--color-bg-primary); }
	.btn-fulfill-sel {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 4px 12px;
		background: transparent;
		border: 1px solid var(--color-accent-green, #00fc40);
		color: var(--color-accent-green, #00fc40);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
	}
	.btn-fulfill-sel :global(.material-symbols-outlined) { font-size: 16px; }
	.btn-fulfill-sel:hover { background: var(--color-accent-green, #00fc40); color: var(--color-bg-primary); }
	.confirm-text-green { color: var(--color-accent-green, #00fc40); }
	.btn-confirm-fulfill {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-accent-green, #00fc40);
		color: var(--color-accent-green, #00fc40);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-confirm-fulfill:hover { background: var(--color-accent-green, #00fc40); color: var(--color-bg-primary); }
</style>
