const cp = require('child_process');

try {
  const out = cp.execSync('netstat -ano | findstr :3000 | findstr LISTENING', { encoding: 'utf8' });
  const lines = out.trim().split('\n');
  const pids = new Set();
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid)) {
      pids.add(pid);
    }
  }
  for (const pid of pids) {
    try {
      console.log('Killing PID on port 3000:', pid);
      cp.execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
    } catch (e) {}
  }
} catch (e) {
  console.log('No process on port 3000');
}
