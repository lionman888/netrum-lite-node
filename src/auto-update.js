// auto-update.js
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.resolve(__dirname, '..'); // Parent dir if inside 'src'

function runGitPull() {
  exec('git pull', { cwd: projectDir }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Git Pull Error:', error.message);
      return;
    }
    if (stderr) {
      console.error('⚠️ Git stderr:', stderr);
    }
    console.log('✅ Git Pull Success:\n', stdout);
  });
}

runGitPull();
