/**
 * Pure geometry for the dial's rotary face. No React, no motion — every
 * number here is derived from two facts: the finger stop is fixed on the
 * bezel at 120° (4 o'clock, clockwise from 12), and the ten holes sit 30°
 * apart on the rotor. Angles are degrees, clockwise-positive from 12
 * o'clock, matching the SVG `rotate(a)` convention already used by the
 * flywheel face — a=0 is straight up.
 */

export const FINGER_STOP_DEG = 120;
export const HOLE_RADIUS_PX = 36;
export const HOLE_R_PX = 7;
export const GOVERNOR_SPEED = 300; // deg/s, constant return speed
export const SEAT_HANDOFF_DEG = 15; // remaining rotation handed to the spring
export const COMMIT_THRESHOLD_DEG = 30; // pull shorter than this aborts, no digit

/** digit's angular position on the rotor when rotation = 0 (at rest) */
export function holeRestAngle(digit: number): number {
  const n = digit === 0 ? 10 : digit;
  return (3 - n) * 30;
}

/** rotation value (always positive) at which this digit's hole reaches the stop */
export function pullDistance(digit: number): number {
  return FINGER_STOP_DEG - holeRestAngle(digit);
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
