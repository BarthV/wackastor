<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TerminalCard from '$lib/components/ui/TerminalCard.svelte';
	import ItemForm from '$lib/components/inventory/ItemForm.svelte';
	import { goto } from '$app/navigation';

	async function handleCreate(formData: Record<string, unknown>) {
		const resp = await fetch('/api/orders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		});
		if (resp.ok) {
			const { data } = await resp.json();
			goto(`/commandes/${data.id}`);
		}
	}
</script>

<svelte:head>
	<title>WACKASTOR - Nouvelle commande</title>
</svelte:head>

<div class="new-order-page">
	<SectionHeader number="02" title="NOUVELLE COMMANDE" />

	<TerminalCard>
		<ItemForm
			mode="create"
			onSubmit={handleCreate}
			onCancel={() => goto('/commandes')}
		/>
	</TerminalCard>
</div>

<style>
	.new-order-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
</style>
