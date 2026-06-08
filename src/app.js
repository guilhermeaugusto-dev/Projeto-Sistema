import express from 'express';
import assetRoutes from './routes/asset.routes.js';
import authRoutes from './routes/auth.routes.js';
import stockRoutes from './routes/stock.routes.js';
import propertyRoutes from './routes/property.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import exportRoutes from './routes/export.routes.js';

const app = express();

app.use(express.json());
app.use('/api/asset', assetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/export', exportRoutes);
export default app;

