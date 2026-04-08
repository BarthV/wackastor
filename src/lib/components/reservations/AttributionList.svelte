<script lang="ts">
	interface Attribution {
		id: string;
		quantity: number;
		status: string;
		item: { name: string; locationName: string; unit: string };
		requester: { id: string; username: string; discordId: string };
	}

	interface Props {
		attributions: Attribution[];
		selectedIds: Set<string>;
		onToggle: (id: string) => void;
		onToggleAll: () => void;
		onViewSummary: (requesterId: string) => void;
		onFulfill: (id: string) => void;
	}

	let { attributions, selectedIds, onToggle, onToggleAll, onViewSummary, onFulfill }: Props = $props();

	const allSelected = $derived(attributions.length > 0 && attributions.every((a) => selectedIds.has(a.id)));
</script>

{#if attributions.length === 0}
	<div class="empty-state">
		<p class="empty-text">Aucune reservation en attente.</p>
	</div>
{:else}
	<div class="attr-table clipped-corner">
		<table>
			<thead>
				<tr>
					<th class="th-check">
						<input type="checkbox" checked={allSelected} onchange={onToggleAll} />
					</th>
					<th>ITEM</th>
					<th>DEMANDEUR</th>
					<th class="th-right">QUANTITE</th>
					<th>ACTIONS</th>
				</tr>
			</thead>
			<tbody>
				{#each attributions as attr}
					<tr class:row-selected={selectedIds.has(attr.id)}>
						<td class="td-check" onclick={(e) => e.stopPropagation()}>
							<input
								type="checkbox"
								checked={selectedIds.has(attr.id)}
								onchange={() => onToggle(attr.id)}
							/>
						</td>
						<td>
							<div class="cell-stack">
								<span class="item-name">{attr.item.name.toUpperCase().replace(/ /g, '_')}</span>
								<span class="item-loc">{attr.item.locationName?.toUpperCase().replace(/ /g, '_') || '—'}</span>
							</div>
						</td>
						<td>
							<span class="requester-name">{attr.requester.username.toUpperCase()}</span>
						</td>
						<td class="td-right">
							<span class="qty-value">{attr.quantity} {attr.item.unit}</span>
						</td>
						<td>
							<div class="actions">
								<button
									class="btn-fulfill"
									onclick={() => onFulfill(attr.id)}
									title="Valider"
								>
									<span class="material-symbols-outlined">check</span>
									VALIDER
								</button>
								<button
									class="btn-summary"
									onclick={() => onViewSummary(attr.requester.id)}
									title="Résumé"
								>
									<span class="material-symbols-outlined">person</span>
									RESUME
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
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

	.attr-table {
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

	.th-check,
	.td-check {
		width: 42px;
		text-align: center;
	}

	.td-check input,
	.th-check input {
		cursor: pointer;
		accent-color: var(--color-accent-cyan);
		width: 16px;
		height: 16px;
	}

	.row-selected {
		background: rgba(94, 234, 212, 0.06);
	}

	.row-selected:hover {
		background: rgba(94, 234, 212, 0.1);
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

	.item-loc {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}

	.requester-name {
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-text-primary);
	}

	.qty-value {
		font-family: var(--font-mono);
		color: var(--color-accent-cyan);
		font-size: var(--font-size-sm);
	}

	.actions {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
	}

	.btn-fulfill {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		background: transparent;
		border: 1px solid var(--color-accent-green, #00fc40);
		color: var(--color-accent-green, #00fc40);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
	}

	.btn-fulfill :global(.material-symbols-outlined) {
		font-size: 14px;
	}

	.btn-fulfill:hover {
		background: var(--color-accent-green, #00fc40);
		color: var(--color-bg-primary);
	}

	.btn-summary {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
	}

	.btn-summary :global(.material-symbols-outlined) {
		font-size: 14px;
	}

	.btn-summary:hover {
		border-color: var(--color-accent-cyan);
		color: var(--color-accent-cyan);
	}
</style>
