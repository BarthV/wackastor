<script lang="ts">
	interface ReservationSummary {
		itemName: string;
		quantity: number;
		unit: string;
		locationName: string;
	}

	interface Requester {
		username: string;
		discordId: string;
	}

	interface Props {
		requester: Requester;
		reservations: ReservationSummary[];
		onClose: () => void;
	}

	let { requester, reservations, onClose }: Props = $props();

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
			<div>
				<span class="modal-title">// RESUME_DEMANDEUR</span>
				<div class="modal-subtitle">{requester.username.toUpperCase()}</div>
			</div>
			<button class="modal-close" onclick={onClose} aria-label="Fermer">✕</button>
		</div>

		<div class="modal-body">
			{#if reservations.length === 0}
				<p class="empty-text">Aucune reservation active.</p>
			{:else}
				<div class="res-list">
					{#each reservations as res}
						<div class="res-row">
							<div class="res-info">
								<span class="res-name">{res.itemName.toUpperCase().replace(/ /g, '_')}</span>
								<span class="res-loc">{res.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span>
							</div>
							<span class="res-qty">{res.quantity} {res.unit}</span>
						</div>
					{/each}
				</div>
			{/if}

			<a
				href="https://discord.com/users/{requester.discordId}"
				target="_blank"
				rel="noopener"
				class="discord-link"
			>
				<span class="material-symbols-outlined">chat</span>
				MESSAGE DISCORD
			</a>
		</div>

		<div class="modal-actions">
			<button class="btn-close" onclick={onClose}>FERMER</button>
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
		min-width: 360px;
		max-width: 500px;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
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

	.modal-subtitle {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-accent-cyan);
		margin-top: 2px;
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
		gap: var(--space-md);
	}

	.empty-text {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		text-align: center;
	}

	.res-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: rgba(72, 72, 73, 0.2);
	}

	.res-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-secondary);
		gap: var(--space-md);
	}

	.res-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.res-name {
		font-weight: 700;
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}

	.res-loc {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.res-qty {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-accent-cyan);
		white-space: nowrap;
	}

	.discord-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border: 1px solid rgba(88, 101, 242, 0.6);
		color: rgba(88, 101, 242, 0.9);
		text-decoration: none;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		transition: background 75ms;
	}

	.discord-link :global(.material-symbols-outlined) {
		font-size: 16px;
	}

	.discord-link:hover {
		background: rgba(88, 101, 242, 0.15);
	}

	.modal-actions {
		display: flex;
		justify-content: center;
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid rgba(72, 72, 73, 0.2);
	}

	.btn-close {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		cursor: pointer;
	}
	.btn-close:hover {
		border-color: var(--color-text-primary);
		color: var(--color-text-primary);
	}
</style>
