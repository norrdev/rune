/**
 * Copies committed Android resource overlays into the generated Tauri Android project.
 * Run after `tauri icon` or whenever `src-tauri/gen/android` exists (e.g. post `tauri android dev`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const genRes = path.join(root, 'src-tauri/gen/android/app/src/main/res');
const brandRoot = path.join(root, 'src-tauri/branding/android');

const copies = [
  ['values-v31/themes.xml', 'values-v31/themes.xml'],
  ['drawable/ic_launcher_background.xml', 'drawable/ic_launcher_background.xml'],
];

if (!fs.existsSync(genRes)) {
  console.warn(
    '[sync-android-branding] src-tauri/gen/android/.../res missing — skip (run `npx tauri android dev` or `tauri android init` first).',
  );
  process.exit(0);
}

for (const [relFrom, relTo] of copies) {
  const from = path.join(brandRoot, relFrom);
  const to = path.join(genRes, relTo);
  if (!fs.existsSync(from)) {
    console.warn(`[sync-android-branding] missing source: ${from}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`[sync-android-branding] ${relFrom} -> gen/android/.../res/${relTo}`);
}
