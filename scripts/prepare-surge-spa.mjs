import fs from 'node:fs/promises'

await fs.copyFile('dist/index.html', 'dist/200.html')
console.log('Created dist/200.html for Surge SPA fallback')
