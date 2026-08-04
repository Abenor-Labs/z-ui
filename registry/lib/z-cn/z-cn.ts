import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names, resolving conflicting Tailwind utilities in favor of
 * the last one passed.
 *
 * Named `zcn` rather than `cn` so it never collides with the `cn` a project
 * may already have from shadcn/ui. Z-UI components always pass the consumer's
 * `className` last, which is what makes overriding a built-in utility work:
 * Tailwind resolves by source order, not specificity, so plain concatenation
 * would make overrides a coin flip.
 */
export function zcn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
