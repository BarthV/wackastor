<script lang="ts">
	interface Match {
		matchId: string;
		inventoryItemId: string;
		quantity: number;
		locationName: string | null;
		userId: string;
		username: string;
		userAvatar: string | null;
		userDiscordId: string;
		createdAt: number;
	}

	interface Props {
		matches: Match[];
	}

	let { matches }: Props = $props();

	function discordDmUrl(discordId: string): string {
		return `https://discord.com/users/${discordId}`;
	}

	function avatarUrl(discordId: string, avatar: string | null): string {
		if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(discordId) % 5n)}.png`;
		return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.webp?size=64`;
	}
</script>

<div class="match-sidebar clipped-corner">
	<div class="sidebar-header">
		<span class="sidebar-header-title">CORRESPONDANCES ({matches.length})</span>
	</div>

	{#if matches.length === 0}
		<div class="no-matches">
			<p>Aucune correspondance trouvee.</p>
			<p class="hint">Les joueurs de la corporation ayant cet objet en stock apparaitront ici.</p>
		</div>
	{:else}
		<div class="match-list">
			{#each matches as match}
				<div class="match-card">
					<div class="match-user">
						<img
							src={avatarUrl(match.userDiscordId, match.userAvatar)}
							alt={match.username}
							class="avatar"
						/>
						<div class="user-info">
							<span class="username">{match.username.toUpperCase()}</span>
							<a
								href={discordDmUrl(match.userDiscordId)}
								target="_blank"
								rel="noopener noreferrer"
								class="dm-link"
							>CONTACTER</a>
						</div>
					</div>
					<div class="match-details">
						<span class="match-qty">{match.quantity}</span>
						{#if match.locationName}
							<span class="match-location">@ {match.locationName.toUpperCase()}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.match-sidebar {
		border: 1px solid rgba(72, 72, 73, 0.2);
		background: var(--color-bg-secondary);
	}
	.sidebar-header {
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-panel);
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
	}
	.sidebar-header-title {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.no-matches {
		padding: var(--space-md);
		text-align: center;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}
	.hint {
		font-size: var(--font-size-xs);
		margin-top: var(--space-xs);
	}
	.match-list {
		display: flex;
		flex-direction: column;
	}
	.match-card {
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.match-card:last-child { border-bottom: none; }
	.match-card:hover { background: rgba(255, 193, 93, 0.05); }
	.match-user {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.avatar {
		width: 32px;
		height: 32px;
		border: 1px solid var(--color-border);
		filter: grayscale(100%);
		opacity: 0.8;
	}
	.user-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.username {
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-text-primary);
		letter-spacing: 0.05em;
	}
	.dm-link {
		font-size: var(--font-size-xs);
		font-family: var(--font-label);
		color: var(--color-accent-cyan);
		text-decoration: none;
		letter-spacing: 0.1em;
	}
	.dm-link:hover { text-decoration: underline; }
	.match-details {
		text-align: right;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.match-qty {
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
		color: var(--color-accent-cyan);
		font-weight: 600;
	}
	.match-location {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.05em;
	}
</style>
