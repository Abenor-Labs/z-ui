/**
 * The single SVG plotter used by dial (velocity over time) and disclosure
 * (height over time). Grid in Rule, trace in Signal — a real artifact of the
 * user's own interaction, never ornament.
 */

export interface Sample {
  t: number; // seconds (monotonic)
  v: number;
}

export function SpringGraph({
  samples,
  windowSec = 3,
  yLabel,
  symmetric = false,
  height = 160,
}: {
  samples: Sample[];
  windowSec?: number;
  yLabel: string;
  /** symmetric: y spans ±max (velocity); otherwise 0…max (height) */
  symmetric?: boolean;
  height?: number;
}) {
  const W = 640;
  const H = height;
  const PAD = 8;

  const now = samples.length ? samples[samples.length - 1].t : 0;
  const t0 = now - windowSec;
  const visible = samples.filter((s) => s.t >= t0);

  let maxAbs = 1e-6;
  for (const s of visible) maxAbs = Math.max(maxAbs, Math.abs(s.v));
  const yMax = Math.max(symmetric ? 2 : 8, maxAbs) * 1.1;
  const yMin = symmetric ? -yMax : 0;

  const x = (t: number) => PAD + ((t - t0) / windowSec) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  const points = visible.map((s) => `${x(s.t).toFixed(1)},${y(s.v).toFixed(1)}`).join(' ');

  const gridX: number[] = [];
  for (let i = 0; i <= windowSec * 2; i++) gridX.push(PAD + (i / (windowSec * 2)) * (W - 2 * PAD));
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((f) => PAD + f * (H - 2 * PAD));

  return (
    <figure className="springgraph">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${yLabel} over the last ${windowSec} seconds`}
        preserveAspectRatio="none"
      >
        {gridX.map((gx, i) => (
          <line key={`x${i}`} x1={gx} y1={PAD} x2={gx} y2={H - PAD} stroke="var(--rule)" strokeWidth="1" />
        ))}
        {gridY.map((gy, i) => (
          <line key={`y${i}`} x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="var(--rule)" strokeWidth="1" />
        ))}
        {symmetric ? (
          <line x1={PAD} y1={y(0)} x2={W - PAD} y2={y(0)} stroke="var(--ink)" strokeWidth="1" opacity="0.35" />
        ) : null}
        {visible.length >= 2 ? (
          <polyline points={points} fill="none" stroke="var(--signal)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        ) : null}
      </svg>
      <figcaption className="mono-label springgraph-caption">
        <span>{yLabel}</span>
        <span>
          {symmetric ? `±${yMax.toFixed(0)}` : `0…${yMax.toFixed(0)}`} · last {windowSec}s
        </span>
      </figcaption>
    </figure>
  );
}
