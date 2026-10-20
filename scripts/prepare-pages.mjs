import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
let html = readFileSync('dist/index.html', 'utf8').replace(/<title>.*?<\/title>/, '<title>AutoLog — Combustível e gastos</title>').replace(/lang="[^"]*"/, 'lang="pt-BR"');
writeFileSync('dist/index.html', html);
// Direct links and OAuth callbacks must also serve the client application.
for (const route of ['account', 'calculate', 'history', 'vehicles', 'stations', 'auth/callback']) {
  mkdirSync(`dist/${route}`, { recursive: true });
  copyFileSync('dist/index.html', `dist/${route}/index.html`);
}
copyFileSync('dist/index.html', 'dist/404.html');
writeFileSync('dist/.nojekyll', '');
