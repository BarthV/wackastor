<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import TerminalCard from '$lib/components/ui/TerminalCard.svelte';
	import DataTable from '$lib/components/ui/DataTable.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	import { formatQuantity } from '$lib/utils/formatQuantity.js';

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
		<div class="grid redacted">
			<TerminalCard title="Apercu de l'inventaire" number="01">
				<DataTable {columns} {rows} />
			</TerminalCard>
			<TerminalCard title="Etats des operations" number="02">
				<div class="status-list">
					{#each statusLabels as s}
						<div class="status-row">
							<span class="status-label redacted-text">{s.label}</span>
							<Badge variant={s.variant} label={s.text} />
						</div>
					{/each}
				</div>
			</TerminalCard>
		</div>
	{:else}
		<div class="auth-layout">
			<!-- Colonne gauche : nav + opérations -->
			<div class="left-col">
				<div class="nav-grid">
					<a href="/stock" class="nav-card clipped-corner">
						<span class="material-symbols-outlined card-icon">inventory_2</span>
						<span class="card-title">STOCKS</span>
						<span class="card-desc">Consulter les stocks de la corporation</span>
					</a>
					<a href="/inventory" class="nav-card clipped-corner">
						<span class="material-symbols-outlined card-icon">package_2</span>
						<span class="card-title">INVENTAIRE</span>
						<span class="card-desc">Gerer votre inventaire personnel</span>
					</a>
					<a href="/commandes" class="nav-card clipped-corner">
						<span class="material-symbols-outlined card-icon">list_alt</span>
						<span class="card-title">COMMANDES</span>
						<span class="card-desc">Suivre vos commandes et correspondances</span>
					</a>
					<a href="/stats" class="nav-card clipped-corner">
						<span class="material-symbols-outlined card-icon">bar_chart</span>
						<span class="card-title">STATS</span>
						<span class="card-desc">Statistiques et rapports de la corporation</span>
					</a>
				</div>

				{#if data.stats}
					<div class="ops-card clipped-corner">
						<div class="ops-header">// ETAT_DES_OPERATIONS</div>
						<div class="ops-row">
							<span class="ops-label">OBJETS_DECLARES</span>
							<span class="ops-value mono">{data.stats.itemCount}</span>
						</div>
						<div class="ops-row">
							<span class="ops-label">COMMANDES_ACTIVES</span>
							<span class="ops-value mono">{data.stats.orderCount}</span>
						</div>
						<div class="ops-row">
							<span class="ops-label">SCU_TOTAL</span>
							<span class="ops-value mono">{data.stats.totalScu.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SCU</span>
						</div>
						<div class="ops-row">
							<span class="ops-label">QUALITE_MOYENNE</span>
							<span class="ops-value mono">{data.stats.avgQuality ?? '—'}</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Colonne droite : TOP 10 -->
			<div class="right-col">
				<div class="top10-card clipped-corner">
					<div class="ops-header">// TOP_10_STOCKS_CORPORATION</div>
					{#if data.topItems && data.topItems.length > 0}
						<table class="top10-table">
							<thead>
								<tr>
									<th>RESSOURCE</th>
									<th class="th-right">QUANTITE</th>
									<th class="th-right">QUALITE</th>
									<th>LIEU</th>
								</tr>
							</thead>
							<tbody>
								{#each data.topItems as item}
									<tr>
										<td class="item-name">{item.name.toUpperCase().replace(/ /g, '_')}</td>
										<td class="td-right mono cyan">{formatQuantity(item.quantity, item.unit)}</td>
										<td class="td-right mono">{item.quality > 0 ? item.quality : '—'}</td>
										<td class="loc">{item.locationName ? item.locationName.toUpperCase().replace(/ /g, '_') : '—'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<p class="empty">AUCUN_OBJET_DECLARE</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
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

	/* ── Auth layout ── */
	.auth-layout {
		display: grid;
		grid-template-columns: 2fr 3fr;
		gap: var(--space-lg);
		align-items: start;
	}
	.left-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.right-col {
		display: flex;
		flex-direction: column;
	}

	/* ── Ops card ── */
	.ops-card {
		background: var(--color-bg-tertiary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}
	.ops-header {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-panel);
		border-bottom: 1px solid rgba(255, 193, 93, 0.2);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-accent-gold);
		letter-spacing: 0.1em;
	}
	.ops-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
	}
	.ops-row:last-child { border-bottom: none; }
	.ops-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.ops-value {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}
	.ops-value.mono { font-family: var(--font-mono); color: var(--color-accent-cyan); }

	/* ── Top 10 card ── */
	.top10-card {
		background: var(--color-bg-tertiary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}
	.top10-table {
		width: 100%;
		border-collapse: collapse;
	}
	.top10-table th {
		text-align: left;
		padding: 10px var(--space-md);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
		background: var(--color-bg-panel);
	}
	.th-right { text-align: right; }
	.top10-table td {
		padding: 10px var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	.top10-table tbody tr:last-child td { border-bottom: none; }
	.top10-table tbody tr:hover { background: rgba(255, 193, 93, 0.04); }
	.td-right { text-align: right; }
	.item-name { font-weight: 700; color: var(--color-text-primary); }
	.mono { font-family: var(--font-mono); }
	.cyan { color: var(--color-accent-cyan); }
	.loc { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
	.empty {
		padding: var(--space-lg) var(--space-md);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
	}

	/* ── Nav cards ── */
	.nav-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}
	.nav-card {
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
	.nav-card::before {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		width: 64px;
		height: 64px;
		background: rgba(255, 193, 93, 0.05);
		transform: rotate(-45deg) translate(32px, -32px);
	}
	.nav-card:hover { border-color: var(--color-border-dim); }
	.card-icon {
		font-size: 28px;
		color: var(--color-accent-cyan);
	}
	.card-title {
		font-family: var(--font-condensed);
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
