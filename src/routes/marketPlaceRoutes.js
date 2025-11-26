import express from 'express';
import { MarketPlaceController } from '../controllers/marketPlaceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: MarketPlace
 *   description: MarketPlace management endpoints
 */

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/marketplace:
 *   get:
 *     summary: Get all marketplace items
 *     tags: [MarketPlace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of marketplace items
 */
router.get('/', MarketPlaceController.getAll);

/**
 * @swagger
 * /api/marketplace/{id}:
 *   get:
 *     summary: Get marketplace item by ID
 *     tags: [MarketPlace]
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
 *         description: Marketplace item details
 *       404:
 *         description: Item not found
 */
router.get('/:id', MarketPlaceController.getById);

/**
 * @swagger
 * /api/marketplace:
 *   post:
 *     summary: Create new marketplace item with image validation
 *     description: Upload product with automatic image cleanliness validation. Image must be clean to be accepted.
 *     tags: [MarketPlace]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - gambar
 *               - namaProduk
 *               - harga
 *               - deskripsi
 *             properties:
 *               gambar:
 *                 type: string
 *                 format: binary
 *                 description: Product image (will be validated for cleanliness via AI)
 *               namaProduk:
 *                 type: string
 *                 example: Sepatu Nike
 *               harga:
 *                 type: number
 *                 example: 500000
 *               deskripsi:
 *                 type: string
 *                 example: Sepatu olahraga kondisi baik
 *     responses:
 *       201:
 *         description: Item created successfully (image is clean)
 *       400:
 *         description: Image rejected (dirty) or invalid input
 *       500:
 *         description: Failed to validate or upload image
 */
router.post('/', upload.single('gambar'), MarketPlaceController.create);

/**
 * @swagger
 * /api/marketplace/{id}:
 *   put:
 *     summary: Update marketplace item
 *     tags: [MarketPlace]
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
 *               namaProduk:
 *                 type: string
 *               harga:
 *                 type: number
 *               deskripsi:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Item not found
 */
router.put('/:id', MarketPlaceController.update);

/**
 * @swagger
 * /api/marketplace/{id}:
 *   delete:
 *     summary: Delete marketplace item
 *     tags: [MarketPlace]
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
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 */
router.delete('/:id', MarketPlaceController.delete);

export default router;
