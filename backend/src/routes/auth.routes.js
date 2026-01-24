// routes/authRoutes.js
import express from 'express';
import { login, getKPIs, register, getAllUsers } from '../controllers/authController.js';
import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';


const router = express.Router();


router.post('/login', login);
router.post('/register', register);
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.get('/kpis', getKPIs);


export default router;