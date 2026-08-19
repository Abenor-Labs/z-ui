/**
 * The real CLI's intro banner (packages/cli/src/ui/art.ts), as data rather
 * than re-derived per caller. `BANNER_ROWS` is that file's own
 * `figlet.textSync('Z-UI', { font: 'ANSI Shadow' })` output, generated once
 * with the CLI's actual installed figlet package, not hand-drawn.
 * `bannerRows()` reproduces `stopAt()`'s row gradient — white (255) fading
 * to charcoal (102), one solid color per row — so every page that shows
 * this banner reads it off one source instead of keeping its own copy.
 */
export const BANNER_ROWS = [
  '███████╗     ██╗   ██╗██╗',
  '╚══███╔╝     ██║   ██║██║',
  '  ███╔╝█████╗██║   ██║██║',
  ' ███╔╝ ╚════╝██║   ██║██║',
  '███████╗     ╚██████╔╝██║',
  '╚══════╝      ╚═════╝ ╚═╝',
];

export interface BannerRow {
  text: string;
  /** "r,g,b" — pass straight into rgb(${rgb}) */
  rgb: string;
}

export function bannerRows(): BannerRow[] {
  const last = Math.max(1, BANNER_ROWS.length - 1);
  return BANNER_ROWS.map((text, i) => {
    const t = i / last;
    const v = Math.round(255 + (102 - 255) * t);
    return { text, rgb: `${v},${v},${v}` };
  });
}
