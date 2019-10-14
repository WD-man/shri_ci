import debugInit from 'debug';
import axios from 'axios';
import bodyParser from 'body-parser';
import { createHash } from 'crypto';
import { readJson, outputJson, readdir } from 'fs-extra';
import { join } from 'path';
import config from '../ci.config.json';

const outputPath = join(process.cwd(), config.buildArtifactsRepo);
const taskQueue = [];
let agents = [];
let counter = 0;

const errorDebug = debugInit('err: ');
const debug = debugInit('api: ');

enum Status {
  FREE,
}

const getHash = () => {
  const current_date = new Date().valueOf().toString();
  const random = Math.random().toString();
  return createHash('sha1')
    .update(current_date + random)
    .digest('hex');
};

const checkAgent = async agent => {
  if (!agent) return false;
  try {
    const { data } = await axios.get(`http://localhost:${agent.port}/ping`);
    const { msg } = data;
    return msg === 'pong';
  } catch (err) {
    return false;
  }
  return false;
};

const initCheckInterval = () => {
  setInterval(() => {
    if (!agents.length) return;
    agents = agents.filter(checkAgent);
  }, 10000);
};

const getFreeAgent = () => {
  const [free] = agents.filter(agent => {
    return agent.status === Status.FREE;
  });
  return free;
};

const createAgent = ({ query }) => {
  const { port } = query;
  if (!port) return;
  const newId = counter;
  counter += 1;

  const agent = {
    id: newId,
    status: Status.FREE,
    port,
  };
  agents.push(agent);
  return newId;
};

export default (app, nextHandler) => {
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  app.use(bodyParser.json());

  app.get('/notify_agent', (req, res) => {
    const newId = createAgent(req);
    res.json({ id: newId });
    debug('agent registered');
  });

  app.get('/ping', (req, res) => {
    res.json({ msg: 'pong' });
  });

  app.get('/data', async (req, res) => {
    const { certainBuild } = req.query;

    if (certainBuild) {
      const result = await readJson(`${outputPath}/${certainBuild}.json`);
      res.json(result);
    } else {
      let buildList;
      try {
        buildList = await readdir(outputPath);
      } catch (err) {
        return res.json([]);
      }
      const builds = await Promise.all(
        buildList.map(async item => {
          return await readJson(`${outputPath}/${item}`);
        }),
      );
      res.json({
        buildList: builds,
      });
    }
  });

  app.get('/notify_build_result', (req, res) => {
    if (!taskQueue.length) return;

    const agent = getFreeAgent();

    if (!agent) return;

    // Отправить задачу агенту
  });

  app.post('/build', async (req, res) => {
    const { body } = req;
    if (!agents.length) {
      res.set('location', '/');
      res.status(301).end();
      errorDebug('No agents');
      return;
    }

    const agent = getFreeAgent();
    const isActive = await checkAgent(agent);

    if (!isActive) {
      taskQueue.push({
        ...body,
      });
      res.set('location', '/');
      res.status(301);
      return nextHandler(req, res, '/');
    }

    const hash = getHash();
    await axios.post(`http://localhost:${agent.port}/build`, {
      hash,
      ...body,
    });

    res.set('location', '/');
    res.status(301);
    res.end();
  });
};

initCheckInterval();
