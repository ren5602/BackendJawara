import express from 'express';
import { VerificationWargaController } from '../controllers/verificationWargaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { uploadKTP } from '../config/multerKTP.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Verification Warga
 *   description: Warga verification management for NIK and nama changes
 */

/**
 * @swagger
 * /api/verification-warga/submit:
 *   post:
 *     summary: Submit verification request for NIK/nama change
 *     tags: [Verification Warga]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - foto_ktp
 *             properties:
 *               nik_baru:
 *                 type: string
 *                 description: New NIK (16 digits)
 *                 example: "3201234567890123"
 *               namaWarga_baru:
 *                 type: string
 *                 description: New nama warga
 *                 example: "Budi Santoso"
 *               foto_ktp:
 *                 type: string
 *                 format: binary
 *                 description: KTP photo for verification
 *     responses:
 *       201:
 *         description: Verification request submitted successfully
 *       400:
 *         description: Invalid request or missing foto_ktp
 *       409:
 *         description: Pending request already exists or NIK already exists
 */
router.post('/submit', authMiddleware, uploadKTP.single('foto_ktp'), VerificationWargaController.submitRequest);

/**
 * @swagger
 * /api/verification-warga/my-requests:
 *   get:
 *     summary: Get user's own verification requests
 *     tags: [Verification Warga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's verification requests retrieved successfully
 */
router.get('/my-requests', authMiddleware, VerificationWargaController.getMyRequests);

/**
 * @swagger
 * /api/verification-warga/all:
 *   get:
 *     summary: Get all verification requests (admin only)
 *     tags: [Verification Warga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All verification requests retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/all', authMiddleware, roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']), VerificationWargaController.getAll);

/**
 * @swagger
 * /api/verification-warga/pending:
 *   get:
 *     summary: Get pending verification requests (admin only)
 *     tags: [Verification Warga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending verification requests retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/pending', authMiddleware, roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']), VerificationWargaController.getPending);

/**
 * @swagger
 * /api/verification-warga/approve/{id}:
 *   put:
 *     summary: Approve verification request (admin only)
 *     tags: [Verification Warga]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Verification request ID
 *     responses:
 *       200:
 *         description: Verification approved and warga data updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Verification request not found
 */
router.put('/approve/:id', authMiddleware, roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']), VerificationWargaController.approve);

/**
 * @swagger
 * /api/verification-warga/reject/{id}:
 *   put:
 *     summary: Reject verification request (admin only)
 *     tags: [Verification Warga]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Verification request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: "KTP tidak jelas"
 *     responses:
 *       200:
 *         description: Verification rejected
 *       403:
 *         description: Access denied
 *       404:
 *         description: Verification request not found
 */
router.put('/reject/:id', authMiddleware, roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']), VerificationWargaController.reject);

export default router;
