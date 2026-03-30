<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';

	const UEX_URL = 'https://api.uexcorp.space/2.0/star_systems';

	type TestResult = {
		httpStatus?: number;
		httpStatusText?: string;
		elapsed?: number;
		body?: unknown;
		keyPresent?: boolean;
		keyPrefix?: string | null;
		error?: string;
	};

	let results = $state<Record<string, TestResult | null>>({
		anonymous: null,
		bearer: null,
		client: null
	});

	let loading = $state<Record<string, boolean>>({
		anonymous: false,
		bearer: false,
		client: false
	});

	async function runServerTest(mode: 'anonymous' | 'bearer') {
		loading[mode] = true;
		results[mode] = null;
		try {
			const resp = await fetch('/api/admin/debug-uex', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mode })
			});
			results[mode] = await resp.json();
		} catch (err) {
			results[mode] = { error: String(err) };
		} finally {
			loading[mode] = false;
		}
	}

	async function runClientTest() {
		loading.client = true;
		results.client = null;
		const start = Date.now();
		try {
			const resp = await fetch(UEX_URL, { headers: { Accept: 'application/json' } });
			const elapsed = Date.now() - start;
			let body: unknown = null;
			try { body = await resp.json(); } catch { body = await resp.text(); }
			results.client = { httpStatus: resp.status, httpStatusText: resp.statusText, elapsed, body };
		} catch (err) {
			results.client = { error: String(err), elapsed: Date.now() - start };
		} finally {
			loading.client = false;
		}
	}

	function statusClass(r: TestResult | null): string {
		if (!r) return '';
		if (r.error) return 'status-error';
		if (r.httpStatus && r.httpStatus < 300) return 'status-ok';
		return 'status-error';
	}
</script>

<svelte:head>
	<title>WACKASTOR - Debug UEX</title>
</svelte:head>

<SectionHeader title="DEBUG_API_UEX" />

<div class="debug-url">
	<span class="label">ENDPOINT</span>
	<code>{UEX_URL}</code>
</div>

<div class="panels">

	<!-- TEST 1: ANONYMOUS SERVER-SIDE -->
	<div class="panel clipped-corner">
		<div class="panel-header">
			<span class="panel-title">01 // ANONYME (serveur)</span>
			<span class="panel-desc">Fetch depuis Vercel, sans header Authorization</span>
		</div>
		<div class="panel-body">
			<button class="btn-run" onclick={() => runServerTest('anonymous')} disabled={loading.anonymous}>
				{loading.anonymous ? 'EN COURS...' : 'LANCER'}
			</button>
			{#if results.anonymous}
				<div class="result {statusClass(results.anonymous)}">
					{#if results.anonymous.error}
						<div class="result-row"><span class="result-label">ERREUR</span><span class="result-val error">{results.anonymous.error}</span></div>
					{:else}
						<div class="result-row">
							<span class="result-label">HTTP</span>
							<span class="result-val status-badge" class:ok={results.anonymous.httpStatus! < 300} class:err={results.anonymous.httpStatus! >= 300}>
								{results.anonymous.httpStatus} {results.anonymous.httpStatusText}
							</span>
						</div>
						<div class="result-row"><span class="result-label">TEMPS</span><span class="result-val mono">{results.anonymous.elapsed}ms</span></div>
						{#if results.anonymous.body && typeof results.anonymous.body === 'object' && 'status' in (results.anonymous.body as object)}
							<div class="result-row"><span class="result-label">API_STATUS</span><span class="result-val mono">{(results.anonymous.body as Record<string, unknown>).status}</span></div>
						{/if}
					{/if}
					<div class="json-block"><pre>{JSON.stringify(results.anonymous.body ?? results.anonymous.error, null, 2)}</pre></div>
				</div>
			{/if}
		</div>
	</div>

	<!-- TEST 2: BEARER SERVER-SIDE -->
	<div class="panel clipped-corner">
		<div class="panel-header">
			<span class="panel-title">02 // BEARER TOKEN (serveur)</span>
			<span class="panel-desc">Fetch depuis Vercel avec Authorization: Bearer UEXCORP_API_KEY</span>
		</div>
		<div class="panel-body">
			<button class="btn-run" onclick={() => runServerTest('bearer')} disabled={loading.bearer}>
				{loading.bearer ? 'EN COURS...' : 'LANCER'}
			</button>
			{#if results.bearer}
				<div class="result {statusClass(results.bearer)}">
					{#if results.bearer.error}
						<div class="result-row"><span class="result-label">ERREUR</span><span class="result-val error">{results.bearer.error}</span></div>
					{:else}
						<div class="result-row">
							<span class="result-label">HTTP</span>
							<span class="result-val status-badge" class:ok={results.bearer.httpStatus! < 300} class:err={results.bearer.httpStatus! >= 300}>
								{results.bearer.httpStatus} {results.bearer.httpStatusText}
							</span>
						</div>
						<div class="result-row"><span class="result-label">TEMPS</span><span class="result-val mono">{results.bearer.elapsed}ms</span></div>
						<div class="result-row">
							<span class="result-label">CLE_PRESENTE</span>
							<span class="result-val mono" class:ok={results.bearer.keyPresent} class:err={!results.bearer.keyPresent}>
								{results.bearer.keyPresent ? 'OUI' : 'NON'}
							</span>
						</div>
						{#if results.bearer.keyPrefix}
							<div class="result-row"><span class="result-label">CLE_PREFIX</span><span class="result-val mono">{results.bearer.keyPrefix}</span></div>
						{/if}
						{#if results.bearer.body && typeof results.bearer.body === 'object' && 'status' in (results.bearer.body as object)}
							<div class="result-row"><span class="result-label">API_STATUS</span><span class="result-val mono">{(results.bearer.body as Record<string, unknown>).status}</span></div>
						{/if}
					{/if}
					<div class="json-block"><pre>{JSON.stringify(results.bearer.body ?? results.bearer.error, null, 2)}</pre></div>
				</div>
			{/if}
		</div>
	</div>

	<!-- TEST 3: CLIENT-SIDE (browser) -->
	<div class="panel clipped-corner">
		<div class="panel-header">
			<span class="panel-title">03 // ANONYME (navigateur)</span>
			<span class="panel-desc">Fetch depuis votre navigateur, avec votre IP — sans Authorization</span>
		</div>
		<div class="panel-body">
			<button class="btn-run" onclick={runClientTest} disabled={loading.client}>
				{loading.client ? 'EN COURS...' : 'LANCER'}
			</button>
			{#if results.client}
				<div class="result {statusClass(results.client)}">
					{#if results.client.error}
						<div class="result-row"><span class="result-label">ERREUR</span><span class="result-val error">{results.client.error}</span></div>
					{:else}
						<div class="result-row">
							<span class="result-label">HTTP</span>
							<span class="result-val status-badge" class:ok={results.client.httpStatus! < 300} class:err={results.client.httpStatus! >= 300}>
								{results.client.httpStatus} {results.client.httpStatusText}
							</span>
						</div>
						<div class="result-row"><span class="result-label">TEMPS</span><span class="result-val mono">{results.client.elapsed}ms</span></div>
						{#if results.client.body && typeof results.client.body === 'object' && 'status' in (results.client.body as object)}
							<div class="result-row"><span class="result-label">API_STATUS</span><span class="result-val mono">{(results.client.body as Record<string, unknown>).status}</span></div>
						{/if}
					{/if}
					<div class="json-block"><pre>{JSON.stringify(results.client.body ?? results.client.error, null, 2)}</pre></div>
				</div>
			{/if}
		</div>
	</div>

</div>

<style>
	.debug-url {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.3);
		font-size: var(--font-size-xs);
	}
	.label {
		font-family: var(--font-label);
		color: var(--color-text-muted);
		letter-spacing: 0.15em;
		font-size: var(--font-size-xs);
		font-weight: 700;
		white-space: nowrap;
	}
	code {
		font-family: var(--font-mono);
		color: var(--color-accent-cyan);
		font-size: var(--font-size-xs);
	}
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
	.panel {
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}
	.panel-header {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-panel);
		border-bottom: 1px solid rgba(255, 193, 93, 0.2);
		display: flex;
		align-items: baseline;
		gap: var(--space-md);
	}
	.panel-title {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.panel-desc {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	.panel-body {
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.btn-run {
		align-self: flex-start;
		padding: 8px 20px;
		border: 1px solid var(--color-accent-cyan);
		color: var(--color-accent-cyan);
		background: transparent;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
		text-transform: uppercase;
	}
	.btn-run:hover:not(:disabled) { background: var(--color-accent-cyan); color: var(--color-bg-primary); }
	.btn-run:disabled { opacity: 0.5; cursor: default; }
	.result {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		border-left: 2px solid var(--color-border);
		padding-left: var(--space-md);
	}
	.result-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}
	.result-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
		min-width: 120px;
	}
	.result-val {
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
	}
	.result-val.mono { font-family: var(--font-mono); }
	.result-val.error { color: var(--color-accent-red); }
	.result-val.ok { color: var(--color-accent-green); }
	.result-val.err { color: var(--color-accent-red); }
	.status-badge { font-family: var(--font-mono); font-weight: 700; }
	.status-badge.ok { color: var(--color-accent-green); }
	.status-badge.err { color: var(--color-accent-red); }
	.json-block {
		margin-top: var(--space-sm);
		background: var(--color-bg-primary);
		border: 1px solid rgba(72, 72, 73, 0.3);
		padding: var(--space-sm) var(--space-md);
		overflow: auto;
		max-height: 320px;
	}
	.json-block pre {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		white-space: pre-wrap;
		word-break: break-all;
		margin: 0;
	}
</style>
