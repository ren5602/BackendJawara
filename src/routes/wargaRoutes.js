import express from 'express';
import { WargaController } from '../controllers/wargaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { uploadKTP } from '../config/multerKTP.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Warga
 *   description: Warga management endpoints
 */

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/warga/self-register:
 *   post:
 *     summary: Self-register warga profile with KTP verification (one profile per user)
 *     tags: [Warga]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nik
 *               - namaWarga
 *               - jenisKelamin
 *               - statusDomisili
 *               - statusHidup
 *               - foto_ktp
 *             properties:
 *               nik:
 *                 type: string
 *                 pattern: '^\\d{16}$'
 *                 description: NIK 16 digits
 *               namaWarga:
 *                 type: string
 *                 description: Full name as on KTP
 *               jenisKelamin:
 *                 type: string
 *                 enum: [Laki-laki, Perempuan]
 *               statusDomisili:
 *                 type: string
 *                 description: Domicile status (e.g., Tetap, Kontrak)
 *               statusHidup:
 *                 type: string
 *                 description: Living status (e.g., Hidup, Meninggal)
 *               keluargaId:
 *                 type: integer
 *                 description: Optional family ID
 *               foto_ktp:
 *                 type: string
 *                 format: binary
 *                 description: KTP photo for verification
 *     responses:
 *       201:
 *         description: Profile registration submitted for admin approval
 *       409:
 *         description: User already has a profile or NIK already exists
 */
router.post('/self-register', uploadKTP.single('foto_ktp'), WargaController.selfRegister);

/**
 * @swagger
 * /api/warga:
 *   get:
 *     summary: Get all warga
 *     tags: [Warga]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of warga
 */
router.get('/', WargaController.getAll);

/**
 * @swagger
 * /api/warga/{nik}:
 *   get:
 *     summary: Get warga by NIK
 *     tags: [Warga]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nik
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warga details
 *       404:
 *         description: Warga not found
 */
router.get('/:nik', WargaController.getByNIK);

/**
 * @swagger
 * /api/warga:
 *   post:
 *     summary: Create new warga (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Warga]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nik
 *               - namaWarga
 *               - jenisKelamin
 *               - statusDomisili
 *               - statusHidup
 *             properties:
 *               nik:
 *                 type: string
 *                 pattern: '^\\d{16}$'
 *               namaWarga:
 *                 type: string
 *               jenisKelamin:
 *                 type: string
 *                 enum: [Laki-laki, Perempuan]
 *               statusDomisili:
 *                 type: string
 *               statusHidup:
 *                 type: string
 *               keluargaId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Warga created
 *       409:
 *         description: NIK already exists
 */
router.post(
  '/',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  WargaController.create
);

/**
 * @swagger
 * /api/warga/{nik}:
 *   put:
 *     summary: Update warga data (with verification for nama changes)
 *     description: |
 *       **NON-ADMIN (Warga):**
 *       - Update **namaWarga**: Requires KTP upload + admin verification (use multipart/form-data)
 *       - Update **other fields**: Direct update, no verification needed (use application/json)
 *       - Update **nama + other fields**: All changes go through verification with KTP upload
 *       
 *       **ADMIN (adminSistem, ketuaRT, ketuaRW):**
 *       - Can update all fields directly without verification
 *       - No KTP upload required
 *       
 *       **Authorization:**
 *       - Non-admin: NIK + userId must match
 *       - Admin: Can update any warga
 *       
 *       **Pending Check:**
 *       - Cannot submit new verification if pending verification exists
 *       - Wait for admin approval/rejection before submitting again
 *     tags: [Warga]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nik
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{16}$'
 *         description: 16-digit NIK
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               namaWarga:
 *                 type: string
 *                 description: New name (requires foto_ktp for non-admin)
 *               jenisKelamin:
 *                 type: string
 *                 enum: [Laki-laki, Perempuan]
 *                 description: Gender (direct update, no verification)
 *               statusDomisili:
 *                 type: string
 *                 description: Residence status (direct update, no verification)
 *               statusHidup:
 *                 type: string
 *                 description: Life status (direct update, no verification)
 *               keluargaId:
 *                 type: integer
 *                 description: Family ID (direct update, no verification)
 *               foto_ktp:
 *                 type: string
 *                 format: binary
 *                 description: KTP image (REQUIRED when updating namaWarga for non-admin)
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jenisKelamin:
 *                 type: string
 *                 enum: [Laki-laki, Perempuan]
 *               statusDomisili:
 *                 type: string
 *               statusHidup:
 *                 type: string
 *               keluargaId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Warga updated or verification submitted
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Direct update success (non-nama fields or admin)
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Warga updated successfully
 *                     data:
 *                       type: object
 *                 - type: object
 *                   description: Verification submitted (nama change for non-admin)
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Nama change request submitted for verification.
 *                     verification:
 *                       type: object
 *                       properties:
 *                         nik:
 *                           type: string
 *                         namaWarga_baru:
 *                           type: string
 *                         foto_ktp:
 *                           type: string
 *                         status:
 *                           type: string
 *                           example: pending
 *       400:
 *         description: Missing required fields (foto_ktp when updating nama)
 *       403:
 *         description: Unauthorized - NIK and userId must match
 *       404:
 *         description: Warga not found
 *       409:
 *         description: Pending verification already exists
 */
// Use multer to handle form-data, but file is optional (for compatibility)
router.put('/:nik', (req, res, next) => {
  const multerHandler = uploadKTP.single('foto_ktp');
  multerHandler(req, res, (err) => {
    // Ignore multer errors for update endpoint (file is optional)
    if (err) {
      console.log('Multer warning in update (ignored):', err.message);
    }
    next();
  });
}, WargaController.update);

/**
 * @swagger
 * /api/warga/{nik}:
 *   delete:
 *     summary: Delete warga (adminSistem, ketuaRT, ketuaRW only)
 *     tags: [Warga]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nik
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warga deleted
 *       404:
 *         description: Warga not found
 */
router.delete(
  '/:nik',
  roleMiddleware(['adminSistem', 'ketuaRT', 'ketuaRW']),
  WargaController.delete
);

export default router;
