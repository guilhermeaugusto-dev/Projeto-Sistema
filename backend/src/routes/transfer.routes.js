// src/routes/stock.routes.js
import express from 'express';
import { transferPatrimonio,getMovimentacoesPorPatrimonio } from '../controllers/transferController.js';

const router = express.Router();

router.put('/:patrimonioId', transferPatrimonio);
router.get('/:patrimonioId', getMovimentacoesPorPatrimonio );




export default router;
