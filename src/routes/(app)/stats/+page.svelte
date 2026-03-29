<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';

	let { data } = $props();

	const STATUS_LABELS: Record<string, string> = {
		open: 'OUVERTE',
		matched: 'MATCHEE',
		fulfilled: 'TRAITEE',
		cancelled: 'ANNULEE'
	};

	const CATEGORY_LABELS: Record<string, string> = {
		commodity: 'COMMODITE',
		item: 'EQUIPEMENT',
		other: 'AUTRE'
	};

	function fmtQty(n: number): string {
		return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
	}
</script>

<svelte:head>
	<title>WACKASTOR - Statistiques</title>
</svelte:head>

<SectionHeader title="STATISTIQUES_GLOBALES" />

<!-- ── INVENTAIRE ── -->
<div class="stats-section">
	<div class="subsection-label">// INVENTAIRE</div>

	<div class="kpi-row">
		<div class="kpi-card clipped-corner">
			<span class="kpi-label">OBJETS_TOTAL</span>
			<span class="kpi-value">{data.inventory.totalItems}</span>
		</div>
		<div class="kpi-card clipped-corner">
			<span class="kpi-label">VOLUME_TOTAL</span>
			<span class="kpi-value">{fmtQty(data.inventory.totalScu)} <span class="kpi-unit">SCU</span></span>
		</div>
		{#each data.inventory.byCategory as cat}
			<div class="kpi-card clipped-corner">
				<span class="kpi-label">{CATEGORY_LABELS[cat.category] ?? cat.category.toUpperCase()}</span>
				<span class="kpi-value">{cat.count} <span class="kpi-unit">objets</span></span>
				<span class="kpi-sub">{fmtQty(cat.totalQty)} SCU</span>
			</div>
		{/each}
	</div>

	{#if data.inventory.topLocations.length > 0}
		<div class="table-block clipped-corner">
			<div class="table-title">TOP_EMPLACEMENTS</div>
			<table>
				<thead>
					<tr>
						<th>EMPLACEMENT</th>
						<th class="num">OBJETS</th>
						<th class="num">VOLUME (SCU)</th>
					</tr>
				</thead>
				<tbody>
					{#each data.inventory.topLocations as loc}
						<tr>
							<td class="loc-name">{loc.locationName}</td>
							<td class="num">{loc.count}</td>
							<td class="num">{fmtQty(loc.totalQty)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- ── COMMANDES ── -->
<div class="stats-section">
	<div class="subsection-label">// COMMANDES</div>

	<div class="kpi-row">
		<div class="kpi-card clipped-corner">
			<span class="kpi-label">TOTAL</span>
			<span class="kpi-value">{data.orders.total}</span>
		</div>
		{#each data.orders.byStatus as s}
			<div class="kpi-card clipped-corner status-{s.status}">
				<span class="kpi-label">{STATUS_LABELS[s.status] ?? s.status.toUpperCase()}</span>
				<span class="kpi-value">{s.count}</span>
			</div>
		{/each}
	</div>
</div>

<!-- ── MEMBRES ── -->
<div class="stats-section">
	<div class="subsection-label">// MEMBRES</div>

	{#if data.members.length === 0}
		<p class="empty">// AUCUN_MEMBRE</p>
	{:else}
		<div class="table-block clipped-corner">
			<table>
				<thead>
					<tr>
						<th>JOUEUR</th>
						<th class="num">OBJETS</th>
						<th class="num">VOLUME (SCU)</th>
						<th class="num">COMMANDES</th>
					</tr>
				</thead>
				<tbody>
					{#each data.members as member}
						<tr>
							<td>
								<div class="member-cell">
									{#if member.avatar}
										<img
											class="member-avatar"
											src="https://cdn.discordapp.com/avatars/{member.discordId}/{member.avatar}.png?size=32"
											alt=""
										/>
									{/if}
									<span>{member.username.toUpperCase()}</span>
								</div>
							</td>
							<td class="num">{member.itemCount}</td>
							<td class="num">{fmtQty(member.totalQty)}</td>
							<td class="num">{member.orderCount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.stats-section {
		margin-top: var(--space-2xl);
	}
	.subsection-label {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-accent-orange);
		letter-spacing: 0.15em;
		margin-bottom: var(--space-md);
	}
	.kpi-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}
	.kpi-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: var(--space-md) var(--space-lg);
		background: var(--color-bg-tertiary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		min-width: 140px;
	}
	.kpi-label {
		font-family: var(--font-label);
		font-size: 9px;
		color: rgba(255, 193, 93, 0.4);
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}
	.kpi-value {
		font-family: var(--font-headline);
		font-size: var(--font-size-2xl);
		font-weight: 700;
		color: var(--color-accent-gold);
		line-height: 1;
	}
	.kpi-unit {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		font-weight: 400;
	}
	.kpi-sub {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	.status-open .kpi-value { color: var(--color-accent-cyan); }
	.status-matched .kpi-value { color: var(--color-accent-gold); }
	.status-fulfilled .kpi-value { color: var(--color-accent-green); }
	.status-cancelled .kpi-value { color: var(--color-text-muted); }

	.table-block {
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}
	.table-title {
		padding: var(--space-sm) var(--space-md);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		border-bottom: 1px solid rgba(255, 193, 93, 0.2);
		background: var(--color-bg-panel);
	}
	table { width: 100%; border-collapse: collapse; }
	thead { background: var(--color-bg-panel); }
	th {
		text-align: left;
		padding: var(--space-sm) var(--space-md);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		border-bottom: 1px solid rgba(255, 193, 93, 0.2);
	}
	th.num { text-align: right; }
	td {
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	td.num {
		text-align: right;
		font-family: var(--font-mono);
		color: var(--color-text-secondary);
	}
	.loc-name { font-family: var(--font-mono); color: var(--color-text-secondary); }
	tbody tr:last-child td { border-bottom: none; }
	tbody tr:hover { background: rgba(255, 193, 93, 0.03); }

	.member-cell {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-weight: 600;
	}
	.member-avatar {
		width: 24px;
		height: 24px;
		border-radius: 0;
		filter: grayscale(30%);
		border: 1px solid rgba(255, 193, 93, 0.2);
	}
	.empty {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}
</style>
