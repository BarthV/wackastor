<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';

	interface Props {
		children: Snippet;
		data: {
			user: { id: string; discordId: string; username: string; avatar: string | null };
			corp: { id: string; discordServerId: string; name: string; role: string } | null;
		};
	}

	let { children, data }: Props = $props();

	const navItems = [
		{ href: '/stock', label: 'STOCKS', icon: 'inventory_2' },
		{ href: '/inventory', label: 'INVENTAIRE', icon: 'package_2' },
		{ href: '/stats', label: 'STATS', icon: 'bar_chart' }
	];

	const currentPath = $derived($page.url.pathname);

	const avatarUrl = $derived(
		data.user.avatar
			? `https://cdn.discordapp.com/avatars/${data.user.discordId}/${data.user.avatar}.png?size=64`
			: null
	);

	let userMenuOpen = $state(false);
</script>

<svelte:window onclick={(e) => { if (!(e.target as Element)?.closest('.user-menu')) userMenuOpen = false; }} />

<div class="app-shell">
	<!-- Fixed top header -->
	<header class="app-header">
		<div class="header-left">
			<span class="header-title">WACKASTOR</span>
			<div class="header-separator"></div>
			<span class="header-subtitle">GESTION_INVENTAIRE</span>
		</div>
		<div class="header-right">
			{#if data.corp}
				<div class="header-corp">
					<span class="header-corp-label">CORPORATION</span>
					<span class="header-corp-name corp-accent">{data.corp.name}</span>
				</div>
			{/if}

			<!-- User menu -->
			<div class="user-menu" class:open={userMenuOpen}>
				<button
					class="user-menu-trigger"
					onclick={() => (userMenuOpen = !userMenuOpen)}
					aria-label="Menu utilisateur"
				>
					<div class="header-avatar">
						{#if avatarUrl}
							<img src={avatarUrl} alt="" />
						{:else}
							<span class="avatar-fallback">{data.user.username[0].toUpperCase()}</span>
						{/if}
					</div>
				</button>

				{#if userMenuOpen}
					<div class="user-dropdown clipped-corner">
						<div class="dropdown-header">
							<div class="dropdown-username">{data.user.username.toUpperCase()}</div>
							<div class="dropdown-discord-id">{data.user.discordId}</div>
						</div>
						{#if data.corp}
							<div class="dropdown-corp">
								<span class="dropdown-corp-label">CORPORATION</span>
								<span class="dropdown-corp-name">{data.corp.name.toUpperCase()}</span>
								<span class="dropdown-corp-role">
									{data.corp.role === 'admin' ? '// ADMINISTRATEUR' : '// MEMBRE'}
								</span>
							</div>
						{:else}
							<div class="dropdown-corp">
								<span class="dropdown-corp-role no-corp">// AUCUNE_CORPORATION</span>
							</div>
						{/if}
						<div class="dropdown-actions">
							<a href="/auth/logout" class="dropdown-logout">
								<span class="material-symbols-outlined">logout</span>
								DECONNEXION
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Fixed left sidebar -->
	<nav class="sidebar">
		<div class="sidebar-header">
			<div class="sidebar-section-name">STOCK_MGMT</div>
			<div class="sidebar-section-sub">SECTEUR_WCK</div>
		</div>

		<div class="sidebar-nav">
			{#each navItems as item}
				<a href={item.href} class="nav-link" class:active={currentPath.startsWith(item.href)}>
					<span class="material-symbols-outlined nav-icon">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}

			{#if data.corp?.role === 'admin'}
				<a href="/admin" class="nav-link" class:active={currentPath.startsWith('/admin')}>
					<span class="material-symbols-outlined nav-icon">admin_panel_settings</span>
					<span>ADMIN</span>
				</a>
			{/if}
		</div>

		<div class="sidebar-footer">
			<a href="/auth/logout" class="sidebar-footer-link">
				<span class="material-symbols-outlined nav-icon-sm">logout</span>
				<span>DECONNEXION</span>
			</a>
		</div>
	</nav>

	<!-- Main content area -->
	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
	}

	/* ── HEADER ── */
	.app-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		height: var(--header-height);
		background: var(--color-bg-primary);
		border-bottom: 1px solid var(--color-border-dim);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--space-lg);
		font-family: var(--font-headline);
		text-transform: uppercase;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}
	.header-title {
		font-size: var(--font-size-xl);
		font-weight: 800;
		color: var(--color-accent-gold);
		letter-spacing: 0.15em;
		filter: drop-shadow(0 0 8px rgba(255, 193, 93, 0.4));
	}
	.header-separator {
		width: 1px;
		height: 16px;
		background: var(--color-border-dim);
		margin: 0 var(--space-sm);
	}
	.header-subtitle {
		font-size: var(--font-size-xs);
		color: rgba(255, 193, 93, 0.6);
		letter-spacing: 0.3em;
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: var(--space-xl);
	}
	.header-corp {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.header-corp-label {
		font-size: var(--font-size-xs);
		color: rgba(255, 193, 93, 0.4);
		letter-spacing: 0.2em;
	}
	.header-corp-name {
		font-size: var(--font-size-xs);
		color: var(--color-accent-gold);
		font-weight: 600;
	}
	.corp-accent {
		color: var(--color-accent-cyan);
	}
	/* ── USER MENU ── */
	.user-menu {
		position: relative;
		padding-left: var(--space-md);
		border-left: 1px solid var(--color-border-dim);
	}
	.user-menu-trigger {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: block;
	}
	.header-avatar {
		width: 40px;
		height: 40px;
		background: rgba(255, 193, 93, 0.1);
		border: 1px solid rgba(255, 193, 93, 0.3);
		overflow: hidden;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color 75ms;
	}
	.user-menu.open .header-avatar,
	.user-menu-trigger:hover .header-avatar {
		border-color: var(--color-accent-gold);
	}
	.header-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(30%);
		opacity: 0.9;
	}
	.avatar-fallback {
		font-family: var(--font-headline);
		font-size: var(--font-size-md);
		font-weight: 700;
		color: var(--color-accent-gold);
	}
	.user-dropdown {
		position: absolute;
		top: calc(100% + 10px);
		right: 0;
		width: 240px;
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border-dim);
		z-index: 100;
		display: flex;
		flex-direction: column;
	}
	.dropdown-header {
		padding: var(--space-md);
		border-bottom: 1px solid rgba(255, 193, 93, 0.15);
	}
	.dropdown-username {
		font-family: var(--font-headline);
		font-size: var(--font-size-sm);
		font-weight: 700;
		color: var(--color-text-primary);
		letter-spacing: 0.05em;
	}
	.dropdown-discord-id {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
		margin-top: 2px;
	}
	.dropdown-corp {
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.2);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.dropdown-corp-label {
		font-family: var(--font-label);
		font-size: 9px;
		color: rgba(255, 193, 93, 0.4);
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}
	.dropdown-corp-name {
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-accent-gold);
		letter-spacing: 0.05em;
	}
	.dropdown-corp-role {
		font-family: var(--font-mono);
		font-size: var(--font-size-xs);
		color: var(--color-accent-cyan);
	}
	.dropdown-corp-role.no-corp {
		color: var(--color-text-muted);
	}
	.dropdown-actions {
		padding: var(--space-xs);
	}
	.dropdown-logout {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		color: var(--color-text-muted);
		text-decoration: none;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}
	.dropdown-logout:hover {
		color: var(--color-accent-red);
		background: rgba(255, 115, 81, 0.07);
	}
	.dropdown-logout .material-symbols-outlined {
		font-size: 16px;
	}

	/* ── SIDEBAR ── */
	.sidebar {
		position: fixed;
		left: 0;
		top: var(--header-height);
		height: calc(100vh - var(--header-height));
		width: var(--sidebar-width);
		display: flex;
		flex-direction: column;
		background: var(--color-bg-primary);
		border-right: 1px solid var(--color-border-dim);
		font-family: var(--font-headline);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		font-size: var(--font-size-xs);
	}
	.sidebar-header {
		padding: var(--space-lg) var(--space-lg) var(--space-md);
	}
	.sidebar-section-name {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-accent-gold);
	}
	.sidebar-section-sub {
		font-size: var(--font-size-xs);
		color: rgba(255, 193, 93, 0.4);
		margin-top: 2px;
	}
	.sidebar-nav {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding-top: var(--space-md);
	}
	.nav-link {
		display: flex;
		align-items: center;
		padding: var(--space-md) var(--space-lg);
		color: rgba(255, 193, 93, 0.5);
		text-decoration: none;
		font-size: var(--font-size-xs);
		font-weight: 500;
		letter-spacing: 0.15em;
		border-left: 2px solid transparent;
		transition: color 75ms, background 75ms;
	}
	.nav-link:hover {
		color: var(--color-accent-gold);
		background: rgba(255, 193, 93, 0.05);
	}
	.nav-link:active {
		transform: scale(0.97);
	}
	.nav-link.active {
		color: var(--color-accent-cyan);
		border-left-color: var(--color-accent-cyan);
		background: rgba(94, 234, 212, 0.06);
	}
	.nav-link.active:hover {
		color: var(--color-accent-cyan);
		background: rgba(94, 234, 212, 0.1);
	}
	.nav-icon {
		margin-right: var(--space-md);
		font-size: 20px;
	}
	.sidebar-footer {
		margin-top: auto;
		padding: var(--space-md) var(--space-lg) var(--space-lg);
		border-top: 1px solid rgba(255, 193, 93, 0.1);
	}
	.sidebar-footer-link {
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-sm);
		color: var(--color-text-muted);
		text-decoration: none;
		font-size: var(--font-size-xs);
		letter-spacing: 0.15em;
		transition: color 75ms;
	}
	.sidebar-footer-link:hover {
		color: var(--color-accent-red);
	}
	.nav-icon-sm {
		font-size: 16px;
		margin-right: 12px;
	}

	/* ── MAIN ── */
	.app-main {
		margin-left: var(--sidebar-width);
		padding-top: var(--header-height);
	}
	.app-main > :global(*) {
		padding: var(--space-xl);
		padding-top: calc(var(--space-sm));
		max-width: 1600px;
		margin: 0 auto;
	}
</style>
