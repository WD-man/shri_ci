import command from 'commander';
import { spawn } from 'child_process';
import config from '../ci.config.json';

const isDev = process.env.NODE_ENV !== 'production';

command.option('-q, --quantity [count]', 'quantity run agents');
command.parse(process.argv);

const count = Number(command.quantity) || config.agentsQuantity || 1;
const startPort = config.agentStartPort;

let i = 0;

const processes = [];

while (i < count) {
  const cwd = process.cwd();
  const currentProcess = spawn(
    'node',
    [isDev ? './agent.ts' : '.next/server/agents/agent.js', '-p', `${startPort + i}`],
    {
      cwd,
      env: process.env,
      stdio: 'inherit',
    },
  );
  currentProcess.on('error', err => {
    console.log(`process ${i} error`, err);
  });
  processes.push(currentProcess);
  i++;
}

process.on('exit', () => {
  processes.forEach(currentProcess => {
    currentProcess.kill();
  });
});
