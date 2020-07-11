import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown';
import app from './app';

const port = Number(process.env.APP_PORT) || 3000;
const host = process.env.APP_HOST || '127.0.0.1';

app.set('port', port);
app.set('host', host);

const server = app.listen(port, host, (err) => {
  if (err) {
    return console.error(err);
  }
  return console.info(`Server is listening on ${host}:${port}`);
});

const shutdownManager = new GracefulShutdownManager(server);

const addTerminationHandler = (signal) => {
  process.on(signal, () => {
    console.info(`${signal} received`);

    shutdownManager.terminate(() => {
      console.info('Server is gracefully terminated');
      process.exit(0);
    });
  });
};

addTerminationHandler('SIGTERM');
addTerminationHandler('SIGINT');
