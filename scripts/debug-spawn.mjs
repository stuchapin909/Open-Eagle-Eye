import { spawn } from 'child_process';
const proc = spawn('node', ['index.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
let stderr = '';
proc.stderr.on('data', d => { stderr += d.toString(); console.error('STDERR:', d.toString()); });
proc.stdout.on('data', d => { console.log('STDOUT:', d.toString()); });
proc.on('exit', (code) => { console.log('EXIT:', code); console.log('STDERR TOTAL:', stderr); });
proc.on('error', (e) => { console.log('SPAWN ERROR:', e.message); });
setTimeout(() => { proc.kill(); process.exit(0); }, 15000);
