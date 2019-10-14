import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import { readJson, outputJson, readdir } from 'fs-extra';
import debugInit from 'debug';
import { join } from 'path';
import config from '../ci.config.json';

const outputPath = join(process.cwd(), config.buildArtifactsRepo);

const debug = debugInit('agent: ');
const port = process.env.PORT || 9999;
let agentId;

const mainUrl = 'http://localhost:9001';

const app = express();

const startBuild = async params => {
  const dateStart = new Date()
    .toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, '');
  const initBuildData = {
    hash: params.hash,
    agentId: agentId,
    status: 'process',
    dateStart,
    dateEnd: null,
    ...params,
  };

  outputJson(`${outputPath}/${params.hash}.json`, initBuildData);

  await new Promise(res => setTimeout(() => res(), 1000));
  const dateEnd = new Date()
    .toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, '');

  outputJson(`${outputPath}/${params.hash}.json`, {
    ...initBuildData,
    hash: params.hash,
    agentId,
    dateEnd,
    stdout: '',
    stderr: '',
    status: 'success',
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
  console.log(`server running at port ${port}`);
  try {
    const { data } = await axios.get(`${mainUrl}/notify_agent?port=${port}`);
    const { id } = data;
    if (id !== 0 && !id) process.exit(2);
    agentId = id;
    debug(`registered id: ${id}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      process.exit(2);
    }
  }
});

initCheckInterval();
