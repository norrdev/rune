/**
 * Build a signed Android App Bundle (AAB) for Google Play.
 * Requires src-tauri/gen/android (run `npx tauri android init` once) and key.properties for signing.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const keyProps = path.join(root, 'src-tauri/gen/android/key.properties');
const bundleDir = path.join(
  root,
  'src-tauri/gen/android/app/build/outputs/bundle',
);

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!fs.existsSync(keyProps)) {
  console.error(
    '[android-release] Missing src-tauri/gen/android/key.properties — copy from OpenGym or set up signing first.',
  );
  process.exit(1);
}

console.log('[android-release] Building web assets…');
run('npm', ['run', 'build']);

console.log('[android-release] Building signed AAB…');
run('npx', ['tauri', 'android', 'build', '--aab']);

function findAabs(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) findAabs(full, acc);
    else if (name.endsWith('.aab')) acc.push(full);
  }
  return acc;
}

const aabs = findAabs(bundleDir).sort();
if (aabs.length === 0) {
  console.warn('[android-release] Build finished but no .aab found under outputs/bundle/');
} else {
  console.log('[android-release] Upload to Google Play:');
  for (const aab of aabs) console.log(`  ${aab}`);
}
