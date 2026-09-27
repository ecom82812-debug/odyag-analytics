// Збирає один файл dashboard/index.html із частин.  node dashboard-src/build.js [--artifact out.html]
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const artifactOut = process.argv.includes('--artifact') ? process.argv[process.argv.indexOf('--artifact') + 1] : null;

const head = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Аналітика одягу</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Manrope:wght@600;700&display=swap">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"></script>
<style>
${read('style.css')}
</style>`;
const body = `<div id="app"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<div class="tip" id="tip"></div>
<script>
${read('demo.js')}
</script>
<script>
${read('app.js')}
</script>`;

const full = `<!doctype html>
<html lang="uk">
<head>
${head}
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(dir, '..', 'dashboard', 'index.html'), full);
console.log('index.html', full.length);
if (artifactOut) {
  // для опублікованої демо-версії: без скелета html/head/body, без supabase
  const art = head.replace(/<meta charset[^>]*>\n<meta name="viewport"[^>]*>\n/, '').replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>\n/, '') + '\n' + body;
  fs.writeFileSync(artifactOut, art);
  console.log('artifact', art.length);
}
