<script lang="ts">
	interface Props {
		placeholder?: string;
		endpoint: string;
		value?: string;
		onSelect: (item: Record<string, unknown>) => void;
	}

	let { placeholder = 'Rechercher...', endpoint, value = '', onSelect }: Props = $props();

	let query = $state(value);
	let results = $state<Record<string, unknown>[]>([]);
	let isOpen = $state(false);
	let selectedIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout>;

	async function search(q: string) {
		if (q.length < 2) {
			results = [];
			isOpen = false;
			return;
		}
		try {
			const resp = await fetch(`${endpoint}?q=${encodeURIComponent(q)}&limit=10`);
			const json = await resp.json();
			results = json.data ?? [];
			isOpen = results.length > 0;
			selectedIndex = -1;
		} catch {
			results = [];
			isOpen = false;
		}
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => search(query), 250);
	}

	function handleSelect(item: Record<string, unknown>) {
		query = (item.name as string) ?? '';
		isOpen = false;
		onSelect(item);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			handleSelect(results[selectedIndex]);
		} else if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	function handleBlur() {
		// Delay to allow click on result
		setTimeout(() => { isOpen = false; }, 200);
	}
</script>

<div class="autocomplete">
	<input
		type="text"
		bind:value={query}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onblur={handleBlur}
		onfocus={() => { if (results.length > 0) isOpen = true; }}
		{placeholder}
		class="autocomplete-input"
		autocomplete="off"
	/>
	{#if isOpen}
		<ul class="autocomplete-results">
			{#each results as item, i}
				<li
					class="autocomplete-item"
					class:selected={i === selectedIndex}
					onmousedown={() => handleSelect(item)}
					role="option"
					aria-selected={i === selectedIndex}
				>
					<span class="item-name">{item.name}</span>
					{#if item.category}
						<span class="item-meta">{item.category}</span>
					{/if}
					{#if item.starSystemName}
						<span class="item-meta">{item.starSystemName}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.autocomplete {
		position: relative;
		width: 100%;
	}
	.autocomplete-input {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		color: var(--color-text-primary);
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
	}
	.autocomplete-input:focus {
		outline: none;
		border-color: var(--color-accent-orange);
	}
	.autocomplete-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		max-height: 240px;
		overflow-y: auto;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-top: none;
		z-index: 100;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.autocomplete-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-md);
		cursor: pointer;
		font-size: var(--font-size-sm);
	}
	.autocomplete-item:hover,
	.autocomplete-item.selected {
		background: var(--color-bg-tertiary);
		color: var(--color-accent-orange);
	}
	.item-name {
		flex: 1;
	}
	.item-meta {
		font-size: var(--font-size-xs);
		color: var(--color-text-muted);
	}
</style>
