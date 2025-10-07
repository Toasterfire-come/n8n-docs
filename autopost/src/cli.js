#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import dataUriToBuffer from 'data-uri-to-buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolveImagePath(input) {
  if (!input) return null;
  if (input.startsWith('data:')) {
    const buf = dataUriToBuffer(input);
    const outDir = path.join(__dirname, '..', 'tmp');
    ensureDir(outDir);
    const ext = buf.type.split('/')[1] || 'png';
    const outPath = path.join(outDir, `image-${Date.now()}.${ext}`);
    fs.writeFileSync(outPath, buf);
    return outPath;
  }
  // else assume it is a file path
  const p = path.isAbsolute(input) ? input : path.join(process.cwd(), input);
  if (!fs.existsSync(p)) throw new Error(`Image file not found: ${p}`);
  return p;
}

const argv = yargs(hideBin(process.argv))
  .option('network', { type: 'boolean', default: false, describe: 'Launch browser with sandbox disabled for CI' })
  .option('x', { type: 'boolean', default: false, describe: 'Post to X' })
  .option('linkedin', { type: 'boolean', default: false, describe: 'Post to LinkedIn' })
  .option('text', { type: 'string', demandOption: true, describe: 'Post text' })
  .option('image', { type: 'string', describe: 'Data URL or image file path' })
  .help()
  .parse();

const imagePath = resolveImagePath(argv.image || '');
const payload = { text: argv.text, imagePath };

async function main() {
  const tasks = [];
  if (argv.x) tasks.push((await import('./post-x.js')).default(payload, { network: argv.network }));
  if (argv.linkedin) tasks.push((await import('./post-linkedin.js')).default(payload, { network: argv.network }));
  if (tasks.length === 0) throw new Error('Select at least one target with --x and/or --linkedin');
  await Promise.all(tasks);
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});
