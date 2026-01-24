import express from 'express';
import { exportDatabase,exportHistorico,exportPatrimonio } from '../controllers/exportController.js';

const router = express.Router();

router.get('/database', exportDatabase);
router.get('/historico', exportHistorico);
router.get('/patrimonio', exportPatrimonio);



export default router;