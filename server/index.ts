import express from 'express';
import next from 'next';
import debugInit from 'debug';
import bodyParser from 'body-parser';
import api from './api';
import config from '../ci.config.json';

const debug = debugInit('server: ');

const DEFAULT_PORT = 9000;

const port = parseInt(process.env.PORT, 10) || config.port || DEFAULT_PORT;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  api(server);

  server.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );

  server.use(bodyParser.json());

  server.get('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err: any) => {
    if (err) throw err;
    debug(`running at port ${port}`);
  });
});
