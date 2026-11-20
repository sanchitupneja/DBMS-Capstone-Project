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
      socket.destroy();
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

async function setup() {
  console.log('--- Step 1: Checking MongoDB Process on port ' + PORT + ' ---');
  let isRunning = await checkPort(PORT);
  if (!isRunning) {
    console.log('Spawning background mongod replica set on port ' + PORT + '...');
    const child = spawn(
      MONGOD_PATH,
      [
        '--port', String(PORT),
        '--dbpath', DB_PATH,
        '--replSet', 'rs0',
        '--bind_ip', '127.0.0.1',
      ],
      { detached: true, stdio: 'ignore' }
    );
    child.unref();

    console.log('Waiting for mongod to accept connections...');
    const ready = await waitForPort(PORT);
    if (!ready) {
      console.error('ERROR: mongod did not start on port ' + PORT);
      process.exit(1);
    }
    console.log('mongod process is running and accepting connections.');
  } else {
    console.log('mongod is already listening on port ' + PORT);
  }

  console.log('\n--- Step 2: Initializing Replica Set rs0 ---');
  await new Promise((r) => setTimeout(r, 1500));
  try {
    const scriptPath = path.resolve(__dirname, 'init-replset.js');
    const res = execSync(`"${MONGOSH_PATH}" --port ${PORT} --quiet --file "${scriptPath}"`, {
      encoding: 'utf8',
    });
    console.log('Replica set status:', res.trim());
  } catch (err) {
    console.log('Note on initiate:', err.message);
  }

  // Wait for PRIMARY election
  console.log('Waiting for replica set primary to be elected...');
  for (let i = 0; i < 20; i++) {
    try {
      const isMaster = execSync(`"${MONGOSH_PATH}" --port ${PORT} --quiet --eval "db.hello().isWritablePrimary"`, {
        encoding: 'utf8',
      }).trim();
      if (isMaster === 'true') {
        console.log('✅ Replica set is PRIMARY and ready for read/write.');
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }

  const localUri = `mongodb://127.0.0.1:${PORT}/hostel_allocation_db?replicaSet=rs0&directConnection=true`;

  console.log('\n--- Step 3: Updating .env with local MongoDB replica set URI ---');
  const envPath = path.resolve(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL="${localUri}"`
  );
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('Updated .env: DATABASE_URL=' + localUri);

  console.log('\n--- Step 4: Running Prisma db push ---');
  execSync('npx prisma db push', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: localUri },
  });

  console.log('\n--- Step 5: Seeding Database ---');
  execSync('npm run db:seed', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: localUri },
  });

  console.log('\n======================================================');
  console.log('🎉 LOCAL MONGODB DATABASE SETUP COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

setup().catch((e) => {
  console.error('Setup failed:', e);
  process.exit(1);
});
