import fs from 'fs';
import path from 'path';

const jp = /[ぁ-ゟァ-ヿ一-鿿]/;
const skip = /key=|\$bi\(|_b\(|BilingualText|console\.|^\s*\/\/|^\s*<!--/;
const dir = 'front/svelte';
let totalLines = 0;
let totalFiles = 0;

function walk(d) {
  for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.svelte')) continue;
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    let count = 0;
    let samples = [];
    for (let i = 0; i < lines.length; i++) {
      if (jp.test(lines[i]) && !skip.test(lines[i])) {
        count++;
        if (samples.length < 5) samples.push('  L' + (i+1) + ': ' + lines[i].trim().substring(0, 80));
      }
    }
    if (count > 0) {
      totalFiles++;
      totalLines += count;
      console.log(count + ' ' + p);
      samples.forEach(s => console.log(s));
    }
  }
}
walk(dir);
console.log('TOTAL: ' + totalLines + ' lines in ' + totalFiles + ' files');
