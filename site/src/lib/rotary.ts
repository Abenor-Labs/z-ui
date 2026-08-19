/**
 * Pure geometry for the dial's rotary face. No React, no motion — every
 * number here is derived from three facts: the finger stop is fixed on the
 * bezel at 120° (4 o'clock, clockwise from 12); the ten holes sit 30° apart
 * on the rotor; and a real pulse dial encodes a digit as that many pulses —
 * one trip of the cam per 30° of return travel, so a digit's full pull is
 * exactly `pulses × 30°`, no more. Digit 1 is a 30° pull; 0 (ten pulses,
 * since a zero-pulse train is indistinguishable from nothing) is 300°.
 *
 * Angles are degrees, clockwise-positive from 12 o'clock, matching the SVG
 * `rotate(a)` convention already used by the flywheel face — a=0 is straight
 * up.
 */

export const FINGER_STOP_DEG = 120;
export const HOLE_RADIUS_PX = 36;
export const HOLE_R_PX = 7;
export const PULSE_STEP_DEG = 30;
export const GOVERNOR_SPEED = 300; // deg/s, constant return speed — ~10 pulses/s
export const SEAT_HANDOFF_DEG = 15; // remaining rotation handed to the spring
export const ENGAGE_FRACTION = 0.85; // fraction of a digit's own travel required to commit

export const LETTERS: Record<number, string> = {
  2: 'ABC',
  3: 'DEF',
  4: 'GHI',
  5: 'JKL',
  6: 'MNO',
  7: 'PRS',
  8: 'TUV',
  9: 'WXY',
};

/** how many pulses a digit encodes — 0 is ten, everything else is itself */
export function pulsesFor(digit: number): number {
  return digit === 0 ? 10 : digit;
}

/** digit's angular position on the rotor when rotation = 0 (at rest) */
export function holeRestAngle(digit: number): number {
  return FINGER_STOP_DEG - PULSE_STEP_DEG * pulsesFor(digit);
}

/** rotation value (always positive) at which this digit's hole reaches the stop —
 *  exactly one pulse-step per pulse, no slack */
export function pullDistance(digit: number): number {
  return PULSE_STEP_DEG * pulsesFor(digit);
}

/** how many of a digit's pulses have tripped so far, given the rotor has
 *  this much rotation left to travel before it reaches rest (0) */
export function pulsesTripped(digit: number, remainingRotation: number): number {
  const total = pulsesFor(digit);
  const traveled = pullDistance(digit) - remainingRotation;
  return Math.max(0, Math.min(total, Math.floor(traveled / PULSE_STEP_DEG)));
}

/** shortest signed difference a-b, wrapped into (-180, 180] */
export function angleDelta(a: number, b: number): number {
  return (((a - b + 180) % 360) + 360) % 360 - 180;
}

/** convert a pointer angle measured from 3 o'clock (atan2 convention) to
 *  the 12-o'clock, clockwise-positive convention every other angle here uses */
export function from3OClock(pointerAngleDeg: number): number {
  return angleDelta(pointerAngleDeg + 90, 0);
}

/** which digit's hole is angularly nearest the pointer right now */
export function nearestDigit(pointerAngleFrom12: number, currentRotation: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let d = 0; d <= 9; d++) {
    const screenAngle = holeRestAngle(d) + currentRotation;
    const dist = Math.abs(angleDelta(pointerAngleFrom12, screenAngle));
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

/** screen position of a hole (or anything else) at radius r, angle a — SVG local coords */
export function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: r * Math.sin(rad), y: -r * Math.cos(rad) };
}

/** a closed circular subpath, for combining shapes into one fill-rule="evenodd" path */
export function circlePathD(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
}
