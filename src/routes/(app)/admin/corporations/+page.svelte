<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let editingId = $state<string | null>(null);
	let editingName = $state('');

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('fr-FR');
	}

	function startEdit(corp: { id: string; discordServerName: string }) {
		editingId = corp.id;
		editingName = corp.discordServerName;
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
	}
</script>

<svelte:head>
	<title>WACKASTOR - Corporations</title>
</svelte:head>

<SectionHeader title="GESTION_DES_CORPORATIONS" />

<div class="corps-list clipped-corner">
	{#if data.corps.length === 0}
		<p class="empty-state">// AUCUNE_CORPORATION_ENREGISTREE</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>NOM</th>
					<th>ID_SERVEUR_DISCORD</th>
					<th>CREATION</th>
				</tr>
			</thead>
			<tbody>
				{#each data.corps as corp}
					<tr>
						<td class="corp-name">
							{#if editingId === corp.id}
								<form method="POST" action="?/rename" use:enhance class="inline-form">
									<input type="hidden" name="id" value={corp.id} />
									<input
										type="text"
										name="discordServerName"
										bind:value={editingName}
										class="inline-input"
										onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
										required
										autofocus
									/>
									<button type="submit" class="inline-btn inline-btn-save">OK</button>
									<button type="button" class="inline-btn inline-btn-cancel" onclick={cancelEdit}>✕</button>
								</form>
							{:else}
								<span class="corp-name-text" onclick={() => startEdit(corp)} title="Cliquer pour renommer">{corp.discordServerName.toUpperCase()}</span>
							{/if}
						</td>
						<td class="corp-id">{corp.discordServerId}</td>
						<td class="corp-date">{formatDate(corp.createdAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<div class="create-section">
	<SectionHeader title="INITIALISER_UNE_CORPORATION" />

	{#if form?.error}
		<div class="error-message">
			<span class="error-prefix">ERREUR //</span> {form.error}
		</div>
	{/if}

	<form method="POST" action="?/create" use:enhance class="create-form clipped-corner">
		<div class="field">
			<label for="discordServerId" class="field-label">ID_SERVEUR_DISCORD</label>
			<input
				id="discordServerId"
				name="discordServerId"
				type="text"
				class="input-field"
				placeholder="000000000000000000"
				required
			/>
			<span class="field-hint">L'ID numerique du serveur Discord (clic droit > Copier l'identifiant)</span>
		</div>

		<div class="field">
			<label for="discordServerName" class="field-label">NOM_DE_LA_CORPORATION</label>
			<input
				id="discordServerName"
				name="discordServerName"
				type="text"
				class="input-field"
				placeholder="APEX_INDUSTRIES"
				required
			/>
		</div>

		<button type="submit" class="btn-create clipped-corner">INITIALISER</button>
	</form>
</div>

<style>
	.corps-list {
		margin-top: var(--space-md);
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
	}
	.empty-state {
		padding: var(--space-xl);
		color: var(--color-text-muted);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
	}
	table { width: 100%; border-collapse: collapse; }
	thead { background: var(--color-bg-panel); }
	th {
		text-align: left;
		padding: 10px var(--space-md);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
	}
	td {
		padding: 10px var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	.corp-name { font-weight: 700; }
	.corp-name-text { cursor: pointer; }
	.corp-name-text:hover { color: var(--color-accent-gold); text-decoration: underline dotted; }
	.inline-form { display: flex; align-items: center; gap: var(--space-xs); }
	.inline-input {
		padding: 4px 8px;
		background: var(--color-bg-tertiary);
		border: none;
		border-bottom: 2px solid var(--color-accent-cyan);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		font-weight: 700;
		width: 200px;
	}
	.inline-input:focus { outline: none; }
	.inline-btn {
		padding: 3px 8px;
		border: 1px solid;
		background: transparent;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		cursor: pointer;
		letter-spacing: 0.1em;
	}
	.inline-btn-save { border-color: var(--color-accent-cyan); color: var(--color-accent-cyan); }
	.inline-btn-save:hover { background: var(--color-accent-cyan); color: var(--color-bg-primary); }
	.inline-btn-cancel { border-color: var(--color-border); color: var(--color-text-muted); }
	.inline-btn-cancel:hover { border-color: var(--color-accent-red); color: var(--color-accent-red); }
	.corp-id { font-family: var(--font-mono); color: var(--color-text-secondary); }
	.corp-date { font-family: var(--font-mono); color: var(--color-text-muted); }

	.create-section { margin-top: var(--space-2xl); }
	.error-message {
		margin-top: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-left: 2px solid var(--color-accent-red);
		background: rgba(255, 115, 81, 0.1);
		font-size: var(--font-size-sm);
		color: var(--color-accent-red);
	}
	.error-prefix { font-weight: 700; }
	.create-form {
		margin-top: var(--space-md);
		padding: var(--space-xl);
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		max-width: 520px;
	}
	.field { display: flex; flex-direction: column; gap: var(--space-xs); }
	.field-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.input-field {
		padding: 10px 12px;
		background: var(--color-bg-tertiary);
		border: none;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		letter-spacing: 0.05em;
	}
	.input-field:focus { outline: none; border-bottom-color: var(--color-accent-cyan); }
	.input-field::placeholder { color: var(--color-border); }
	.field-hint {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
	.btn-create {
		align-self: flex-start;
		padding: 10px 24px;
		border: 1px solid var(--color-accent-gold);
		color: var(--color-accent-gold);
		background: transparent;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		cursor: pointer;
	}
	.btn-create:hover { background: var(--color-accent-gold); color: var(--color-bg-primary); }
</style>
