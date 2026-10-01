// Gop dist/index.html + CSS + JS thanh 1 file HTML duy nhat (de mo truc tiep / copy vao dien thoai,
// khong can may chu). Chay sau `vite build`: xem script "single" trong package.json.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, 'dist');
const outFile = join(root, 'hoc-tieng-trung.html');

let html = readFileSync(join(distDir, 'index.html'), 'utf8');

html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_m, href) => {
  const css = readFileSync(join(distDir, href), 'utf8');
  return `<style>\n${css}\n</style>`;
});

html = html.replace(/<script[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_m, src) => {
  const js = readFileSync(join(distDir, src), 'utf8');
  return `<script>\n${js}\n</script>`;
});

writeFileSync(outFile, html, 'utf8');
const sizeKb = Math.round(statSync(outFile).size / 1024);
console.log(`Da gop thanh file don (${sizeKb} KB): ${outFile}`);
