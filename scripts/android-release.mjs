/**
 * Build signed Android release package(s): AAB for Google Play and/or APK for direct install/distribution.
 * Requires src-tauri/gen/android (run `npx tauri android init` once) and key.properties for signing.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const keyProps = path.join(root, 'src-tauri/gen/android/key.properties');
const bundleDir = path.join(root, 'src-tauri/gen/android/app/build/outputs/bundle');
const apkDir = path.join(root, 'src-tauri/gen/android/app/build/outputs/apk');

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

const rawArgs = process.argv.slice(2);
const onlyApk = rawArgs.includes('--apk') && !rawArgs.includes('--aab');
const onlyAab = rawArgs.includes('--aab') && !rawArgs.includes('--apk');
const buildApk = !onlyAab;
const buildAab = !onlyApk;

const forwardArgs = rawArgs.filter((arg) => arg !== '--apk' && arg !== '--aab');

console.log('[android-release] Building web assets…');
run('npm', ['run', 'build']);

console.log('[android-release] Generating Android launcher and splash assets…');
run('npm', ['run', 'tauri:icons']);

const buildFlags = [];
if (buildApk) buildFlags.push('--apk');
if (buildAab) buildFlags.push('--aab');

const targetsLabel =
  buildApk && buildAab ? 'signed AAB & APK' : buildApk ? 'signed APK' : 'signed AAB';

console.log(`[android-release] Building ${targetsLabel}…`);
run('npx', ['tauri', 'android', 'build', ...buildFlags, ...forwardArgs]);

function findFiles(dir, predicate, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) findFiles(full, predicate, acc);
    else if (predicate(name, full)) acc.push(full);
  }
  return acc;
}

if (buildAab) {
  const aabs = findFiles(bundleDir, (name) => name.endsWith('.aab')).sort();
  if (aabs.length === 0) {
    console.warn('[android-release] Build finished but no .aab found under outputs/bundle/');
  } else {
    console.log('[android-release] Upload to Google Play (AAB):');
    for (const aab of aabs) console.log(`  ${aab}`);
  }
}

if (buildApk) {
  const apks = findFiles(
    apkDir,
    (name, full) =>
      name.endsWith('.apk') && (full.includes('/release/') || name.includes('-release')),
  ).sort();
  if (apks.length === 0) {
    console.warn('[android-release] Build finished but no release .apk found under outputs/apk/');
  } else {
    console.log('[android-release] Release APK:');
    for (const apk of apks) console.log(`  ${apk}`);
  }
}
