const { execSync } = require('child_process');

process.env.GITHUB_PAGES = 'true';
console.log('Building Next.js static export for GitHub Pages (/gravefin)...');

try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      GITHUB_PAGES: 'true'
    }
  });
  console.log('GitHub Pages static export build completed successfully in ./out');
} catch (e) {
  console.error('GitHub Pages build failed:', e.message);
  process.exit(1);
}
