import express from 'express';
import multer from 'multer';
import { createPatrimonio, updatePatrimonio, getAllProperty, updateNotaFiscal,deletePatrimonio } from '../controllers/propertyController.js';

const router = express.Router();
const upload = multer();

router.post('/', upload.single('imagem'), createPatrimonio);
router.put('/nota-fiscal/:id', updateNotaFiscal); 
router.put('/:id', upload.single('imagem'), updatePatrimonio);
router.get('/', getAllProperty);
router.delete('/:id', deletePatrimonio);

export default router;
