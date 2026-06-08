import express from 'express';
import {addProductQuantity, getAllProducts, createProduct, updateProduct, deleteProduct, outputProduct, getAllOutputs, getAllInputs} from '../controllers/stockController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.post('/', createProduct);
router.post('/adicionar', addProductQuantity);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/output/:id', outputProduct);
router.get('/output', getAllOutputs);
router.get('/input', getAllInputs);

export default router;
