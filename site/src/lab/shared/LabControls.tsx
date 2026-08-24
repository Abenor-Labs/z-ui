import { Chase } from '@z-ui/registry/chase/chase';
import type { LabConfig, LabControl } from './labTypes';

/**
 * Renders one control row for a LabPlayground, switched on `control.type`.
 * Segmented options run through the site's own `chase` — the product
 * playground already refuses to ship a bespoke segmented control to
 * demonstrate its own segmented control, and the lab follows the same rule.
 */
export function LabControlRow({
  control,
  value,
  onChange,
}: {
  control: LabControl;
  value: LabConfig[string];
  onChange: (id: string, value: LabConfig[string]) => void;
}) {
  const readout = () => {
    if (control.type === 'range' || control.type === 'number') {
      return `${value}${control.unit ?? ''}`;
    }
    return null;
  };

  return (
    <div className={`lab-control${control.type === 'segmented' ? ' lab-control-wide' : ''}`}>
      <div className="lab-control-head">
        <span className="mono-label lab-control-label">{control.label}</span>
        {readout() !== null ? <span className="mono lab-control-readout">{readout()}</span> : null}
      </div>

      {control.type === 'range' ? (
        <input
          type="range"
          className="lab-range"
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          value={value as number}
          onChange={(e) => onChange(control.id, Number(e.target.value))}
          aria-label={control.label}
        />
      ) : null}

      {control.type === 'number' ? (
        <input
          type="number"
          className="lab-number"
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          value={value as number}
          onChange={(e) => onChange(control.id, Number(e.target.value))}
          aria-label={control.label}
        />
      ) : null}

      {control.type === 'select' ? (
        <select
          className="lab-select mono"
          value={value as string}
          onChange={(e) => onChange(control.id, e.target.value)}
          aria-label={control.label}
        >
          {control.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : null}

      {control.type === 'segmented' ? (
        <Chase
          label={control.label}
          options={control.options}
          value={value as string}
          onValueChange={(v: string) => onChange(control.id, v)}
        />
      ) : null}

      {control.type === 'boolean' ? (
        <button
          type="button"
          className={`lab-toggle mono${value ? ' lab-toggle-on' : ''}`}
          aria-pressed={value as boolean}
          onClick={() => onChange(control.id, !value)}
        >
          {value ? 'on' : 'off'}
        </button>
      ) : null}

      {control.description ? <p className="lab-control-desc">{control.description}</p> : null}
    </div>
  );
}
