<script lang="ts">
	import { page } from '$app/stores';

	const errorMessages: Record<string, string> = {
		invalid_state: 'Erreur de validation. Veuillez reessayer.',
		token_exchange: "Echec de l'authentification Discord. Veuillez reessayer.",
		unauthorized: 'Vous devez vous connecter pour acceder a cette page.'
	};

	const error = $derived($page.url.searchParams.get('error'));
	const errorMessage = $derived(error ? errorMessages[error] || 'Une erreur est survenue.' : null);
</script>

<svelte:head>
	<title>WACKASTOR - Connexion</title>
</svelte:head>

<div class="login-page">
	<div class="login-terminal clipped-corner">
		<div class="login-content">
			<div class="system-header">
				<span class="header-label">// SYSTEME_D'AUTHENTIFICATION</span>
			</div>

			<h1 class="login-title">WACKASTOR</h1>
			<p class="login-subtitle">Gestionnaire d'inventaire de corporation</p>

			<div class="status-line">
				<span class="status-indicator"></span>
				<span class="status-text">Connexion requise pour acceder au systeme</span>
			</div>

			{#if errorMessage}
				<div class="error-message">
					<span class="error-prefix">ERREUR //</span> {errorMessage}
				</div>
			{/if}

			<a href="/auth/discord" class="discord-login-btn clipped-corner">
				<svg class="discord-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
					<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
				</svg>
				Se connecter avec Discord
			</a>

			<div class="footer-info">
				<span class="footer-text">Authentification via Discord OAuth2</span>
			</div>
		</div>
	</div>
</div>

<style>
	.login-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--space-xl);
	}
	.login-terminal {
		width: 100%;
		max-width: 440px;
		border: 1px solid var(--color-border-dim);
		background: var(--color-bg-tertiary);
	}
	.login-content {
		padding: var(--space-2xl) var(--space-xl);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
	}
	.system-header {
		width: 100%;
	}
	.header-label {
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.2em;
	}
	.login-title {
		font-family: var(--font-headline);
		font-size: var(--font-size-3xl);
		font-weight: 700;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		margin-top: var(--space-sm);
		filter: drop-shadow(0 0 8px rgba(255, 193, 93, 0.4));
	}
	.login-subtitle {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-family: var(--font-body);
	}
	.status-line {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-sm) 0;
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
	}
	.status-indicator {
		width: 6px;
		height: 6px;
		background: var(--color-accent-green);
		display: inline-block;
		animation: blink 1.5s infinite;
	}
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}
	.status-text {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
	.error-message {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		border-left: 2px solid var(--color-accent-red);
		background: rgba(255, 115, 81, 0.1);
		font-size: var(--font-size-sm);
		color: var(--color-accent-red);
	}
	.error-prefix {
		font-weight: 700;
	}
	.discord-login-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-md);
		background: var(--color-accent-gold);
		color: var(--color-bg-primary);
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.2em;
		cursor: pointer;
	}
	.discord-login-btn:hover {
		filter: brightness(1.1);
	}
	.discord-login-btn:active {
		transform: scale(0.97);
	}
	.discord-icon {
		width: 20px;
		height: 20px;
	}
	.footer-info {
		width: 100%;
		text-align: center;
	}
	.footer-text {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
</style>
