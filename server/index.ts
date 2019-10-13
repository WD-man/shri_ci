import express from 'express';
import next from 'next';
import debugInit from 'debug';
import api from './api';

const debug = debugInit('server: ');

const DEFAULT_PORT = 9000;

const port = parseInt(process.env.PORT, 10) || DEFAULT_PORT;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  api(server);

  server.get('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err: any) => {
    if (err) throw err;
    debug(`running at port ${port}`);
  });
});
