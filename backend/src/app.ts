import express from 'express';
import routes from './routes';

const app = express();
const port = 3000;

app.use(routes);

app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  return console.log(`Server is listening on ${port}`);
});
