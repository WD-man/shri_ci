import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import debugInit from 'debug';

const debug = debugInit('agent: ');
const port = process.env.PORT || 9999;

const mainUrl = 'http://localhost:9001';

const app = express();

const initCheckInterval = () => {
  setInterval(async () => {
    try {
      const { data } = await axios.get(`${mainUrl}/ping`);
      const {msg} = data;
      console.log('-------------------------');
      console.log('msg', msg);
      console.log('-------------------------');
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

app.get('/', (req, res) => {
  console.log('-------------------------');
  console.log('get');
  console.log('-------------------------');
});

app.get('/build', (req, res) => {});

app.get('/ping', (req, res) => {
  res.json({ msg: 'pong' });
});

app.listen(port, async () => {
  console.log(`server running at port ${port}`);
  try {
    const { data } = await axios.get(`${mainUrl}/notify_agent?port=${port}`);
    const { id } = data;
    if (id !== 0 && !id) process.exit(2);
    debug(`registered id: ${id}`);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      process.exit(2);
    }
  }
});

initCheckInterval();
