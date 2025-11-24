import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import wargaRoutes from './routes/wargaRoutes.js';
import verificationWargaRoutes from './routes/verificationWargaRoutes.js';
import keluargaRoutes from './routes/keluargaRoutes.js';
import rumahRoutes from './routes/rumahRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Backend Jawara API',
    status: 'success'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Warga routes
app.use('/api/warga', wargaRoutes);

// Verification Warga routes
app.use('/api/verification-warga', verificationWargaRoutes);

// Keluarga routes
app.use('/api/keluarga', keluargaRoutes);

// Rumah routes
app.use('/api/rumah', rumahRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
