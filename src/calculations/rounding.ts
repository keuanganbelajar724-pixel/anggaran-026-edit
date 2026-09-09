/**
 * Numerical helper strictly adhering to prompt item 8:
 * round2(value) = Math.round((value + Number.EPSILON) * 100) / 100
 */
export function round2(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundDecimals(value: number, decimals: number = 2): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Safe division protecting against 0 / 0 and division by zero.
 * Never produces NaN or Infinity.
 */
export function safeDiv(num: number, denom: number, fallback: number = 0): number {
  if (!denom || isNaN(denom) || !isFinite(denom)) return fallback;
  if (isNaN(num) || !isFinite(num)) return fallback;
  const res = num / denom;
  return isFinite(res) && !isNaN(res) ? res : fallback;
}

export function average(nums: number[]): number {
  const valid = nums.filter(n => typeof n === 'number' && isFinite(n) && !isNaN(n));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return sum / valid.length;
}

export function formatScore(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return '0,00';
  return round2(value).toFixed(decimals).replace('.', ',');
}

export function formatRupiah(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return 'Rp 0';
  return 'Rp ' + Math.round(value).toLocaleString('id-ID');
}

export function formatPercent(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return '0,00%';
  return roundDecimals(value, decimals).toFixed(decimals).replace('.', ',') + '%';
}
