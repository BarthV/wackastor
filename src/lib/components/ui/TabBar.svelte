<script lang="ts">
	interface Tab {
		key: string;
		label: string;
		icon?: string;
	}

	interface Props {
		tabs: Tab[];
		active: string;
		onSelect: (key: string) => void;
	}

	let { tabs, active, onSelect }: Props = $props();
</script>

<div class="tab-bar">
	{#each tabs as tab}
		<button
			class="tab-btn"
			class:tab-active={active === tab.key}
			onclick={() => onSelect(tab.key)}
		>
			{#if tab.icon}
				<span class="material-symbols-outlined tab-icon">{tab.icon}</span>
			{/if}
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.tab-bar {
		display: flex;
		border-bottom: 1px solid rgba(72, 72, 73, 0.3);
		gap: 0;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: rgba(255, 193, 93, 0.4);
		cursor: pointer;
		transition: color 75ms, border-color 75ms;
	}

	.tab-btn:hover {
		color: rgba(255, 193, 93, 0.8);
	}

	.tab-btn.tab-active {
		color: var(--color-accent-cyan);
		border-bottom-color: var(--color-accent-cyan);
	}

	.tab-icon {
		font-size: 16px;
	}
</style>
