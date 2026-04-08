<script lang="ts">
	interface Item {
		id: string;
		name: string;
		quantity: number;
		unit: string;
		locationName: string;
		quality: number;
		username: string;
	}

	interface Props {
		item: Item;
		available: number;
		onSubmit: (data: { inventoryItemId: string; quantity: number }) => void;
		onClose: () => void;
	}

	let { item, available, onSubmit, onClose }: Props = $props();

	let quantity = $state(Math.min(1, available));

	function clamp(val: number) {
		return Math.max(0.01, Math.min(available, val));
	}

	function setMax() {
		quantity = available;
	}

	function handleSubmit() {
		if (quantity <= 0 || quantity > available) return;
		onSubmit({ inventoryItemId: item.id, quantity });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="confirm-overlay"
	onkeydown={handleKeydown}
	onclick={onClose}
	tabindex="-1"
>
	<div class="modal-dialog clipped-corner" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<span class="modal-title">// RESERVATION</span>
			<button class="modal-close" onclick={onClose} aria-label="Fermer">✕</button>
		</div>

		<div class="modal-body">
			<div class="item-info">
				<div class="info-row">
					<span class="info-label">ITEM</span>
					<span class="info-value">{item.name.toUpperCase().replace(/ /g, '_')}</span>
				</div>
				<div class="info-row">
					<span class="info-label">PROPRIETAIRE</span>
					<span class="info-value">{item.username.toUpperCase()}</span>
				</div>
				<div class="info-row">
					<span class="info-label">LOCALISATION</span>
					<span class="info-value">{item.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span>
				</div>
				{#if item.quality > 0}
					<div class="info-row">
						<span class="info-label">QUALITE</span>
						<span class="info-value">{item.quality}</span>
					</div>
				{/if}
				<div class="info-row">
					<span class="info-label">DISPONIBLE</span>
					<span class="info-value avail">{available} {item.unit}</span>
				</div>
			</div>

			<div class="qty-section">
				<label class="qty-label">QUANTITE A RESERVER</label>
				<div class="qty-controls">
					<input
						type="number"
						bind:value={quantity}
						min="0.01"
						max={available}
						step="0.01"
						class="qty-input"
						oninput={() => { quantity = clamp(quantity); }}
					/>
					<button class="btn-max" onclick={setMax}>MAX</button>
				</div>
				<input
					type="range"
					bind:value={quantity}
					min="0"
					max={available}
					step="0.01"
					class="qty-slider"
				/>
				<div class="qty-display">
					<span class="qty-fraction">{quantity} / {available} {item.unit}</span>
				</div>
			</div>
		</div>

		<div class="modal-actions">
			<button class="btn-cancel" onclick={onClose}>ANNULER</button>
			<button class="btn-reserve" onclick={handleSubmit} disabled={quantity <= 0 || quantity > available}>
				RESERVER
			</button>
		</div>
	</div>
</div>

<style>
	.confirm-overlay {
		position: fixed;
		inset: 0;
		z-index: 200;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-dialog {
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border-dim);
		min-width: 380px;
		max-width: 480px;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
		background: var(--color-bg-secondary);
	}

	.modal-title {
		font-family: var(--font-label);
		font-size: var(--font-size-sm);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	.modal-close {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: var(--font-size-sm);
		padding: 4px;
	}
	.modal-close:hover {
		color: var(--color-accent-red);
	}

	.modal-body {
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-md);
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-md);
	}

	.info-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		color: rgba(255, 193, 93, 0.5);
		letter-spacing: 0.15em;
		white-space: nowrap;
	}

	.info-value {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		text-align: right;
	}

	.info-value.avail {
		color: var(--color-accent-cyan);
		font-weight: 700;
	}

	.qty-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.qty-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
	}

	.qty-controls {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.qty-input {
		flex: 1;
		padding: 7px 10px;
		background: var(--color-bg-secondary);
		border: none;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
	}
	.qty-input:focus {
		outline: none;
		border-bottom-color: var(--color-accent-cyan);
	}

	.btn-max {
		padding: 7px 14px;
		background: transparent;
		border: 1px solid var(--color-accent-gold);
		color: var(--color-accent-gold);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
	}
	.btn-max:hover {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
	}

	.qty-slider {
		width: 100%;
		accent-color: var(--color-accent-cyan);
		cursor: pointer;
	}

	.qty-display {
		text-align: center;
	}

	.qty-fraction {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-accent-cyan);
	}

	.modal-actions {
		display: flex;
		gap: var(--space-sm);
		justify-content: center;
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid rgba(72, 72, 73, 0.2);
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
		border-color: var(--color-text-primary);
		color: var(--color-text-primary);
	}

	.btn-reserve {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-accent-cyan);
		color: var(--color-accent-cyan);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-reserve:hover {
		background: var(--color-accent-cyan);
		color: var(--color-bg-primary);
	}
	.btn-reserve:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn-reserve:disabled:hover {
		background: transparent;
		color: var(--color-accent-cyan);
	}
</style>
