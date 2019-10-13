import debugInit from 'debug';
import axios from 'axios';

let agents = [];
const taskQueue = [];
let counter = 0;

const errorDebug = debugInit('err: ');
const debug = debugInit('api: ');

enum Status {
  FREE,
}

const initCheckInterval = () => {
  setInterval(() => {
    if (!agents.length) return;
    agents = agents.filter(async agent => {
      try {
        const { data } = await axios.get(`http://localhost:${agent.port}/ping`);
        const {msg} = data;
        if (msg === 'pong') return true;
      } catch (err) {
        return false;
      }
      return false;
    });
  }, 10000);
};

const getFreeAgent = () => {
  const [free] = agents.filter(agent => {
    return agent.statue === Status.FREE;
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

export default app => {
  app.get('/notify_agent', (req, res) => {
    const newId = createAgent(req);
    res.json({ id: newId });
    debug('agent registered')
  });

  app.get('/ping', (req, res) => {
    res.json({ msg: 'pong' });
  });

  app.get('/notify_build_result', (req, res) => {
    // Сожранение результатов

    if (!taskQueue.length) return;

    const agent = getFreeAgent();

    if (!agent) return;

    // Отправить задачу агенту
  });

  app.get('/build', (req, res) => {
    if (!agents.length) {
      res.status(500).end();
      errorDebug('No agents');
    }

    const agent = getFreeAgent();

    if (!agent) {
      taskQueue.push([]);
    }

    console.log('-------------------------');
    console.log('agent', agent);
    console.log('-------------------------');
    // Сдеать ping
    //  отправить задачу
    // Если все заняты поместит в очередь
  });
};

initCheckInterval();
