/** Fixed-width mono formatting so live readouts don't jitter. */

export function fixed(n: number, decimals = 2, width = 7): string {
  const s = n.toFixed(decimals);
  return s.padStart(width, ' ');
}

export function timestamp(d = new Date()): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}
