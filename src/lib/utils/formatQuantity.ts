/**
 * Format a quantity with its unit, auto-switching SCU ↔ cSCU:
 * - Round numbers → SCU
 * - cSCU representation > 5 digits → SCU
 * - Otherwise → cSCU (×100)
 */
export function formatQuantity(qty: number, unit: string): string {
	if (unit !== 'SCU') {
		return `${qty % 1 === 0 ? qty : qty.toLocaleString('fr-FR')} ${unit}`;
	}

	const isInteger = Number.isInteger(qty);
	const cscuValue = Math.round(qty * 100);
	const cscuDigits = cscuValue.toString().length;

	if (isInteger || cscuDigits > 5) {
		return `${qty.toLocaleString('fr-FR')} SCU`;
	}
	return `${cscuValue} cSCU`;
}
