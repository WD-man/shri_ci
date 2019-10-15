import express from 'express';
import { promisify } from 'util';
import axios from 'axios';
import bodyParser from 'body-parser';
import { remove, outputJson, readdir } from 'fs-extra';
import debugInit from 'debug';
import { join } from 'path';
import command from 'commander';
import { execFile } from 'child_process';
import config from '../ci.config.json';

command.option('-p, --port [port]', 'port');
command.parse(process.argv);

const exec = promisify(execFile);

const outputPath = join(process.cwd(), config.buildArtifactsRepo);

const debug = debugInit('agent: ');
const errDebug = debugInit('err: ');
const port = command.port || 9999;
let agentId;

const mainUrl = 'http://localhost:9001';

const app = express();

const execBuild = async ({ hash, commit, command }) => {
  let result;
  const workDir = join(process.cwd(), '..');
  try {
    await exec('git', ['clone', config.repo, `temp_${hash}`], {
      cwd: workDir,
    });
    await exec('git', ['fetch'], {
      cwd: join(workDir, `temp_${hash}`),
    });
    await exec('git', ['checkout', `origin/${commit}`], {
      cwd: join(workDir, `temp_${hash}`),
    });
    const [com, ...params] = command.split(' ');
    result = await exec(com, [...params], {
      cwd: join(workDir, `temp_${hash}`),
    });
  } catch (err) {
    result = {};
    result.stdout = err.stdout;
    result.stderr = err.stderr;
  }
  await remove(join(process.cwd(), '..', `temp_${hash}`));
  return result;
};

const startBuild = async params => {
  const dateStart = new Date()
    .toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, '');
  const initBuildData = {
    timestampStart: Date.now(),
    hash: params.hash,
    agentId: agentId,
    status: 'process',
    dateStart,
    dateEnd: null,
    ...params,
  };

  outputJson(`${outputPath}/${params.hash}.json`, initBuildData);

  const result = await execBuild(params);
  const dateEnd = new Date()
    .toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, '');

  // console.log('-------------------------');
  // console.log('res', result);
  // console.log('-------------------------');
  outputJson(`${outputPath}/${params.hash}.json`, {
    ...initBuildData,
    timestampEnd: Date.now(),
    hash: params.hash,
    agentId,
    dateEnd,
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.stderr ? 'error' : 'success',
  });
  debug(`end with status ${'success'}`);
  axios.get(`${mainUrl}/notify_build_result`);
};

const initCheckInterval = () => {
  setInterval(async () => {
    try {
      const { data } = await axios.get(`${mainUrl}/ping`);
      const { msg } = data;
      if (msg === 'pong') return true;
    } catch (err) {
      process.exit(0);
    }
    return false;
  }, 10000);
};

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use(bodyParser.json());

app.post('/build', async (req, res) => {
  const { body } = req;
  debug(`build with params ${body.toString()}`);
  startBuild(body);
  res.end();
});

app.get('/ping', (req, res) => {
  res.json({ msg: 'pong' });
});

app.listen(port, async () => {
  debug(`server running at port ${port}`);
  try {
    const { data } = await axios.get(`${mainUrl}/notify_agent?port=${port}`);
    const { id } = data;
    if (id !== 0 && !id) process.exit(2);
    agentId = id;
    debug(`registered id: ${id}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      errDebug('not master process');
      debug('stopped');
      process.exit(2);
    }
  }
});

initCheckInterval();
