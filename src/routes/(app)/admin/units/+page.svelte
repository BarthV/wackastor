<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let search = $state(data.q);
	let saving = $state<number | null>(null);
	let savingSection = $state<string | null>(null);
	let savingSubcat = $state<string | null>(null);
	let expandedSections = $state<Set<string>>(new Set());

	// Quality section
	let qualityQuery = $state('');
	let qualityResults = $state<{ id: number; name: string; unit: string; hasQuality: boolean }[]>([]);
	let qualitySearchOpen = $state(false);
	let initLoading = $state(false);
	let debounce: ReturnType<typeof setTimeout>;

	async function searchQualityCandidates(q: string) {
		if (q.length < 2) { qualityResults = []; qualitySearchOpen = false; return; }
		const resp = await fetch(`/api/uex/commodities?q=${encodeURIComponent(q)}&limit=15`);
		const json = await resp.json();
		const existing = new Set(data.qualityCommodities.map((c: { id: number }) => c.id));
		qualityResults = (json.data ?? []).filter((c: { id: number }) => !existing.has(c.id));
		qualitySearchOpen = qualityResults.length > 0;
	}

	function handleQualityInput() {
		clearTimeout(debounce);
		debounce = setTimeout(() => searchQualityCandidates(qualityQuery), 250);
	}

	async function addQuality(id: number) {
		await fetch('/api/admin/commodity-quality', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uexCommodityId: id })
		});
		qualityQuery = '';
		qualityResults = [];
		qualitySearchOpen = false;
		invalidateAll();
	}

	async function removeQuality(id: number) {
		await fetch('/api/admin/commodity-quality', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uexCommodityId: id })
		});
		invalidateAll();
	}

	async function initQuality() {
		initLoading = true;
		await fetch('/api/admin/commodity-quality', { method: 'POST' });
		initLoading = false;
		invalidateAll();
	}

	async function setUnit(commodityId: number, unit: string) {
		saving = commodityId;
		await fetch('/api/admin/commodity-units', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ uexCommodityId: commodityId, unit })
		});
		saving = null;
		invalidateAll();
	}

	async function setSectionCategory(section: string, category: 'item' | 'equipment') {
		savingSection = section;
		await fetch('/api/admin/item-sections', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ section, category })
		});
		savingSection = null;
		invalidateAll();
	}

	async function setSectionIcon(section: string, icon: string) {
		if (!icon.trim()) return;
		savingSection = section;
		await fetch('/api/admin/item-sections', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ section, icon: icon.trim() })
		});
		savingSection = null;
		invalidateAll();
	}

	function toggleSection(section: string) {
		const next = new Set(expandedSections);
		if (next.has(section)) next.delete(section); else next.add(section);
		expandedSections = next;
	}

	async function setSubcategoryCategory(category: string, wackCategory: 'item' | 'equipment') {
		savingSubcat = category;
		await fetch('/api/admin/item-subcategories', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ category, wackCategory })
		});
		savingSubcat = null;
		invalidateAll();
	}

	async function setSubcategoryDisabled(category: string, disabled: boolean) {
		savingSubcat = category;
		await fetch('/api/admin/item-subcategories', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ category, disabled })
		});
		savingSubcat = null;
		invalidateAll();
	}

	async function resetSubcategory(category: string) {
		savingSubcat = category;
		await fetch('/api/admin/item-subcategories', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ category })
		});
		savingSubcat = null;
		invalidateAll();
	}

	async function setSectionDisabled(section: string, disabled: boolean) {
		savingSection = section;
		await fetch('/api/admin/item-sections', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ section, disabled })
		});
		savingSection = null;
		invalidateAll();
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		const params = search ? `?q=${encodeURIComponent(search)}` : '';
		window.location.href = `/admin/units${params}`;
	}
</script>

<svelte:head>
	<title>WACKASTOR - Unites des commodites</title>
</svelte:head>

<SectionHeader title="UNITES_DES_COMMODITES" />

<form class="search-bar" onsubmit={handleSearch}>
	<input
		type="text"
		bind:value={search}
		placeholder="FILTRER_PAR_NOM..."
		class="search-input"
	/>
	<button type="submit" class="btn-search">FILTRER</button>
</form>

<div class="table-block clipped-corner">
	<table>
		<thead>
			<tr>
				<th>NOM</th>
				<th>CODE</th>
				<th>TYPE</th>
				<th>UNITE</th>
			</tr>
		</thead>
		<tbody>
			{#each data.commodities as commodity}
				<tr>
					<td class="name">{commodity.name}</td>
					<td class="code">{commodity.code}</td>
					<td class="kind">{commodity.kind}</td>
					<td class="unit-cell">
						<div class="unit-buttons">
							{#each ['SCU', 'cSCU', 'unit'] as u}
								<button
									class="unit-btn"
									class:active={commodity.unit === u}
									class:saving={saving === commodity.id}
									onclick={() => setUnit(commodity.id, u)}
									disabled={saving === commodity.id}
								>{u}</button>
							{/each}
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if data.commodities.length === 0}
		<p class="empty">// AUCUNE_COMMODITE — synchronisez d'abord les donnees UEX</p>
	{/if}
</div>

<div class="quality-block">
	<SectionHeader title="RESSOURCES_AVEC_NIVEAU_DE_QUALITE" />

	<div class="quality-toolbar">
		<div class="quality-search-wrap">
			<input
				type="text"
				bind:value={qualityQuery}
				oninput={handleQualityInput}
				onblur={() => setTimeout(() => { qualitySearchOpen = false; }, 200)}
				onfocus={() => { if (qualityResults.length > 0) qualitySearchOpen = true; }}
				placeholder="AJOUTER_UNE_RESSOURCE..."
				class="search-input"
			/>
			{#if qualitySearchOpen}
				<ul class="quality-dropdown">
					{#each qualityResults as r}
						<li onmousedown={() => addQuality(r.id)} role="option" aria-selected="false">
							<span class="qd-name">{r.name}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
		{#if data.qualityCommodities.length === 0}
			<button class="btn-init" onclick={initQuality} disabled={initLoading}>
				{initLoading ? 'INITIALISATION...' : 'INITIALISER DEPUIS UEX'}
			</button>
		{/if}
	</div>

	<div class="quality-tags">
		{#each data.qualityCommodities as c}
			<div class="quality-tag clipped-corner">
				<span class="qt-name">{c.name}</span>
				<span class="qt-kind">{c.kind}</span>
				<button class="qt-remove" onclick={() => removeQuality(c.id)} title="Retirer">✕</button>
			</div>
		{:else}
			<p class="empty">// AUCUNE_RESSOURCE — cliquez sur INITIALISER ou ajoutez manuellement</p>
		{/each}
	</div>
</div>

<div class="sections-block">
	<SectionHeader title="CLASSIFICATION_SECTIONS_UEX" />

	{#if data.sections.length === 0}
		<p class="empty">// AUCUNE_SECTION — synchronisez d'abord les objets UEX</p>
	{:else}
		<div class="table-block clipped-corner">
			<table>
				<thead>
					<tr>
						<th>SECTION_UEX</th>
						<th>ICONE</th>
						<th>CATEGORIE</th>
						<th class="th-disable">DESACT.</th>
					</tr>
				</thead>
				<tbody>
					{#each data.sections as s}
						<tr class:row-saving={savingSection === s.section} class:row-disabled={s.disabled}>
							<td class="td-section" class:muted={s.disabled}>
								<button
									class="expand-btn"
									onclick={() => toggleSection(s.section)}
									title={expandedSections.has(s.section) ? 'Replier' : `${s.subcategories.length} sous-catégories`}
									disabled={s.subcategories.length === 0}
								>
									<span class="material-symbols-outlined expand-icon" class:expanded={expandedSections.has(s.section)}>
										chevron_right
									</span>
								</button>
								{s.section}
								{#if s.subcategories.length > 0}
									<span class="subcat-count">{s.subcategories.length}</span>
								{/if}
							</td>
							<td class="td-icon">
								<div class="icon-field">
									<span class="material-symbols-outlined icon-preview">{s.icon}</span>
									<input
										type="text"
										class="icon-input"
										value={s.icon}
										placeholder="category"
										onblur={(e) => setSectionIcon(s.section, (e.target as HTMLInputElement).value)}
										onkeydown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
										disabled={s.disabled}
									/>
								</div>
							</td>
							<td class="td-toggle">
								<label class="toggle-label" aria-label="Basculer categorie">
									<span class="toggle-opt" class:active={s.category === 'item' && !s.disabled}>OBJET</span>
									<button
										class="toggle-track"
										class:equipment={s.category === 'equipment'}
										onclick={() => setSectionCategory(s.section, s.category === 'item' ? 'equipment' : 'item')}
										disabled={savingSection === s.section || s.disabled}
										role="switch"
										aria-checked={s.category === 'equipment'}
									>
										<span class="toggle-thumb"></span>
									</button>
									<span class="toggle-opt" class:active={s.category === 'equipment' && !s.disabled}>EQUIPEMENT</span>
								</label>
							</td>
							<td class="td-check">
								<input
									type="checkbox"
									checked={s.disabled}
									onchange={() => setSectionDisabled(s.section, !s.disabled)}
									disabled={savingSection === s.section}
									title="Desactiver cette section"
								/>
							</td>
						</tr>
						{#if expandedSections.has(s.section)}
							{#each s.subcategories as sub}
								<tr class="subcat-row" class:row-saving={savingSubcat === sub.category} class:row-disabled={sub.disabled}>
									<td class="td-subcat" class:muted={sub.disabled}>
										<span class="subcat-indent">↳</span>
										{sub.category}
										{#if sub.hasOverride}
											<span class="override-badge">OVERRIDE</span>
										{/if}
									</td>
									<td class="td-icon"></td>
									<td class="td-toggle">
										<label class="toggle-label" aria-label="Basculer categorie sous-section">
											<span class="toggle-opt" class:active={sub.wackCategory === 'item' && !sub.disabled}>OBJET</span>
											<button
												class="toggle-track"
												class:equipment={sub.wackCategory === 'equipment'}
												onclick={() => setSubcategoryCategory(sub.category, sub.wackCategory === 'item' ? 'equipment' : 'item')}
												disabled={savingSubcat === sub.category || sub.disabled}
												role="switch"
												aria-checked={sub.wackCategory === 'equipment'}
											>
												<span class="toggle-thumb"></span>
											</button>
											<span class="toggle-opt" class:active={sub.wackCategory === 'equipment' && !sub.disabled}>EQUIPEMENT</span>
										</label>
									</td>
									<td class="td-check td-subcat-actions">
										<input
											type="checkbox"
											checked={sub.disabled}
											onchange={() => setSubcategoryDisabled(sub.category, !sub.disabled)}
											disabled={savingSubcat === sub.category}
											title="Desactiver cette sous-categorie"
										/>
										{#if sub.hasOverride}
											<button class="btn-reset" onclick={() => resetSubcategory(sub.category)} title="Réinitialiser (hériter de la section)">↺</button>
										{/if}
									</td>
								</tr>
							{/each}
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.search-bar {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		margin-bottom: var(--space-md);
	}
	.search-input {
		flex: 1;
		padding: 8px 12px;
		background: var(--color-bg-secondary);
		border: none;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		letter-spacing: 0.05em;
	}
	.search-input:focus { outline: none; border-bottom-color: var(--color-accent-cyan); }
	.search-input::placeholder { color: var(--color-border); }
	.btn-search {
		padding: 8px 20px;
		border: 1px solid var(--color-border-dim);
		background: transparent;
		color: var(--color-text-secondary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
	}
	.btn-search:hover { border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); }

	.table-block {
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
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
	td {
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	tbody tr:last-child td { border-bottom: none; }
	tbody tr:hover { background: rgba(255, 193, 93, 0.03); }
	.name { font-weight: 600; }
	.code { font-family: var(--font-mono); color: var(--color-text-muted); font-size: var(--font-size-xs); }
	.kind { font-family: var(--font-mono); color: var(--color-text-secondary); font-size: var(--font-size-xs); }
	.unit-cell { padding-top: 4px; padding-bottom: 4px; }
	.unit-buttons { display: flex; gap: 4px; }
	.unit-btn {
		padding: 3px 10px;
		background: transparent;
		border: 1px solid var(--color-border);
		color: var(--color-text-muted);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		letter-spacing: 0.1em;
		cursor: pointer;
	}
	.unit-btn:hover { border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); }
	.unit-btn.active { border-color: var(--color-accent-gold); color: var(--color-accent-gold); background: rgba(255, 193, 93, 0.08); }
	.unit-btn.saving { opacity: 0.5; cursor: wait; }
	.empty { padding: var(--space-xl); color: var(--color-text-muted); font-family: var(--font-mono); font-size: var(--font-size-sm); }

	/* ── QUALITY BLOCK ── */
	.quality-block { margin-top: var(--space-2xl); }
	.quality-toolbar {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
		margin-top: var(--space-md);
		margin-bottom: var(--space-md);
	}
	.quality-search-wrap {
		position: relative;
		flex: 1;
		max-width: 400px;
	}
	.quality-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-top: none;
		z-index: 100;
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 200px;
		overflow-y: auto;
	}
	.quality-dropdown li {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-md);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}
	.quality-dropdown li:hover { background: var(--color-bg-tertiary); color: var(--color-accent-gold); }
	.qd-name { font-weight: 600; }
	.btn-init {
		padding: 8px 16px;
		border: 1px solid var(--color-accent-cyan);
		color: var(--color-accent-cyan);
		background: transparent;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-init:hover { background: var(--color-accent-cyan); color: var(--color-bg-primary); }
	.btn-init:disabled { opacity: 0.5; cursor: wait; }
	.quality-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}
	.quality-tag {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 4px 10px;
		background: var(--color-bg-tertiary);
		border: 1px solid rgba(72, 72, 73, 0.3);
		font-size: var(--font-size-xs);
	}
	.qt-name { font-weight: 600; color: var(--color-text-primary); }
	.qt-kind { color: var(--color-text-muted); font-family: var(--font-mono); }
	.qt-remove {
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 10px;
		padding: 0 2px;
		line-height: 1;
	}
	.qt-remove:hover { color: var(--color-accent-red); }

	/* ── Accordion / subcategories ── */
	.expand-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-text-muted);
		vertical-align: middle;
		margin-right: 2px;
	}
	.expand-btn:disabled { opacity: 0.2; cursor: default; }
	.expand-icon {
		font-size: 14px;
		transition: transform 150ms;
		display: inline-block;
		vertical-align: middle;
	}
	.expand-icon.expanded { transform: rotate(90deg); }
	.subcat-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 238, 252, 0.1);
		border: 1px solid rgba(0, 238, 252, 0.3);
		color: var(--color-accent-cyan);
		font-family: var(--font-mono);
		font-size: 9px;
		width: 18px;
		height: 18px;
		margin-left: 6px;
		vertical-align: middle;
	}
	.subcat-row td { background: rgba(0, 238, 252, 0.02); }
	.subcat-row:hover td { background: rgba(0, 238, 252, 0.05); }
	.td-subcat {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		padding-left: calc(var(--space-md) + 28px);
	}
	.td-subcat.muted { color: var(--color-accent-red); opacity: 0.6; text-decoration: line-through; }
	.subcat-indent {
		color: var(--color-text-muted);
		margin-right: 6px;
	}
	.override-badge {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 5px;
		background: rgba(255, 193, 93, 0.1);
		border: 1px solid rgba(255, 193, 93, 0.3);
		color: var(--color-accent-gold);
		font-family: var(--font-label);
		font-size: 8px;
		letter-spacing: 0.1em;
		vertical-align: middle;
	}
	.td-subcat-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}
	.btn-reset {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 14px;
		padding: 0;
		line-height: 1;
	}
	.btn-reset:hover { color: var(--color-accent-cyan); }

	.sections-block { margin-top: var(--space-2xl); }
	.row-saving { opacity: 0.5; pointer-events: none; }
	.row-disabled td { background: rgba(255, 115, 81, 0.04); }
	.row-disabled td:first-child { border-left: 2px solid rgba(255, 115, 81, 0.4); }
	.th-disable { width: 60px; text-align: center; }
	.td-check { text-align: center; }
	.td-check input[type="checkbox"] {
		width: 14px;
		height: 14px;
		cursor: pointer;
		accent-color: var(--color-accent-red);
	}
	.td-section {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-weight: 600;
	}
	.td-section.muted {
		color: var(--color-accent-red);
		opacity: 0.6;
		text-decoration: line-through;
	}
	.td-icon { width: 200px; }
	.td-toggle { width: 220px; }
	.icon-field {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}
	.icon-preview {
		font-size: 22px;
		color: var(--color-accent-cyan);
		width: 26px;
	}
	.icon-input {
		width: 120px;
		padding: 2px 6px;
		background: var(--color-bg-primary);
		border: none;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
	}
	.icon-input:focus { outline: none; border-bottom-color: var(--color-accent-cyan); }
	.icon-input:disabled { opacity: 0.3; }
	.toggle-label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
	}
	.toggle-opt {
		font-family: var(--font-label);
		font-size: 9px;
		letter-spacing: 0.15em;
		color: var(--color-text-muted);
		transition: color 75ms;
	}
	.toggle-opt.active { color: var(--color-accent-cyan); }
	.toggle-opt:last-child.active { color: var(--color-accent-gold); }
	.toggle-track {
		position: relative;
		width: 36px;
		height: 18px;
		background: rgba(94, 234, 212, 0.15);
		border: 1px solid var(--color-accent-cyan);
		cursor: pointer;
		padding: 0;
		transition: background 75ms, border-color 75ms;
	}
	.toggle-track.equipment {
		background: rgba(255, 193, 93, 0.15);
		border-color: var(--color-accent-gold);
	}
	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 12px;
		height: 12px;
		background: var(--color-accent-cyan);
		transition: transform 150ms, background 75ms;
	}
	.toggle-track.equipment .toggle-thumb {
		transform: translateX(18px);
		background: var(--color-accent-gold);
	}
	.toggle-track:disabled { cursor: wait; }
</style>
