<script lang="ts">
	interface Props {
		variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
		label: string;
	}

	let { variant = 'default', label }: Props = $props();

	const variantStyles: Record<string, { color: string; bg: string; glow: string }> = {
		success: {
			color: 'var(--color-accent-green)',
			bg: 'transparent',
			glow: 'none'
		},
		warning: {
			color: 'var(--color-accent-gold)',
			bg: 'transparent',
			glow: 'none'
		},
		error: {
			color: 'var(--color-bg-primary)',
			bg: 'var(--color-accent-red)',
			glow: '0 0 15px rgba(255, 115, 81, 0.4)'
		},
		info: {
			color: 'var(--color-accent-cyan)',
			bg: 'transparent',
			glow: 'none'
		},
		default: {
			color: 'var(--color-text-secondary)',
			bg: 'transparent',
			glow: 'none'
		}
	};

	const style = $derived(variantStyles[variant]);
	const isFilled = $derived(variant === 'error');
</script>

<span
	class="badge"
	class:filled={isFilled}
	style:--badge-color={style.color}
	style:--badge-bg={style.bg}
	style:--badge-glow={style.glow}
>
	[ {label.toUpperCase()} ]
</span>

<style>
	.badge {
		display: inline-block;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--badge-color);
		border: 1px solid var(--badge-color);
		padding: 2px 8px;
		line-height: 1.4;
		white-space: nowrap;
	}
	.badge.filled {
		background: var(--badge-bg);
		border-color: var(--badge-bg);
		box-shadow: var(--badge-glow);
	}
</style>
