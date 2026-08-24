/**
 * Shared types for the /lab control + playground system. Lab-only — nothing
 * here is a product fact, and nothing here is read by registry/ or the CLI.
 */

export type LabControlValue = number | string | boolean;
export type LabConfig = Record<string, LabControlValue>;

interface LabControlBase {
  id: string;
  label: string;
  /** shown under the control, e.g. what the parameter actually does */
  description?: string;
}

export interface LabRangeControl extends LabControlBase {
  type: 'range';
  min: number;
  max: number;
  step?: number;
  default: number;
  unit?: string;
}

export interface LabNumberControl extends LabControlBase {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  default: number;
  unit?: string;
}

export interface LabSelectControl extends LabControlBase {
  type: 'select';
  options: { value: string; label: string }[];
  default: string;
}

export interface LabSegmentedControl extends LabControlBase {
  type: 'segmented';
  options: { value: string; label: string }[];
  default: string;
}

export interface LabBooleanControl extends LabControlBase {
  type: 'boolean';
  default: boolean;
}

export type LabControl =
  | LabRangeControl
  | LabNumberControl
  | LabSelectControl
  | LabSegmentedControl
  | LabBooleanControl;

export interface LabPreset {
  id: string;
  label: string;
  values: LabConfig;
}

/** the compact facts row — INTERACTION / MOTION / STATUS / DEPENDENCIES */
export interface LabMeta {
  interaction: string;
  motion: string;
  status?: string;
  dependencies?: string;
}

export function defaultConfigFrom(controls: LabControl[]): LabConfig {
  const config: LabConfig = {};
  for (const c of controls) config[c.id] = c.default;
  return config;
}
