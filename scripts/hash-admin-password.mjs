import { randomBytes, scryptSync } from 'node:crypto';
// Read stdin so the plaintext password never appears in command arguments.
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const password = Buffer.concat(chunks).toString().replace(/\r?\n$/, '');
if (password.length < 16 || password.length > 1024) {
  throw new Error('Use a unique password between 16 and 1024 characters.');
}
const salt = randomBytes(16);
process.stdout.write(`${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}\n`);
