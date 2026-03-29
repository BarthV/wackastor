<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TerminalCard from '$lib/components/ui/TerminalCard.svelte';
	import ItemForm from '$lib/components/inventory/ItemForm.svelte';
	import { goto, invalidateAll } from '$app/navigation';

	let { data } = $props();

	async function handleUpdate(formData: Record<string, unknown>) {
		const resp = await fetch(`/api/inventory/${data.item.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		});
		if (resp.ok) {
			goto(data.backUrl);
		}
	}

	async function handleDelete() {
		const resp = await fetch(`/api/inventory/${data.item.id}`, { method: 'DELETE' });
		if (resp.ok) {
			goto(data.backUrl);
		}
	}
</script>

<svelte:head>
	<title>WACKASTOR - {data.item.name}</title>
</svelte:head>

<div class="detail-page">
	<div class="page-header">
		<SectionHeader title="MODIFIER OBJET" />
		<div class="header-actions">
			<a href={data.backUrl} class="btn-back">RETOUR</a>
			<button class="btn-delete" onclick={handleDelete}>SUPPRIMER</button>
		</div>
	</div>

	<TerminalCard title="EDITION">
		<ItemForm
			mode="edit"
			initial={{
				name: data.item.name,
				category: data.item.category,
				quantity: data.item.quantity,
				unit: data.item.unit,
				locationName: data.item.locationName,
				quality: data.item.quality,
				notes: data.item.notes ?? '',
				uexCommodityId: data.item.uexCommodityId,
				uexItemId: data.item.uexItemId,
				locationId: data.item.locationId,
				locationType: data.item.locationType
			}}
			initialHasQuality={data.hasQuality}
			onSubmit={handleUpdate}
			onCancel={() => goto('/inventory')}
		/>
	</TerminalCard>
</div>

<style>
	.detail-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
	}
	.header-actions {
		display: flex;
		gap: var(--space-sm);
	}
	.btn-back {
		padding: 8px 16px;
		border: 1px solid var(--color-border-dim);
		color: var(--color-text-secondary);
		background: var(--color-bg-panel);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		text-decoration: none;
		letter-spacing: 0.15em;
	}
	.btn-back:hover {
		color: var(--color-accent-gold);
		background: rgba(255, 193, 93, 0.1);
	}
	.btn-delete {
		padding: 8px 16px;
		background: transparent;
		border: 1px solid var(--color-accent-red);
		color: var(--color-accent-red);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		cursor: pointer;
	}
	.btn-delete:hover {
		background: var(--color-accent-red);
		color: var(--color-bg-primary);
	}
</style>
