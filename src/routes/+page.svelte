<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TerminalCard from '$lib/components/ui/TerminalCard.svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	let { data } = $props();

	const authenticated = $derived(!!data.user);

	// Glitch character pools for redacted text
	const glyphPool = 'ЖЩФЫДЦПНШБЧξψωΣΔΩ¥§Ø₿∆∑∂λ░▒▓█▄▀■◆◇●○';
	const digitPool = '0123456789';

	function redactString(original: string): string {
		const len = Math.max(3, original.length + Math.floor(Math.random() * 5) - 2);
		let out = '';
		for (let i = 0; i < len; i++) {
			out += glyphPool[Math.floor(Math.random() * glyphPool.length)];
		}
		return out;
	}

	function redactNumber(): number {
		return Math.floor(Math.random() * 999) + 1;
	}

	const baseRows = [
		{ name: 'Quantanium', quantity: 32, location: 'ARC-L1', status: 'En stock' },
		{ name: 'Laranite', quantity: 8, location: 'HUR-L2', status: 'En transit' },
		{ name: 'Agricium', quantity: 15, location: 'MIC-L1', status: 'En stock' },
		{ name: 'Bexalite', quantity: 4, location: 'CRU-L5', status: 'Reserve' },
		{ name: 'Taranite', quantity: 22, location: 'ARC-L3', status: 'En stock' },
		{ name: 'Hadanite', quantity: 61, location: 'MIC-L2', status: 'En transit' }
	];

	const columns = [
		{ key: 'name', label: 'Ressource' },
		{ key: 'quantity', label: 'Quantite' },
		{ key: 'location', label: 'Emplacement' },
		{ key: 'status', label: 'Statut' }
	];

	const rows = $derived(
		authenticated
			? baseRows
			: baseRows.map((r) => ({
					name: redactString(r.name),
					quantity: redactNumber(),
					location: redactString(r.location),
					status: redactString(r.status)
				}))
	);

	const statusLabels = $derived(
		authenticated
			? [
					{ label: 'Synchronisation UEXcorp', variant: 'success' as const, text: 'Actif' },
					{ label: 'Base de donnees', variant: 'success' as const, text: 'Connecte' },
					{ label: 'Commandes en attente', variant: 'warning' as const, text: '3 en cours' },
					{ label: 'Alertes', variant: 'error' as const, text: '1 critique' },
					{ label: 'Notifications', variant: 'info' as const, text: '5 nouvelles' }
				]
			: [
					{ label: redactString('Synchronisation'), variant: 'success' as const, text: redactString('Actif') },
					{ label: redactString('Base de donnees'), variant: 'info' as const, text: redactString('OK') },
					{ label: redactString('Commandes'), variant: 'warning' as const, text: redactString('En cours') },
					{ label: redactString('Alertes'), variant: 'error' as const, text: redactString('Critique') },
					{ label: redactString('Notifications'), variant: 'info' as const, text: redactString('Nouvelles') }
				]
	);
</script>

<svelte:head>
	<title>WACKASTOR - Gestionnaire d'inventaire</title>
</svelte:head>

<div class="page-landing">
	<div class="hero">
		<h1 class="hero-title">WACKASTOR</h1>
		<p class="hero-subtitle">Systeme de gestion d'inventaire de corporation</p>
	</div>

	<SectionHeader title="Statut" number="001" />

	{#if !authenticated}
		<div class="classified-banner">
			<span class="material-symbols-outlined classified-icon">lock</span>
			<span class="classified-text">DONNEES CLASSIFIEES — AUTHENTIFICATION REQUISE</span>
			<a href="/login" class="classified-link">ACCEDER</a>
		</div>
	{/if}

	<div class="grid" class:redacted={!authenticated}>
		<TerminalCard title="Apercu de l'inventaire" number="01">
			<DataTable {columns} {rows} />
		</TerminalCard>

		<TerminalCard title="Etats des operations" number="02">
			<div class="status-list">
				{#each statusLabels as s}
					<div class="status-row">
						<span class="status-label" class:redacted-text={!authenticated}>{s.label}</span>
						<Badge variant={s.variant} label={s.text} />
					</div>
				{/each}
			</div>
		</TerminalCard>
	</div>
</div>

<style>
	.page-landing {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.hero {
		text-align: center;
		padding: var(--space-2xl) 0 var(--space-lg);
	}
	.hero-title {
		font-family: var(--font-condensed);
		font-size: var(--font-size-2xl);
		font-weight: 700;
		color: var(--color-accent-orange);
		letter-spacing: 0.2em;
	}
	.hero-subtitle {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		margin-top: var(--space-sm);
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);
	}
	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
	.status-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.status-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-xs) 0;
		border-bottom: 1px solid var(--color-border);
	}
	.status-row:last-child {
		border-bottom: none;
	}
	.status-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	/* ── Classified banner ── */
	.classified-banner {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid rgba(255, 115, 81, 0.4);
		background: rgba(255, 115, 81, 0.08);
	}
	.classified-icon {
		font-size: 18px;
		color: var(--color-accent-red);
	}
	.classified-text {
		flex: 1;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-red);
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}
	.classified-link {
		padding: 6px 16px;
		border: 1px solid var(--color-accent-gold);
		color: var(--color-accent-gold);
		background: transparent;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		text-decoration: none;
	}
	.classified-link:hover {
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
	}

	/* ── Redacted effect ── */
	.redacted :global(td),
	.redacted :global(th),
	.redacted-text {
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		opacity: 0.6;
		user-select: none;
		letter-spacing: 0.05em;
	}
	.redacted {
		position: relative;
	}
	.redacted::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(14, 14, 15, 0.15) 2px,
			rgba(14, 14, 15, 0.15) 4px
		);
		animation: redacted-flicker 4s infinite;
	}
	@keyframes redacted-flicker {
		0%, 95%, 100% { opacity: 1; }
		96% { opacity: 0.4; }
		97% { opacity: 0.9; }
		98% { opacity: 0.3; }
	}
</style>
