import { motion, type MotionValue } from 'motion/react';

/**
 * A live measured value: mono, Signal orange, tabular numerals.
 * Accepts a MotionValue<string> so per-frame updates hit the DOM directly
 * without re-rendering React.
 */
export function Readout({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | MotionValue<string>;
  unit?: string;
}) {
  return (
    <div className="readout-row">
      <span className="mono-label readout-label">{label}</span>
      {typeof value === 'string' ? (
        <span className="readout">{value}</span>
      ) : (
        <motion.span className="readout">{value}</motion.span>
      )}
      {unit ? <span className="mono readout-unit">{unit}</span> : null}
    </div>
  );
}
