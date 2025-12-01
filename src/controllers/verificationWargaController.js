import { VerificationWargaModel } from '../models/verificationWargaModel.js';
import { WargaModel } from '../models/wargaModel.js';
import { supabase } from '../config/supabase.js';

export const VerificationWargaController = {
  // Submit verification request
  async submitRequest(req, res) {
    try {
      const { nik_baru, namaWarga_baru } = req.body;
      const userId = req.user.id;

      // Get user's current warga data
      const currentWarga = await WargaModel.findByUserId(userId);
      if (!currentWarga) {
        return res.status(404).json({
          success: false,
          message: 'Warga data not found for this user'
        });
      }

      // Validate that at least NIK or namaWarga is being changed
      if (!nik_baru && !namaWarga_baru) {
        return res.status(400).json({
          success: false,
          message: 'Please provide nik_baru or namaWarga_baru to update'
        });
      }

      // Check if there's already a pending request
      const pendingRequests = await VerificationWargaModel.findByUserId(userId);
      const hasPending = pendingRequests.some(req => req.status === 'pending');
      
      if (hasPending) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending verification request'
        });
      }

      // Validate foto_ktp
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'foto_ktp is required for verification'
        });
      }

      // Validate NIK format if provided
      if (nik_baru && !/^\d{16}$/.test(nik_baru)) {
        return res.status(400).json({
          success: false,
          message: 'nik_baru must be 16 digits'
        });
      }

      // Don't check NIK uniqueness here - let admin decide during approval
      // This allows submission even if NIK conflicts exist

      // Upload foto_ktp to Supabase Storage
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `ktp-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `ktp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('verification')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload KTP image',
          error: uploadError.message
        });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('verification')
        .getPublicUrl(filePath);

      // Update warga status to 'pending' immediately
      await WargaModel.update(currentWarga.nik, { status: 'pending' });

      // Create verification request
      const verificationData = {
        warga_id: currentWarga.nik,
        user_id: userId,
        nik_baru: nik_baru || currentWarga.nik,
        namaWarga_baru: namaWarga_baru || currentWarga.namaWarga,
        foto_ktp: publicUrl,
        status: 'pending'
      };

      const verification = await VerificationWargaModel.create(verificationData);

      res.status(201).json({
        success: true,
        message: 'Verification request submitted successfully. Your profile status is now pending.',
        data: verification
      });
    } catch (error) {
      console.error('Submit verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get all verification requests (admin only)
  async getAll(req, res) {
    try {
      const verifications = await VerificationWargaModel.getAll();

      res.status(200).json({
        success: true,
        message: 'Verification requests retrieved successfully',
        data: verifications
      });
    } catch (error) {
      console.error('Get all verifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get verification by ID (authenticated users only)
  async getById(req, res) {
    try {
      const { id } = req.params;

      const verification = await VerificationWargaModel.findById(id);
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification request not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Verification request retrieved successfully',
        data: verification
      });
    } catch (error) {
      console.error('Get verification by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get pending verification requests (admin only)
  async getPending(req, res) {
    try {
      const verifications = await VerificationWargaModel.getPending();

      res.status(200).json({
        success: true,
        message: 'Pending verification requests retrieved successfully',
        data: verifications
      });
    } catch (error) {
      console.error('Get pending verifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get user's own verification requests
  async getMyRequests(req, res) {
    try {
      const userId = req.user.id;
      const verifications = await VerificationWargaModel.findByUserId(userId);

      res.status(200).json({
        success: true,
        message: 'Your verification requests retrieved successfully',
        data: verifications
      });
    } catch (error) {
      console.error('Get my verifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Approve verification request (admin only)
  async approve(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      // Get verification request
      const verification = await VerificationWargaModel.findById(id);
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification request not found'
        });
      }

      if (verification.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'This verification request has already been processed'
        });
      }

      // Check if this is a new profile registration or update
      // warga_id is NULL for new registrations
      const isNewRegistration = !verification.warga_id || verification.warga_id === null;
      
      // Parse extra data to check if this is an assignment request
      let extraData = {};
      try {
        extraData = verification.extra_data ? JSON.parse(verification.extra_data) : {};
      } catch (e) {
        console.error('Failed to parse extra_data:', e);
      }

      const isAssignmentRequest = extraData.isAssignmentRequest === true;

      if (isNewRegistration && !isAssignmentRequest) {
        // NEW REGISTRATION: Create new warga profile
        const wargaData = {
          nik: verification.nik_baru,
          namaWarga: verification.namaWarga_baru,
          jenisKelamin: extraData.jenisKelamin,
          statusDomisili: extraData.statusDomisili,
          statusHidup: extraData.statusHidup,
          keluargaId: extraData.keluargaId || null,
          userId: verification.user_id,
          status: 'accepted'
        };

        const newWarga = await WargaModel.create(wargaData);

        // Update verification status
        await VerificationWargaModel.updateStatus(id, 'accepted', adminId);

        return res.status(201).json({
          success: true,
          message: 'New warga profile created successfully',
          data: {
            id: parseInt(id),
            status: 'accepted',
            verified_by: adminId,
            verified_at: new Date().toISOString()
          },
          warga: newWarga
        });
      }

      if (isAssignmentRequest) {
        // ASSIGNMENT: Assign userId to existing warga (userId was NULL)
        const existingWarga = await WargaModel.findByNIK(verification.nik_baru);
        
        if (!existingWarga) {
          return res.status(404).json({
            success: false,
            message: 'Warga data not found for assignment'
          });
        }

        // Assign userId to existing warga
        await WargaModel.update(verification.nik_baru, {
          userId: verification.user_id,
          status: 'accepted'
        });

        // Update verification status
        const updatedVerification = await VerificationWargaModel.updateStatus(id, 'accepted', adminId);

        return res.status(200).json({
          success: true,
          message: 'NIK assigned to user successfully',
          data: updatedVerification,
          assigned: {
            nik: verification.warga_id,
            user_id: verification.user_id,
            status: 'accepted'
          }
        });
      }

      // UPDATE EXISTING WARGA: warga_id is not NULL
      const existingWarga = await WargaModel.findByNIK(verification.warga_id);
      
      if (!existingWarga) {
        return res.status(404).json({
          success: false,
          message: 'Warga data not found for update'
        });
      }

      // Check if NIK is being changed and if new NIK already exists
      if (verification.warga_id !== verification.nik_baru) {
        const nikConflict = await WargaModel.findByNIK(verification.nik_baru);
        if (nikConflict && nikConflict.nik !== verification.warga_id) {
          // Get user info for the conflicting NIK
          let userInfo = null;
          if (nikConflict.userId) {
            const { data: userData } = await supabase
              .from('user')
              .select('id, nama, email')
              .eq('id', nikConflict.userId)
              .single();
            userInfo = userData;
          }

          return res.status(409).json({
            success: false,
            message: 'Cannot approve: NIK already exists in the system',
            conflict: {
              nik: nikConflict.nik,
              namaWarga: nikConflict.namaWarga,
              status: nikConflict.status,
              user: userInfo ? {
                id: userInfo.id,
                nama: userInfo.nama,
                email: userInfo.email
              } : null,
              note: 'Please reject this request or ask the requester to choose a different NIK.'
            }
          });
        }

        // NIK changed - delete old record and create new one
        await WargaModel.delete(verification.warga_id);
        
        const newWargaData = {
          nik: verification.nik_baru,
          namaWarga: verification.namaWarga_baru,
          jenisKelamin: extraData.jenisKelamin || existingWarga.jenisKelamin,
          statusDomisili: extraData.statusDomisili || existingWarga.statusDomisili,
          statusHidup: extraData.statusHidup || existingWarga.statusHidup,
          keluargaId: extraData.keluargaId !== undefined ? extraData.keluargaId : existingWarga.keluargaId,
          userId: existingWarga.userId,
          status: 'accepted'
        };
        
        await WargaModel.create(newWargaData);
      } else {
        // NIK same, update nama and other fields from extra_data
        const updateData = {
          namaWarga: verification.namaWarga_baru,
          status: 'accepted'
        };
        
        // Update other fields if provided in extra_data
        if (extraData.jenisKelamin) updateData.jenisKelamin = extraData.jenisKelamin;
        if (extraData.statusDomisili) updateData.statusDomisili = extraData.statusDomisili;
        if (extraData.statusHidup) updateData.statusHidup = extraData.statusHidup;
        if (extraData.keluargaId !== undefined) updateData.keluargaId = extraData.keluargaId;
        
        await WargaModel.update(verification.warga_id, updateData);
      }

      // Update verification status
      const updatedVerification = await VerificationWargaModel.updateStatus(id, 'accepted', adminId);

      res.status(200).json({
        success: true,
        message: 'Verification approved and warga data updated successfully',
        data: updatedVerification
      });
    } catch (error) {
      console.error('Approve verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Reject verification request (admin only)
  async reject(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      // Get verification request
      const verification = await VerificationWargaModel.findById(id);
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Verification request not found'
        });
      }

      if (verification.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'This verification request has already been processed'
        });
      }

      // Update warga status to 'rejected'
      const wargaExists = await WargaModel.findByNIK(verification.warga_id);
      if (wargaExists) {
        await WargaModel.update(verification.warga_id, { status: 'rejected' });
      }

      // Update verification status
      const updatedVerification = await VerificationWargaModel.updateStatus(id, 'rejected', adminId);

      res.status(200).json({
        success: true,
        message: reason || 'Verification request rejected and warga status updated',
        data: updatedVerification
      });
    } catch (error) {
      console.error('Reject verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};