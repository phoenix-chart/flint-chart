// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Family name registered for the bundled font; used as the default everywhere. */
export const DEFAULT_FONT_FAMILY = 'DejaVu Sans';

const FONT_FILES = ['DejaVuSans.ttf', 'DejaVuSans-Bold.ttf'];

let fontDirCache: string | null = null;

/**
 * Locate the bundled `assets/fonts` directory.
 *
 * The render core is emitted to several places (`dist/server.js`,
 * `dist/render/index.js`) and is also run from source during tests, so we walk
 * up from this module until we find the bundled font, rather than assuming a
 * fixed relative depth.
 */
export function getFontDir(): string {
  if (fontDirCache) return fontDirCache;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'assets', 'fonts');
    if (existsSync(join(candidate, FONT_FILES[0]))) {
      fontDirCache = candidate;
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback to a CWD-relative guess (covers unusual install layouts).
  fontDirCache = join(process.cwd(), 'assets', 'fonts');
  return fontDirCache;
}

/** Absolute paths to the bundled TTF files that actually exist on disk. */
export function getFontFiles(): string[] {
  const dir = getFontDir();
  return FONT_FILES.map((f) => join(dir, f)).filter((p) => existsSync(p));
}

let napiRegistered = false;

/** Register the bundled fonts with `@napi-rs/canvas` (idempotent). */
export function registerNapiFonts(napiCanvas: any): void {
  if (napiRegistered || !napiCanvas?.GlobalFonts) return;
  for (const fp of getFontFiles()) {
    try {
      napiCanvas.GlobalFonts.registerFromPath(fp, 'sans-serif');
    } catch {
      /* ignore individual font registration failures */
    }
  }
  napiRegistered = true;
}

/** `@resvg/resvg-js` font option block referencing the bundled fonts. */
export function resvgFontOption(): {
  fontFiles: string[];
  loadSystemFonts: boolean;
  defaultFontFamily: string;
} {
  return {
    fontFiles: getFontFiles(),
    loadSystemFonts: true,
    defaultFontFamily: DEFAULT_FONT_FAMILY,
  };
}
