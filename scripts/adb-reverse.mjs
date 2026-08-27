import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function resolveAdbPath() {
  const candidates = [
    process.env.ANDROID_HOME && join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe'),
    process.env.ANDROID_SDK_ROOT && join(process.env.ANDROID_SDK_ROOT, 'platform-tools', 'adb.exe'),
    join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    join(homedir(), 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return 'adb';
}

const adb = resolveAdbPath();
console.log(`Using adb: ${adb}`);

const result = spawnSync(adb, ['reverse', 'tcp:8000', 'tcp:8000'], {
  stdio: 'inherit',
  shell: false,
});

if (result.status !== 0) {
  console.error(`adb reverse failed (exit ${result.status ?? 'unknown'})`);
  process.exit(result.status ?? 1);
}

const list = spawnSync(adb, ['reverse', '--list'], { encoding: 'utf8' });
if (list.stdout?.trim()) {
  console.log('\nActive reverse rules:');
  console.log(list.stdout.trim());
}
