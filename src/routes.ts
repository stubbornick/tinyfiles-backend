import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  res.send('It works!');
});

export default router;
