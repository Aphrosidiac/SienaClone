export const lerp = (a, b, t) => a * (1 - t) + b * t;
export const map = (v, a, b, c, d) => c + ((d - c) * (v - a)) / (b - a);
export const clamp = (min, max, v) => Math.min(Math.max(v, min), max);
export const mod = (n, m) => ((n % m) + m) % m;
// wraps n into [-range, range) — used to loop a strip of items around the current one
export function wrapAround(n, range) {
  let t = mod(n, 2 * range);
  if (t >= range) t -= 2 * range;
  return t;
}
// wraps n into (-len/2, len/2]
export function wrapHalf(n, len) {
  let t = n % len;
  if (Math.abs(t) > len / 2) t = t > 0 ? t - len : t + len;
  return t;
}
