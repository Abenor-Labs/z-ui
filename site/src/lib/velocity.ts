/**
 * Shared pointer-velocity estimator (dial, heft). Keeps a short history of
 * timestamped samples and reports velocity over the last ~80ms window.
 */
export class VelocityTracker {
  private samples: { t: number; v: number }[] = [];

  push(value: number, t = performance.now()) {
    this.samples.push({ t, v: value });
    const cutoff = t - 120;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();
  }

  /** units of value per second */
  read(now = performance.now()): number {
    const s = this.samples.filter((x) => x.t >= now - 80);
    const use = s.length >= 2 ? s : this.samples;
    if (use.length < 2) return 0;
    const a = use[0];
    const b = use[use.length - 1];
    const dt = (b.t - a.t) / 1000;
    if (dt <= 0) return 0;
    return (b.v - a.v) / dt;
  }

  reset() {
    this.samples = [];
  }
}
