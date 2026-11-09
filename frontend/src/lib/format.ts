/**
 * Formats an exact decimal string without converting it to JavaScript Number.
 * This preserves long fractional values common in crypto-asset amounts.
 */
export function formatDecimal(value: string | number): string {
  const raw = String(value)
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return raw

  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [integer, fractional = ''] = unsigned.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const trimmed = fractional.replace(/0+$/, '')
  const precision = trimmed.padEnd(2, '0')

  return (negative ? '-' : '') + grouped + '.' + precision
}
