<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>WACKASTOR - Administration</title>
</svelte:head>

<SectionHeader title="ADMINISTRATION" />

<div class="dashboard-grid">
	<a href="/admin/members" class="dashboard-card clipped-corner">
		<span class="material-symbols-outlined card-icon">group</span>
		<span class="card-title">MEMBRES</span>
		<span class="card-desc">Gerer les membres et les roles de la corporation</span>
	</a>
	<a href="/admin/sync" class="dashboard-card clipped-corner">
		<span class="material-symbols-outlined card-icon">sync</span>
		<span class="card-title">SYNCHRONISATION_UEX</span>
		<span class="card-desc">Statut des donnees et synchronisation manuelle</span>
	</a>
	{#if data.isSuperadmin}
		<a href="/admin/corporations" class="dashboard-card clipped-corner superadmin-card">
			<span class="material-symbols-outlined card-icon">corporate_fare</span>
			<span class="card-title">CORPORATIONS</span>
			<span class="card-desc">Initialiser et gerer les corporations [SUPERADMIN]</span>
		</a>
		<a href="/admin/units" class="dashboard-card clipped-corner superadmin-card">
			<span class="material-symbols-outlined card-icon">scale</span>
			<span class="card-title">UNITES_COMMODITES</span>
			<span class="card-desc">Definir l'unite par defaut de chaque commodite [SUPERADMIN]</span>
		</a>
	{/if}
</div>

<style>
	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-md);
		margin-top: var(--space-md);
	}
	.dashboard-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-xl);
		border: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-tertiary);
		text-decoration: none;
		position: relative;
		overflow: hidden;
	}
	.dashboard-card::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 64px;
		height: 64px;
		background: rgba(255, 193, 93, 0.05);
		transform: rotate(-45deg) translate(32px, -32px);
	}
	.dashboard-card:hover {
		border-color: var(--color-border-dim);
	}
	.superadmin-card .card-icon { color: var(--color-accent-red); }
	.card-icon {
		font-size: 28px;
		color: var(--color-accent-cyan);
	}
	.card-title {
		font-family: var(--font-headline);
		font-size: var(--font-size-md);
		color: var(--color-text-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	.card-desc {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
</style>
