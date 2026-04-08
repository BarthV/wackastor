<script lang="ts">
	import Autocomplete from '$lib/components/ui/Autocomplete.svelte';

	interface RowData {
		id: string;
		category: string;
		name: string;
		quantity: number;
		unit: string;
		quality: number;
		hasQuality: boolean;
		uexCommodityId: number | null;
		uexItemId: number | null;
	}

	interface Props {
		onSubmit: (items: Record<string, unknown>[]) => void;
		onCancel?: () => void;
	}

	let { onSubmit, onCancel }: Props = $props();

	const CATEGORIES = [
		{ value: 'commodity', label: 'Commodite' },
		{ value: 'item', label: 'Objet' },
		{ value: 'equipment', label: 'Equipement' },
		{ value: 'other', label: 'Autre' }
	];

	const DEFAULT_UNIT: Record<string, string> = {
		commodity: 'SCU', item: 'unit', equipment: 'unit', other: 'unit'
	};

	const AUTOCOMPLETE_CONFIG: Record<string, { endpoint: string; placeholder: string } | null> = {
		commodity: { endpoint: '/api/uex/commodities', placeholder: 'Commodite...' },
		item: { endpoint: '/api/uex/items', placeholder: 'Objet...' },
		equipment: { endpoint: '/api/uex/items', placeholder: 'Equipement...' },
		other: null
	};

	// -- Shared location
	let locationName = $state('');
	let locationId = $state<number | null>(null);
	let locationType = $state<string | null>(null);

	function handleLocationSelect(item: Record<string, unknown>) {
		locationName = item.name as string;
		locationId = item.id as number;
		locationType = item._kind === 'location' ? (item.type as string) : 'terminal';
	}

	// -- Rows
	function newRow(): RowData {
		return {
			id: crypto.randomUUID(),
			category: 'commodity',
			name: '',
			quantity: 1,
			unit: 'SCU',
			quality: 0,
			hasQuality: false,
			uexCommodityId: null,
			uexItemId: null
		};
	}

	let rows = $state<RowData[]>([newRow()]);

	function addRow() {
		rows.push(newRow());
	}

	function removeRow(index: number) {
		rows.splice(index, 1);
		if (rows.length === 0) rows.push(newRow());
	}

	function handleCategoryChange(index: number, category: string) {
		const row = rows[index];
		row.category = category;
		row.name = '';
		row.unit = DEFAULT_UNIT[category] ?? 'SCU';
		row.quality = 0;
		row.hasQuality = false;
		row.uexCommodityId = null;
		row.uexItemId = null;
	}

	function handleCommoditySelect(index: number, item: Record<string, unknown>) {
		const row = rows[index];
		row.name = item.name as string;
		row.uexCommodityId = item.id as number;
		row.uexItemId = null;
		row.unit = (item.unit as string) ?? 'SCU';
		row.hasQuality = (item.hasQuality as boolean) ?? false;
	}

	function handleItemSelect(index: number, item: Record<string, unknown>) {
		const row = rows[index];
		row.name = item.name as string;
		row.uexItemId = item.id as number;
		row.uexCommodityId = null;
		row.unit = 'unit';
	}

	function handleRowKeydown(e: KeyboardEvent, index: number) {
		if (e.ctrlKey && e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (index === rows.length - 1) addRow();
		}
	}

	function handleContainerKeydown(e: KeyboardEvent) {
		if (e.ctrlKey && e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}

	function handleSubmit() {
		const validRows = rows.filter((r) => r.name.trim() !== '');
		if (validRows.length === 0) return;
		onSubmit(
			validRows.map((r) => ({
				name: r.name,
				category: r.category,
				quantity: r.unit !== 'SCU' ? Math.round(r.quantity) : r.quantity,
				unit: r.unit,
				locationName,
				locationId,
				locationType,
				quality: r.hasQuality ? r.quality : 0,
				notes: null,
				uexCommodityId: r.uexCommodityId,
				uexItemId: r.uexItemId
			}))
		);
	}

	const validCount = $derived(rows.filter((r) => r.name).length);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
	class="multi-form"
	onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}
	onkeydown={handleContainerKeydown}
>
	<div class="form-header">
		<span class="section-label">// CREER — {validCount}/{rows.length} ligne(s)</span>
		<span class="section-hint">Entree: ajouter · Ctrl+Entree: valider</span>
	</div>

	<div class="location-field">
		<label class="field-label">EMPLACEMENT COMMUN</label>
		<Autocomplete
			endpoint="/api/uex/locations"
			placeholder="Rechercher un lieu..."
			value={locationName}
			onSelect={handleLocationSelect}
		/>
	</div>

	<div class="rows-list">
		{#each rows as row, index (row.id)}
			<div class="row-entry">
				<select
					class="row-select"
					value={row.category}
					onchange={(e) => handleCategoryChange(index, (e.target as HTMLSelectElement).value)}
				>
					{#each CATEGORIES as cat}
						<option value={cat.value}>{cat.label}</option>
					{/each}
				</select>

				<div class="row-name">
					{#key row.id + row.category}
						{#if AUTOCOMPLETE_CONFIG[row.category]}
							<Autocomplete
								endpoint={AUTOCOMPLETE_CONFIG[row.category]!.endpoint}
								placeholder={AUTOCOMPLETE_CONFIG[row.category]!.placeholder}
								value={row.name}
								onSelect={row.category === 'commodity'
									? (item) => handleCommoditySelect(index, item)
									: (item) => handleItemSelect(index, item)}
							/>
						{:else}
							<input
								type="text"
								class="row-input"
								placeholder="Nom..."
								value={row.name}
								oninput={(e) => { row.name = (e.target as HTMLInputElement).value; }}
							/>
						{/if}
					{/key}
				</div>

				<div class="row-qty">
					<input
						type="number"
						class="row-input row-input-num"
						value={row.quantity}
						min="0"
						step={row.unit === 'SCU' ? '0.01' : '1'}
						oninput={(e) => {
							const v = Number((e.target as HTMLInputElement).value);
							row.quantity = row.unit !== 'SCU' ? Math.round(v) : v;
						}}
						onkeydown={(e) => handleRowKeydown(e, index)}
					/>
					<span class="unit-badge">{row.unit}</span>
				</div>

				{#if row.hasQuality}
					<div class="row-quality">
						<input
							type="number"
							class="row-input row-input-num"
							value={row.quality}
							min="0"
							max="1000"
							step="1"
							placeholder="Qualite"
							oninput={(e) => { row.quality = Number((e.target as HTMLInputElement).value); }}
							onkeydown={(e) => handleRowKeydown(e, index)}
						/>
					</div>
				{/if}

				<button
					type="button"
					class="btn-remove"
					tabindex="-1"
					onclick={() => removeRow(index)}
					aria-label="Supprimer cette ligne"
				>✕</button>
			</div>
		{/each}
	</div>

	<div class="form-actions">
		<button type="button" class="btn-add-row" onclick={addRow}>+ LIGNE</button>
		<div class="actions-right">
			{#if onCancel}
				<button type="button" class="btn-cancel" onclick={onCancel}>ANNULER</button>
			{/if}
			<button type="submit" class="btn-confirm">VALIDER ({validCount})</button>
		</div>
	</div>
</form>

<style>
	.multi-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.form-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-md);
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
	.section-hint {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.05em;
	}

	/* -- Location shared field -- */
	.location-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.field-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
	}

	/* -- Rows -- */
	.rows-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.row-entry {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.row-select {
		width: 110px;
		flex-shrink: 0;
		padding: 5px 8px;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
	}
	.row-select:focus {
		outline: none;
		border-color: var(--color-accent-orange);
	}
	.row-name {
		flex: 1;
		min-width: 200px;
		position: relative;
	}
	.row-input {
		width: 100%;
		padding: 5px 8px;
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
	}
	.row-input:focus {
		outline: none;
		border-color: var(--color-accent-orange);
	}
	.row-input-num {
		width: 80px;
		text-align: right;
	}
	.row-qty {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}
	.unit-badge {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--color-accent-cyan);
		text-transform: uppercase;
		white-space: nowrap;
		min-width: 32px;
	}
	.row-quality {
		flex-shrink: 0;
	}
	.btn-remove {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--font-size-xs);
		padding: 2px 6px;
		flex-shrink: 0;
	}
	.btn-remove:hover { color: var(--color-accent-red); }

	/* -- Actions -- */
	.form-actions {
		display: flex;
		padding-top: var(--space-xs);
		align-items: center;
		justify-content: space-between;
	}
	.actions-right {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}
	.btn-add-row {
		padding: var(--space-xs) var(--space-md);
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		letter-spacing: 0.1em;
		cursor: pointer;
	}
	.btn-add-row:hover {
		border-color: var(--color-accent-gold);
		color: var(--color-accent-gold);
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
