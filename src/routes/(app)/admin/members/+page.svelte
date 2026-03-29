<script lang="ts">
	import SectionHeader from '$lib/components/ui/SectionHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let newRoleId = $state('');
	let newRoleAdmin = $state(false);

	async function toggleRole(memberId: string, userId: string, currentRole: string) {
		const newRole = currentRole === 'admin' ? 'member' : 'admin';
		const resp = await fetch(`/api/admin/members/${userId}/role`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ role: newRole })
		});
		if (resp.ok) invalidateAll();
	}

	async function deleteMember(userId: string, username: string) {
		if (!confirm(`Supprimer ${username} et toutes ses donnees (inventaire, commandes) ?`)) return;
		const resp = await fetch(`/api/admin/members/${userId}`, { method: 'DELETE' });
		if (resp.ok) invalidateAll();
	}

	async function addBinding() {
		if (!newRoleId.trim()) return;
		const resp = await fetch('/api/admin/role-bindings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ discordRoleId: newRoleId.trim(), grantsAdmin: newRoleAdmin })
		});
		if (resp.ok) {
			newRoleId = '';
			newRoleAdmin = false;
			invalidateAll();
		}
	}

	async function removeBinding(bindingId: string) {
		const resp = await fetch(`/api/admin/role-bindings`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: bindingId })
		});
		if (resp.ok) invalidateAll();
	}

	function formatDate(ts: number): string {
		return new Date(ts).toLocaleDateString('fr-FR');
	}
</script>

<svelte:head>
	<title>WACKASTOR - Gestion des membres</title>
</svelte:head>

<div class="corp-cards">
	<div class="corp-card clipped-corner">
		<span class="corp-card-label">NOM_CORPORATION</span>
		<span class="corp-card-value">{data.corp.discordServerName.toUpperCase()}</span>
	</div>
	<div class="corp-card clipped-corner">
		<span class="corp-card-label">ID_SERVEUR_DISCORD</span>
		<span class="corp-card-value mono">{data.corp.discordServerId}</span>
	</div>
	<div class="corp-card clipped-corner">
		<span class="corp-card-label">ID_CORPORATION</span>
		<span class="corp-card-value mono">{data.corp.id}</span>
	</div>
	<div class="corp-card clipped-corner">
		<span class="corp-card-label">CREATION</span>
		<span class="corp-card-value mono">{formatDate(data.corp.createdAt)}</span>
	</div>
	<div class="corp-card clipped-corner">
		<span class="corp-card-label">MEMBRES</span>
		<span class="corp-card-value">{data.members.length}</span>
	</div>
</div>

<SectionHeader title="MEMBRES" />

<div class="members-table clipped-corner">
	<table>
		<thead>
			<tr>
				<th>JOUEUR</th>
				<th>ROLE</th>
				<th>REJOINT_LE</th>
				<th>ACTIONS</th>
			</tr>
		</thead>
		<tbody>
			{#each data.members as member}
				<tr>
					<td>
						<div class="user-cell">
							<span class="username">{member.username.toUpperCase()}</span>
							<span class="discord-id">{member.discordId}</span>
						</div>
					</td>
					<td>
						<Badge
							variant={member.role === 'admin' ? 'warning' : 'info'}
							label={member.role === 'admin' ? 'Admin' : 'Membre'}
						/>
					</td>
					<td><span class="date-value">{formatDate(member.joinedAt)}</span></td>
					<td>
						<div class="actions">
							<button class="action-role" onclick={() => toggleRole(member.memberId, member.userId, member.role)}>
								{member.role === 'admin' ? 'RETROGRADER' : 'PROMOUVOIR'}
							</button>
							<button class="action-delete" onclick={() => deleteMember(member.userId, member.username)}>
								SUPPRIMER
							</button>
						</div>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<div class="bindings-section">
	<SectionHeader title="ROLES AUTORISES" />

	{#if data.bindings.length > 0}
		<div class="bindings-list">
			{#each data.bindings as binding}
				<div class="binding-row">
					<span class="binding-role-id">Role Discord: {binding.discordRoleId}</span>
					<Badge
						variant={binding.grantsAdmin ? 'warning' : 'info'}
						label={binding.grantsAdmin ? 'Admin' : 'Membre'}
					/>
					<button class="action-delete" onclick={() => removeBinding(binding.id)}>RETIRER</button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="no-bindings">Aucun role configuré. Tous les membres du serveur Discord sont autorisés à utiliser wackastore.</p>
	{/if}

	<div class="add-binding">
		<input type="text" bind:value={newRoleId} placeholder="ID_DU_ROLE_DISCORD" class="input-field" />
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={newRoleAdmin} />
			ACCORDE_ADMIN
		</label>
		<button class="btn-add" onclick={addBinding}>AJOUTER</button>
	</div>
</div>

<style>
	.corp-cards {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: var(--space-md);
		margin-bottom: var(--space-xl);
	}
	.corp-card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: var(--space-md) var(--space-lg);
		background: var(--color-bg-tertiary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		min-width: 160px;
	}
	.corp-card-label {
		font-family: var(--font-label);
		font-size: 9px;
		color: rgba(255, 193, 93, 0.4);
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}
	.corp-card-value {
		font-size: var(--font-size-sm);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.05em;
	}
	.corp-card-value.mono {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		font-weight: 400;
		color: var(--color-text-secondary);
		word-break: break-all;
	}
	.members-table {
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
		overflow: hidden;
		margin-top: var(--space-md);
	}
	table { width: 100%; border-collapse: collapse; }
	thead { background: var(--color-bg-panel); }
	th {
		text-align: left;
		padding: var(--space-md);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
	}
	td {
		padding: var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	tbody tr:hover { background: rgba(255, 193, 93, 0.05); }
	.user-cell { display: flex; flex-direction: column; gap: 2px; }
	.username { font-weight: 700; font-size: var(--font-size-sm); }
	.discord-id { font-size: var(--font-size-xs); color: var(--color-text-muted); font-family: var(--font-mono); }
	.date-value { font-family: var(--font-mono); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
	.actions { display: flex; gap: var(--space-sm); }
	.action-role {
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		background: none;
		border: none;
		color: var(--color-accent-cyan);
		cursor: pointer;
		letter-spacing: 0.05em;
	}
	.action-role:hover { text-decoration: underline; }
	.action-delete {
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		background: none;
		border: none;
		color: var(--color-text-muted);
		cursor: pointer;
		letter-spacing: 0.05em;
	}
	.action-delete:hover { color: var(--color-accent-red); }
	.bindings-section { margin-top: var(--space-2xl); }
	.bindings-list {
		margin-top: var(--space-md);
		border: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-secondary);
	}
	.binding-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		font-size: var(--font-size-sm);
	}
	.binding-row:last-child { border-bottom: none; }
	.binding-role-id { font-family: var(--font-mono); color: var(--color-text-secondary); flex: 1; font-size: var(--font-size-sm); }
	.no-bindings { margin-top: var(--space-md); color: var(--color-text-muted); font-size: var(--font-size-sm); }
	.add-binding {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: var(--space-md);
	}
	.input-field {
		padding: 8px 12px;
		background: var(--color-bg-secondary);
		border: none;
		border-bottom: 2px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-body);
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}
	.input-field:focus { outline: none; border-bottom-color: var(--color-accent-cyan); }
	.input-field::placeholder { color: var(--color-border); }
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		color: var(--color-text-secondary);
		letter-spacing: 0.1em;
	}
	.btn-add {
		padding: 8px 16px;
		border: 1px solid var(--color-accent-gold);
		color: var(--color-accent-gold);
		background: transparent;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		cursor: pointer;
	}
	.btn-add:hover { background: var(--color-accent-gold); color: var(--color-bg-primary); }
</style>
