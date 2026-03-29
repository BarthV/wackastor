<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>WACKASTOR - Erreur {$page.status}</title>
</svelte:head>

<div class="error-page">
	<div class="error-terminal clipped-corner">
		<div class="error-header">
			<span class="error-header-title">ERREUR_SYSTEME</span>
		</div>
		<div class="error-body">
			<span class="error-code">{$page.status}</span>
			<span class="error-message">
				{#if $page.status === 404}
					Secteur inconnu. La page demandee n'existe pas.
				{:else if $page.status === 403}
					Acces refuse. Autorisation insuffisante.
				{:else if $page.status === 401}
					Session expiree. Reconnectez-vous via Discord.
				{:else}
					{$page.error?.message ?? 'Une erreur inattendue est survenue.'}
				{/if}
			</span>
			<div class="error-actions">
				<a href="/" class="error-link clipped-corner">RETOUR_ACCUEIL</a>
			</div>
		</div>
	</div>
</div>

<style>
	.error-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-xl);
	}
	.error-terminal {
		border: 1px solid var(--color-accent-red);
		background: var(--color-bg-tertiary);
		max-width: 480px;
		width: 100%;
	}
	.error-header {
		background: var(--color-accent-red);
		padding: var(--space-sm) var(--space-md);
	}
	.error-header-title {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-bg-primary);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.error-body {
		padding: var(--space-2xl) var(--space-xl);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		text-align: center;
	}
	.error-code {
		font-family: var(--font-headline);
		font-size: var(--font-size-3xl);
		color: var(--color-accent-red);
		font-weight: 700;
		letter-spacing: 0.1em;
	}
	.error-message {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: 1.6;
	}
	.error-actions {
		margin-top: var(--space-md);
	}
	.error-link {
		display: inline-block;
		padding: 10px 20px;
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		text-decoration: none;
	}
	.error-link:hover { filter: brightness(1.1); }
</style>
