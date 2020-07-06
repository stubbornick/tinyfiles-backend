import express from 'express';
import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown';
import routes from './routes';

const port = Number(process.env.APP_PORT) || 3000;
const host = process.env.APP_HOST || '127.0.0.1';

const app = express();

app.use(routes);

const server = app.listen(port, host, (err) => {
  if (err) {
    return console.error(err);
  }
  return console.log(`Server is listening on ${host}:${port}`);
});

const shutdownManager = new GracefulShutdownManager(server);

const addTerminationHandler = (signal) => {
  process.on(signal, () => {
    console.log(`${signal} received`);

    shutdownManager.terminate(() => {
      console.log('Server is gracefully terminated');
      process.exit(0);
    });
  });
};

addTerminationHandler('SIGTERM');
addTerminationHandler('SIGINT');
