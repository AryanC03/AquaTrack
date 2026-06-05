const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcManifest = path.join(root, '.next', 'server', 'app', 'page_client-reference-manifest.js');
const targetDir = path.join(root, '.next', 'server', 'app', '(app)');
const targetManifest = path.join(targetDir, 'page_client-reference-manifest.js');

try {
  if (!fs.existsSync(srcManifest)) {
    console.log('postbuild-fix: source manifest not found, nothing to do.');
    process.exit(0);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  if (!fs.existsSync(targetManifest)) {
    fs.copyFileSync(srcManifest, targetManifest);
    console.log('postbuild-fix: copied manifest to (app) folder.');
  } else {
    console.log('postbuild-fix: target manifest already exists.');
  }
} catch (err) {
  console.error('postbuild-fix: failed', err);
  process.exit(1);
}
