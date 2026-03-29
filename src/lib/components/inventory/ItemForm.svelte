<script lang="ts">
	import Autocomplete from '$lib/components/ui/Autocomplete.svelte';

	interface Props {
		mode: 'create' | 'edit';
		initial?: {
			name?: string;
			category?: string;
			quantity?: number;
			unit?: string;
			locationName?: string;
			quality?: number;
			notes?: string;
			uexCommodityId?: number | null;
			uexItemId?: number | null;
			locationId?: number | null;
			locationType?: string | null;
		};
		onSubmit: (data: Record<string, unknown>) => void;
		onCancel?: () => void;
		initialHasQuality?: boolean;
	}

	let { mode, initial, onSubmit, onCancel, initialHasQuality = false }: Props = $props();

	let name = $state(initial?.name ?? '');
	let category = $state(initial?.category ?? 'commodity');
	let quantity = $state(initial?.quantity ?? 1);
	let unit = $state(initial?.unit ?? 'SCU');
	let locationName = $state(initial?.locationName ?? '');
	let quality = $state<number>(initial?.quality ?? 0);
	let hasQuality = $state(initialHasQuality);
	let notes = $state(initial?.notes ?? '');
	let uexCommodityId = $state<number | null>(initial?.uexCommodityId ?? null);
	let uexItemId = $state<number | null>(initial?.uexItemId ?? null);
	let locationId = $state<number | null>(initial?.locationId ?? null);
	let locationType = $state<string | null>(initial?.locationType ?? null);

	const CATEGORIES = [
		{ value: 'commodity',  label: 'Commodite' },
		{ value: 'item',       label: 'Objet' },
		{ value: 'equipment',  label: 'Equipement' },
		{ value: 'other',      label: 'Autre' }
	];

	const autocompleteConfig: Record<string, { endpoint: string; placeholder: string } | null> = {
		commodity:  { endpoint: '/api/uex/commodities', placeholder: 'Rechercher une commodite...' },
		item:       { endpoint: '/api/uex/items',       placeholder: 'Rechercher un objet...' },
		equipment:  { endpoint: '/api/uex/items',       placeholder: 'Rechercher un equipement...' },
		other:      null
	};

	const DEFAULT_UNIT: Record<string, string> = {
		commodity: 'SCU', item: 'unit', equipment: 'unit', other: 'unit'
	};

	function handleCategoryChange() {
		name = '';
		quality = 0;
		hasQuality = false;
		unit = DEFAULT_UNIT[category] ?? 'SCU';
		uexCommodityId = null;
		uexItemId = null;
	}

	function handleCommoditySelect(item: Record<string, unknown>) {
		name = item.name as string;
		uexCommodityId = item.id as number;
		uexItemId = null;
		unit = (item.unit as string) ?? 'SCU';
		hasQuality = (item.hasQuality as boolean) ?? false;
	}

	function handleItemSelect(item: Record<string, unknown>) {
		name = item.name as string;
		uexItemId = item.id as number;
		uexCommodityId = null;
		unit = 'unit';
	}

	function handleLocationSelect(item: Record<string, unknown>) {
		locationName = item.name as string;
		if (item._kind === 'location') {
			locationId = item.id as number;
			locationType = item.type as string;
		} else {
			locationId = item.id as number;
			locationType = 'terminal';
		}
	}

	function handleSubmit() {
		onSubmit({
			name,
			category,
			quantity,
			unit,
			locationName,
			locationId,
			locationType,
			quality: category === 'commodity' ? quality : 0,
			notes: notes || null,
			uexCommodityId,
			uexItemId
		});
	}
</script>

<form class="item-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
	<div class="form-section">
		<span class="section-label">// {mode === 'create' ? 'CREER' : 'MODIFIER'}</span>
	</div>

	<div class="form-group">
		<label class="form-label" for="item-type">Type</label>
		<select id="item-type" bind:value={category} onchange={handleCategoryChange} class="form-select">
			{#each CATEGORIES as cat}
				<option value={cat.value}>{cat.label}</option>
			{/each}
		</select>
	</div>

	<div class="form-group">
		<label class="form-label">Nom</label>
		{#key category}
			{#if autocompleteConfig[category]}
				<Autocomplete
					endpoint={autocompleteConfig[category]!.endpoint}
					placeholder={autocompleteConfig[category]!.placeholder}
					value={name}
					onSelect={category === 'commodity' ? handleCommoditySelect : handleItemSelect}
				/>
			{:else}
				<input type="text" bind:value={name} class="form-input" placeholder="Nom de l'objet" />
			{/if}
		{/key}
	</div>

	<div class="form-row">
		<div class="form-group flex-1">
			<label class="form-label" for="item-qty">Quantite</label>
			<input id="item-qty" type="number" bind:value={quantity} min="0" step="0.01" class="form-input" />
		</div>
		{#if hasQuality}
			<div class="form-group flex-1">
				<label class="form-label" for="item-quality">Qualite</label>
				<input id="item-quality" type="number" bind:value={quality} min="0" max="1000" step="1" class="form-input" />
			</div>
		{/if}
	</div>

	<div class="form-group">
		<label class="form-label">Emplacement</label>
		<Autocomplete
			endpoint="/api/uex/locations"
			placeholder="Rechercher un lieu..."
			value={locationName}
			onSelect={handleLocationSelect}
		/>
	</div>

	<div class="form-group">
		<label class="form-label" for="item-notes">Notes</label>
		<textarea id="item-notes" bind:value={notes} class="form-textarea" rows="2" placeholder="Notes optionnelles..."></textarea>
	</div>

	<div class="form-actions">
		<button type="submit" class="btn-confirm">
			{mode === 'create' ? 'Ajouter' : 'Enregistrer'}
		</button>
		{#if onCancel}
			<button type="button" class="btn-cancel" onclick={onCancel}>Annuler</button>
		{/if}
	</div>
</form>

<style>
	.item-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.form-section {
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid var(--color-border);
	}
	.section-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-accent-orange);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.form-row {
		display: flex;
		gap: var(--space-md);
	}
	.flex-1 {
		flex: 1;
	}
	.form-label {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.form-input,
	.form-select,
	.form-textarea {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
	}
	.form-input:focus,
	.form-select:focus,
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-accent-orange);
	}
	.form-textarea {
		resize: vertical;
	}
	.form-actions {
		display: flex;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
	}
	.btn-confirm {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-accent-green);
		color: var(--color-accent-green);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-confirm:hover {
		background: var(--color-accent-green);
		color: var(--color-bg-primary);
	}
	.btn-cancel {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-cancel:hover {
		border-color: var(--color-accent-red);
		color: var(--color-accent-red);
	}
</style>
