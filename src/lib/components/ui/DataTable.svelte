<script lang="ts">
	interface Column {
		key: string;
		label: string;
	}

	interface Props {
		columns: Column[];
		rows: Record<string, string | number>[];
	}

	let { columns, rows }: Props = $props();
</script>

<div class="data-table-wrapper clipped-corner">
	<table class="data-table">
		<thead>
			<tr>
				{#each columns as col}
					<th>{col.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr>
					{#each columns as col}
						<td>{row[col.key] ?? ''}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.data-table-wrapper {
		overflow-x: auto;
		background: var(--color-bg-secondary);
		border: 1px solid rgba(72, 72, 73, 0.2);
	}
	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-sm);
	}
	.data-table th {
		text-align: left;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		font-family: var(--font-label);
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--color-accent-gold);
		padding: var(--space-md);
		background: var(--color-bg-panel);
		border-bottom: 1px solid rgba(255, 193, 93, 0.3);
		white-space: nowrap;
	}
	.data-table td {
		padding: var(--space-md);
		border-bottom: 1px solid rgba(72, 72, 73, 0.1);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}
	.data-table tbody tr:hover {
		background: rgba(255, 193, 93, 0.05);
	}
</style>
