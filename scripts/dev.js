import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const services = [
  { name: 'api', args: ['--prefix', 'server', 'run', 'dev'] },
  { name: 'web', args: ['--prefix', 'web', 'run', 'dev'] },
];

const children = services.map(({ name, args }) => {
  const child = spawn(npm, args, { stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    if (code && !shuttingDown) {
      console.error(`${name} process exited with code ${code}${signal ? ` (${signal})` : ''}`);
      stopAll();
      process.exitCode = code;
    }
  });
  return child;
});

let shuttingDown = false;

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
