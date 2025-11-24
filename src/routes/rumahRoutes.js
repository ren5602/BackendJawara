import express from 'express';
import { RumahController } from '../controllers/rumahController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rumah
 *   description: Rumah management endpoints
 */

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/rumah:
 *   get:
 *     summary: Get all rumah
 *     tags: [Rumah]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rumah
 */
router.get('/', RumahController.getAll);

/**
 * @swagger
 * /api/rumah/{id}:
 *   get:
 *     summary: Get rumah by ID
 *     tags: [Rumah]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rumah details
 *       404:
 *         description: Rumah not found
 */
router.get('/:id', RumahController.getById);

/**
 * @swagger
 * /api/rumah:
 *   post:
 *     summary: Create new rumah (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Rumah]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statusKepemilikan
 *               - alamat
 *               - jumlahPenghuni
 *             properties:
 *               statusKepemilikan:
 *                 type: string
 *                 enum: [tetap, kontrak, pindah]
 *               alamat:
 *                 type: string
 *               jumlahPenghuni:
 *                 type: integer
 *               keluargaId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Rumah created
 */
router.post(
  '/',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  RumahController.create
);

/**
 * @swagger
 * /api/rumah/{id}:
 *   put:
 *     summary: Update rumah (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Rumah]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               statusKepemilikan:
 *                 type: string
 *               alamat:
 *                 type: string
 *               jumlahPenghuni:
 *                 type: integer
 *               keluargaId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Rumah updated
 *       404:
 *         description: Rumah not found
 */
router.put(
  '/:id',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  RumahController.update
);

/**
 * @swagger
 * /api/rumah/{id}:
 *   delete:
 *     summary: Delete rumah (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Rumah]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rumah deleted
 *       404:
 *         description: Rumah not found
 */
router.delete(
  '/:id',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  RumahController.delete
);

export default router;
