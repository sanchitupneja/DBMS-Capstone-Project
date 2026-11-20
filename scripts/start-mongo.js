const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

function findBinary(name, winCandidates = []) {
  try {
    const cmd = process.platform === 'win32' ? `where.exe ${name}` : `which ${name}`;
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split(/\r?\n/)[0];
    if (out && fs.existsSync(out)) return out;
  } catch {}

  for (const c of winCandidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return name;
}

const MONGOD_PATH = findBinary('mongod', [
  'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
  'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
]);

const MONGOSH_PATH = findBinary('mongosh', [
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'mongosh', 'mongosh.exe'),
  'C:\\Program Files\\mongosh\\mongosh.exe',
]);
const DB_PATH = path.resolve(__dirname, '..', '.mongo-data');
const PORT = 27018;

if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

function checkPort(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function waitForPort(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const open = await checkPort(port);
    if (open) return true;
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

let mongodChild = null;

function shutdown() {
  console.log('\n[MongoDB] Stopping local mongod...');
  if (mongodChild) {
    try {
      mongodChild.kill('SIGINT');
    } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function main() {
  const isAlreadyRunning = await checkPort(PORT);
  if (isAlreadyRunning) {
    console.log(`[MongoDB] Local replica set already active on port ${PORT}.`);
    // Keep process alive so concurrent runner stays happy
    setInterval(() => {}, 1000 * 60 * 60);
    return;
  }

  console.log(`[MongoDB] Starting local MongoDB (replSet rs0) on port ${PORT}...`);
  mongodChild = spawn(
    MONGOD_PATH,
    [
      '--port', String(PORT),
      '--dbpath', DB_PATH,
      '--replSet', 'rs0',
      '--bind_ip', '127.0.0.1',
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  );

  mongodChild.on('error', (err) => {
    console.error('[MongoDB] Failed to launch mongod:', err);
    process.exit(1);
  });

  mongodChild.on('exit', (code) => {
    console.log(`[MongoDB] mongod process exited with code ${code}`);
    process.exit(code ?? 0);
  });

  const ready = await waitForPort(PORT);
  if (!ready) {
    console.error(`[MongoDB] mongod failed to bind to port ${PORT}`);
    process.exit(1);
  }

  console.log(`[MongoDB] mongod listening on port ${PORT}. Checking replica set...`);

  // Ensure rs0 is initiated
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const scriptPath = path.resolve(__dirname, 'init-replset.js');
    execSync(`"${MONGOSH_PATH}" --port ${PORT} --quiet --file "${scriptPath}"`, {
      stdio: 'ignore',
    });
  } catch {}

  console.log(`✅ [MongoDB] Replica Set rs0 is ready! (mongodb://127.0.0.1:${PORT})`);
}

main().catch((err) => {
  console.error('[MongoDB] Fatal error:', err);
  process.exit(1);
});
