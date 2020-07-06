import express from 'express';
import routes from './routes';

const port = Number(process.env.APP_PORT) || 3000;
const host = process.env.APP_HOST || '127.0.0.1';

const app = express();

app.use(routes);

app.listen(port, host, (err) => {
  if (err) {
    return console.error(err);
  }
  return console.log(`Server is listening on ${host}:${port}`);
});
