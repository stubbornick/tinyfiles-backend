import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  res.redirect('/api');
});

router.get('/api', async (req, res) => {
  res.send('It works!');
});

export default router;
