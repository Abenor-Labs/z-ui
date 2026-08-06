/**
 * Catalogue layout facts, shared by the server page that lays the grid out and
 * the client card that sizes itself.
 *
 * This lives outside `catalog-card.tsx` on purpose. That file is `'use client'`,
 * and a non-component value exported across the RSC boundary arrives on the
 * server as a client reference rather than the value itself — a `Set` imported
 * that way has no `.has`.
 */

/**
 * Components that need more than a tile. The catalogue is a grid of equals
 * everywhere else, so widening one has to be earned: a month view compressed
 * into a third of the page is a screenshot of a calendar, not a calendar.
 */
export const WIDE: ReadonlySet<string> = new Set(['scheduler'])
