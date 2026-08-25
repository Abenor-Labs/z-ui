/**
 * The registry's public API, extracted from the component sources.
 *
 * GENERATED, then committed — every row here was read out of the real
 * `*Props` type in registry/components/, including the doc comment. Nothing
 * on this page is written from memory, which is the only way a props table
 * stays true after the component changes.
 *
 * Regenerate with scripts in the scratchpad if the interfaces move; the
 * failure mode this file exists to prevent is documentation that describes a
 * component the CLI no longer installs.
 */

export interface PropDoc {
  name: string;
  type: string;
  required: boolean;
  /** Default as written in the component's own signature. */
  def?: string;
  /** The prop's JSDoc, verbatim. */
  doc?: string;
}

export interface ComponentApi {
  /** The exported props type, for anyone reading the source alongside. */
  type: string;
  props: PropDoc[];
  /** The smallest snippet that actually runs. */
  usage: string;
}

export const API: Record<string, ComponentApi> = {
  'dial': {
    type: 'DialProps',
    props: [
      { name: 'ref', type: 'Ref<DialHandle>', required: false },
      { name: 'size', type: 'number', required: false, def: '320' },
      { name: 'sound', type: 'boolean', required: false, def: 'false', doc: 'Synthesised mechanical click. Off by default: an install should be quiet.' },
      { name: 'onDigit', type: '(digit: number) => void', required: false },
      { name: 'onPulse', type: '(i: number, n: number) => void', required: false },
    ],
    usage: `<Dial onDigit={(d) => console.log(d)} />`,
  },
  'chase': {
    type: 'ChaseProps',
    props: [
      { name: 'label', type: 'string', required: true, doc: 'Accessible name for the group. Required: the options label themselves, the control as a whole has no text to borrow. */' },
      { name: 'options', type: 'ChaseOption[]', required: true },
      { name: 'defaultValue', type: 'string', required: false, doc: 'Uncontrolled starting selection. Ignored when `value` is passed.' },
      { name: 'value', type: 'string', required: false, doc: 'Pass to control. Omit and the component owns its own state.' },
      { name: 'onValueChange', type: '(value: string) => void', required: false, doc: 'Fires the instant a different option is chosen, before anything moves.' },
      { name: 'onSettle', type: '(value: string) => void', required: false, doc: 'Fires when the pill has physically stopped under the selection.' },
    ],
    usage: `<Chase
  label="Filter"
  options={[
    { value: 'all', label: 'all' },
    { value: 'mine', label: 'mine' },
  ]}
  defaultValue="all"
/>`,
  },
  'heft': {
    type: 'HeftProps',
    props: [
      { name: 'height', type: 'number', required: false, def: '360' },
      { name: 'initialBodies', type: 'HeftBodySpec[]', required: true },
      { name: 'startAsleep', type: 'boolean', required: false, def: 'false', doc: 'bodies hold position until first pointer interaction — nothing autoplays' },
      { name: 'onContacts', type: '(n: number) => void', required: false },
      { name: 'spawnCount', type: 'number', required: false, def: '0', doc: 'increment to drop a new object in' },
      { name: 'className', type: 'string', required: false },
      { name: 'label', type: 'string', required: false, def: '\'Physics sandbox\'', doc: 'accessible name for the sandbox' },
    ],
    usage: `<Heft
  height={320}
  initialBodies={[{ w: 64, h: 40 }, { w: 48, h: 48 }]}
/>`,
  },
  'disclosure': {
    type: 'DisclosureProps',
    props: [
      { name: 'label', type: 'React.ReactNode', required: true, doc: 'The trigger\'s visible text, and its accessible name.' },
      { name: 'children', type: 'React.ReactNode', required: true },
      { name: 'defaultOpen', type: 'boolean', required: false, def: 'false', doc: 'Uncontrolled starting state. Ignored when `open` is passed.' },
      { name: 'open', type: 'boolean', required: false, doc: 'Pass to control. Omit and the component owns its own state.' },
      { name: 'onOpenChange', type: '(open: boolean) => void', required: false, doc: 'Fires the instant the trigger is used, before anything moves.' },
      { name: 'onOpenChangeComplete', type: '(open: boolean) => void', required: false, doc: 'Fires when the panel has physically stopped, with the state it stopped in. Also fires on the reduced-motion path, where "stopped" is immediate. Does not fire when a transition is interrupted — the interrupting transition\'s own completion is the one that reports.' },
    ],
    usage: `<Disclosure label="Specifications">
  <p>Press again mid-open and it reverses from where it is.</p>
</Disclosure>`,
  },
  'hold-drain': {
    type: 'HoldDrainProps',
    props: [
      { name: 'label', type: 'React.ReactNode', required: true, doc: 'Resting label, and the accessible name while idle.' },
      { name: 'armedLabel', type: 'React.ReactNode', required: false, doc: 'Shown once the fill completes. Defaults to the resting label.' },
      { name: 'committedLabel', type: 'React.ReactNode', required: false, doc: 'Shown after the action fires. Defaults to the armed label.' },
      { name: 'duration', type: 'number', required: false, def: '1200', doc: 'Milliseconds of held time required to arm, and therefore also the time a full drain takes. Quantised by nothing — a partial hold costs its own fraction of this.' },
      { name: 'onConfirm', type: '() => void', required: true, doc: 'Fires once, on the release that happens while armed.' },
      { name: 'onCancel', type: '() => void', required: false, doc: 'Fires when a drain completes and the control is back at rest.' },
    ],
    usage: `<HoldDrain
  label="hold to delete"
  armedLabel="release to delete"
  committedLabel="deleted"
  duration={1600}
  onConfirm={remove}
/>`,
  },
  'late-critique': {
    type: 'LateCritiqueProps',
    props: [
      { name: 'label', type: 'React.ReactNode', required: true, doc: 'Visible label, and the accessible name.' },
      { name: 'validate', type: '(value: string) => string | null', required: true, doc: 'Returns the complaint, or null when the value is acceptable.' },
      { name: 'defaultValue', type: 'string', required: false, def: '\'\'', doc: 'Uncontrolled starting value. Ignored when `value` is passed.' },
      { name: 'value', type: 'string', required: false, doc: 'Pass to control. Omit and the field owns its own value.' },
      { name: 'onValueChange', type: '(value: string) => void', required: false },
      { name: 'onVerdict', type: '(state: LateCritiqueState) => void', required: false, doc: 'Fires whenever the verdict changes, with the state it changed to.' },
      { name: 'quietMs', type: 'number', required: false, def: 'DEFAULT_QUIET_MS', doc: 'Milliseconds of quiet before the field is willing to judge.' },
    ],
    usage: `<LateCritique
  label="Email"
  validate={(v) => (v.includes('@') ? null : 'Needs an @')}
/>`,
  },
  'scramble-reveal': {
    type: 'UseScrambleOptions',
    props: [
      { name: 'text', type: 'string', required: true, doc: 'The real string. It is also the accessible name, and the box the effect is painted into.' },
      { name: 'duration', type: 'number', required: false, def: '620', doc: 'Total decode time in ms. Quantised to a whole number of ticks, floored at 24ms each.' },
      { name: 'ease', type: 'ScrambleEase', required: false, def: '\'out\'', doc: 'Carried, not applied. In the source design this names the order glyphs settle in; nothing in this implementation interpolates, so there is no curve for it to drive. It rides through to `data-ease` so a consumer can key off it, and it is in the API because removing it would silently change the meaning of snippets that already pass it. It does not currently alter a single frame, and pretending otherwise would be the easiest lie in the file.' },
      { name: 'chance', type: 'number', required: false, def: '0.86', doc: 'Probability, 0 to 1, that an unsettled glyph re-randomises on a given tick.' },
      { name: 'chars', type: 'string', required: false, def: 'SCRAMBLE_SETS.symbols', doc: 'Pool to draw random glyphs from.' },
      { name: 'trigger', type: 'ScrambleTrigger', required: false, def: '\'hover\'', doc: 'What starts the decode. `hover` and `view` need `ref` attached.' },
      { name: 'concealed', type: 'boolean', required: false, def: 'false', doc: 'Rest as noise instead of as the answer. Without this, a `hover` reveal is backwards: the line sits there fully legible, and hovering it scrambles the thing you had already read. With it, the line rests as a static field of glyphs and the first trigger is a genuine reveal — the decode runs toward text the reader has not seen. The concealment is static, not an idle animation, and it is deterministic on purpose: a random frame would differ between server and client and trip hydration. The visually-hidden node still carries the real string at every moment, so a screen reader is never behind the effect — but a sighted keyboard-only user has no way to fire a `hover` trigger, so conceal decorative or repeated text, never the only copy of something load-bearing.' },
      { name: 'playOnce', type: 'boolean', required: false, def: 'true', doc: 'Gates the *trigger* only. `run()` is imperative and always runs, so a replay button still works.' },
      { name: 'onComplete', type: '() => void', required: false, doc: 'Fires once per completed run, including the reduced-motion path.' },
    ],
    usage: `<ScrambleReveal text="decodes out of random glyphs" trigger="hover" />`,
  },
  'thinking-orb': {
    type: 'ThinkingOrbProps',
    props: [
      { name: 'state', type: 'OrbState', required: false, def: '\'working\'', doc: 'Which animation to show. @default \'working\'' },
      { name: 'size', type: 'OrbSize', required: false, def: '64', doc: 'Tuned size preset — 64 or 20 CSS px. @default 64' },
      { name: 'theme', type: 'OrbTheme', required: false, def: '\'auto\'', doc: 'Theme mode; `auto` detects from the host project. @default \'auto\'' },
      { name: 'speed', type: 'number', required: false, def: '1', doc: 'Animation speed multiplier on top of the preset\'s baked speed. @default 1' },
      { name: 'paused', type: 'boolean', required: false, def: 'false', doc: 'Freeze the animation on the current frame. @default false' },
      { name: 'style', type: 'React.CSSProperties', required: false },
    ],
    usage: `<ThinkingOrb state="working" size={64} />`,
  },
};
