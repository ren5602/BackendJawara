import express from 'express';
import { KeluargaController } from '../controllers/keluargaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Keluarga
 *   description: Keluarga management endpoints
 */

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/keluarga:
 *   get:
 *     summary: Get all keluarga
 *     tags: [Keluarga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of keluarga
 *       401:
 *         description: Unauthorized
 */
router.get('/', KeluargaController.getAll);

/**
 * @swagger
 * /api/keluarga/{id}:
 *   get:
 *     summary: Get keluarga by ID
 *     tags: [Keluarga]
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
 *         description: Keluarga details
 *       404:
 *         description: Keluarga not found
 */
router.get('/:id', KeluargaController.getById);

/**
 * @swagger
 * /api/keluarga:
 *   post:
 *     summary: Create new keluarga (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Keluarga]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - namaKeluarga
 *               - jumlahAnggota
 *             properties:
 *               namaKeluarga:
 *                 type: string
 *               jumlahAnggota:
 *                 type: integer
 *               rumahId:
 *                 type: integer
 *               kepala_Keluarga_Id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Keluarga created
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  KeluargaController.create
);

/**
 * @swagger
 * /api/keluarga/{id}:
 *   put:
 *     summary: Update keluarga (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Keluarga]
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
 *               namaKeluarga:
 *                 type: string
 *               jumlahAnggota:
 *                 type: integer
 *               rumahId:
 *                 type: integer
 *               kepala_Keluarga_Id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Keluarga updated
 *       404:
 *         description: Keluarga not found
 */
router.put(
  '/:id',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  KeluargaController.update
);

/**
 * @swagger
 * /api/keluarga/{id}:
 *   delete:
 *     summary: Delete keluarga (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Keluarga]
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
 *         description: Keluarga deleted
 *       404:
 *         description: Keluarga not found
 */
router.delete(
  '/:id',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  KeluargaController.delete
);

export default router;
