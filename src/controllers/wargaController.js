import { WargaModel } from '../models/wargaModel.js';
import { VerificationWargaModel } from '../models/verificationWargaModel.js';
import { supabase } from '../config/supabase.js';

export const WargaController = {
  // Get all warga
  async getAll(req, res) {
    try {
      const warga = await WargaModel.getAll();

      res.status(200).json({
        success: true,
        message: 'Warga retrieved successfully',
        data: warga
      });
    } catch (error) {
      console.error('Get all warga error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get warga by NIK
  async getByNIK(req, res) {
    try {
      const { nik } = req.params;
      const warga = await WargaModel.findByNIK(nik);

      if (!warga) {
        return res.status(404).json({
          success: false,
          message: 'Warga not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Warga retrieved successfully',
        data: warga
      });
    } catch (error) {
      console.error('Get warga by NIK error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Create new warga
  async create(req, res) {
    try {
      const { nik, namaWarga, jenisKelamin, statusDomisili, statusHidup, keluargaId } = req.body;

      // Validate required fields
      if (!nik || !namaWarga || !jenisKelamin || !statusDomisili || !statusHidup) {
        return res.status(400).json({
          success: false,
          message: 'nik, namaWarga, jenisKelamin, statusDomisili, and statusHidup are required'
        });
      }

      // Validate NIK format (should be 16 digits)
      if (!/^\d{16}$/.test(nik)) {
        return res.status(400).json({
          success: false,
          message: 'nik must be 16 digits'
        });
      }

      // Check if NIK already exists
      const existingWarga = await WargaModel.findByNIK(nik);
      if (existingWarga) {
        // Get user info for the existing NIK
        let userInfo = null;
        if (existingWarga.userId) {
          const { data: userData } = await supabase
            .from('user')
            .select('id, nama, email')
            .eq('id', existingWarga.userId)
            .single();
          userInfo = userData;
        }

        return res.status(409).json({
          success: false,
          message: 'NIK already exists',
          conflict: {
            nik: existingWarga.nik,
            namaWarga: existingWarga.namaWarga,
            status: existingWarga.status,
            user: userInfo ? {
              id: userInfo.id,
              nama: userInfo.nama,
              email: userInfo.email
            } : null
          }
        });
      }

      // Validate jenisKelamin
      if (!['Laki-laki', 'Perempuan'].includes(jenisKelamin)) {
        return res.status(400).json({
          success: false,
          message: 'jenisKelamin must be either L or P'
        });
      }

      // Prepare warga data
      const wargaData = {
        nik,
        namaWarga,
        jenisKelamin,
        statusDomisili,
        statusHidup
      };

      // Add KeluargaId only if provided
      if (keluargaId) {
        wargaData.keluargaId = keluargaId;
      }

      const newWarga = await WargaModel.create(wargaData);

      res.status(201).json({
        success: true,
        message: 'Warga created successfully',
        data: newWarga
      });
    } catch (error) {
      console.error('Create warga error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update warga
  async update(req, res) {
    try {
      const { nik } = req.params;
      const { namaWarga, jenisKelamin, statusDomisili, statusHidup, keluargaId } = req.body;

      // NOTE: foto_ktp is ignored in update endpoint
      // File uploads are only for self-registration

      // Check if warga exists
      const existingWarga = await WargaModel.findByNIK(nik);
      if (!existingWarga) {
        return res.status(404).json({
          success: false,
          message: 'Warga not found'
        });
      }

      // Check authorization: admin roles OR the warga themselves
      const userRole = req.user.role;
      const allowedAdminRoles = ['adminSistem', 'ketuaRT', 'ketuaRW'];
      
      // Authorization check
      const isAdmin = allowedAdminRoles.includes(userRole);

      // Non-admin must have matching NIK + userId
      if (!isAdmin) {
        // Check if warga.userId matches req.user.id
        if (!existingWarga.userId || existingWarga.userId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to update this warga profile. NIK and userId must match.'
          });
        }
      }

      // Check if namaWarga is being changed
      const isChangingNama = namaWarga && namaWarga !== existingWarga.namaWarga;

      // For non-admin: nama changes require verification
      if (!isAdmin && isChangingNama) {
        // Check if user has pending verification
        const pendingVerification = await VerificationWargaModel.findPendingByUserId(req.user.id);
        if (pendingVerification) {
          return res.status(409).json({
            success: false,
            message: 'You already have a pending verification request. Please wait for admin approval or rejection before submitting a new request.',
            verification: {
              id: pendingVerification.id,
              nik: pendingVerification.nik_baru,
              namaWarga: pendingVerification.namaWarga_baru,
              status: pendingVerification.status,
              created_at: pendingVerification.created_at
            }
          });
        }

        // Validate foto_ktp is required for nama changes
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'foto_ktp is required when updating namaWarga. Please upload your KTP image.'
          });
        }

        // Upload foto_ktp to Supabase Storage
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `ktp-update-${req.user.id}-${Date.now()}.${fileExt}`;
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

        // Create verification request for nama change
        const verificationData = {
          warga_id: existingWarga.nik,
          user_id: req.user.id,
          nik_baru: existingWarga.nik, // NIK stays the same
          namaWarga_baru: namaWarga,
          foto_ktp: publicUrl, // KTP URL for nama change verification
          status: 'pending',
          extra_data: {
            jenisKelamin: jenisKelamin || existingWarga.jenisKelamin,
            statusDomisili: statusDomisili || existingWarga.statusDomisili,
            statusHidup: statusHidup || existingWarga.statusHidup,
            keluargaId: keluargaId !== undefined ? keluargaId : existingWarga.keluargaId
          }
        };

        await VerificationWargaModel.create(verificationData);
        
        // Update warga status to pending
        await WargaModel.update(existingWarga.nik, { status: 'pending' });

        return res.status(200).json({
          success: true,
          message: jenisKelamin || statusDomisili || statusHidup || keluargaId !== undefined
            ? 'Nama change request submitted for verification. Other field updates will be processed after admin approval.'
            : 'Nama change request submitted for verification.',
          verification: {
            nik: existingWarga.nik,
            namaWarga_baru: namaWarga,
            foto_ktp: publicUrl,
            status: 'pending'
          }
        });
      }

      // Direct update for non-nama fields OR admin updates
      const updateData = {};
      
      // ONLY Admin can directly update namaWarga
      if (namaWarga) {
        if (isAdmin) {
          updateData.namaWarga = namaWarga;
        } else {
          // Non-admin trying to update nama should have been caught above
          // This is a safety check
          return res.status(400).json({
            success: false,
            message: 'Nama changes require admin verification. This request should have been routed to verification.'
          });
        }
      }
      
      if (jenisKelamin) {
        if (!['Laki-laki', 'Perempuan'].includes(jenisKelamin)) {
          return res.status(400).json({
            success: false,
            message: 'jenisKelamin must be either Laki-laki or Perempuan'
          });
        }
        updateData.jenisKelamin = jenisKelamin;
      }
      if (statusDomisili) updateData.statusDomisili = statusDomisili;
      if (statusHidup) updateData.statusHidup = statusHidup;
      if (keluargaId !== undefined) {
        updateData.keluargaId = keluargaId || null;
      }

      // Only update if there are fields to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const updatedWarga = await WargaModel.update(nik, updateData);

      res.status(200).json({
        success: true,
        message: 'Warga updated successfully',
        data: updatedWarga
      });
    } catch (error) {
      console.error('Update warga error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Delete warga
  async delete(req, res) {
    try {
      const { nik } = req.params;

      // Check if warga exists
      const existingWarga = await WargaModel.findByNIK(nik);
      if (!existingWarga) {
        return res.status(404).json({
          success: false,
          message: 'Warga not found'
        });
      }

      await WargaModel.delete(nik);

      res.status(200).json({
        success: true,
        message: 'Warga deleted successfully'
      });
    } catch (error) {
      console.error('Delete warga error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Self-registration: Warga create their own profile with KTP verification
  async selfRegister(req, res) {
    try {
      const { nik, namaWarga, jenisKelamin, statusDomisili, statusHidup, keluargaId } = req.body;
      const userId = req.user.id;

      // Check if user already has a warga profile
      const existingProfile = await WargaModel.findByUserId(userId);
      if (existingProfile) {
        return res.status(409).json({
          success: false,
          message: 'You already have a warga profile. Each user can only have one profile.',
          data: existingProfile
        });
      }

      // Check if user has pending verification
      const pendingVerification = await VerificationWargaModel.findPendingByUserId(userId);
      if (pendingVerification) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending verification request. Please wait for admin approval or rejection before submitting a new request.',
          verification: {
            id: pendingVerification.id,
            nik: pendingVerification.nik_baru,
            namaWarga: pendingVerification.namaWarga_baru,
            status: pendingVerification.status,
            created_at: pendingVerification.created_at
          }
        });
      }

      // Validate required fields
      if (!nik || !namaWarga || !jenisKelamin || !statusDomisili || !statusHidup) {
        return res.status(400).json({
          success: false,
          message: 'nik, namaWarga, jenisKelamin, statusDomisili, and statusHidup are required'
        });
      }

      // Validate foto_ktp
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'foto_ktp is required for profile creation'
        });
      }

      // Validate NIK format (should be 16 digits)
      if (!/^\d{16}$/.test(nik)) {
        return res.status(400).json({
          success: false,
          message: 'nik must be 16 digits'
        });
      }

      // Check if NIK already exists
      const existingWarga = await WargaModel.findByNIK(nik);
      if (existingWarga) {
        // Check if userId is NULL (data created by admin, not claimed yet)
        if (!existingWarga.userId) {
          // NIK exists but not assigned to any user - allow submission for admin to assign
          // Continue to create verification request (skip the error, proceed to upload KTP)
        } else {
          // NIK already assigned to another user - block registration
          const { data: userData } = await supabase
            .from('user')
            .select('id, nama, email')
            .eq('id', existingWarga.userId)
            .single();

          return res.status(409).json({
            success: false,
            message: 'NIK already exists and is assigned to another user',
            conflict: {
              nik: existingWarga.nik,
              namaWarga: existingWarga.namaWarga,
              status: existingWarga.status,
              user: userData ? {
                id: userData.id,
                nama: userData.nama,
                email: userData.email
              } : null,
              note: 'This NIK is already registered and assigned to another account.'
            }
          });
        }
      }

      // Validate jenisKelamin
      if (!['Laki-laki', 'Perempuan'].includes(jenisKelamin)) {
        return res.status(400).json({
          success: false,
          message: 'jenisKelamin must be either Laki-laki or Perempuan'
        });
      }

      // Upload foto_ktp to Supabase Storage
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `ktp-registration-${userId}-${Date.now()}.${fileExt}`;
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

      // Check if we need to create new warga or just verification (for NIK assignment case)
      let isAssignmentRequest = false;
      if (existingWarga && !existingWarga.userId) {
        // This is a NIK assignment request (warga exists but userId is NULL)
        isAssignmentRequest = true;
      }

      let newWarga = null;
      if (!isAssignmentRequest) {
        // Create new warga profile with status 'pending'
        const wargaData = {
          nik,
          namaWarga,
          jenisKelamin,
          statusDomisili,
          statusHidup,
          keluargaId: keluargaId || null,
          userId,
          status: 'pending'
        };
        newWarga = await WargaModel.create(wargaData);
      }

      // Create verification record for tracking
      const verificationData = {
        warga_id: nik,
        user_id: userId,
        nik_baru: nik,
        namaWarga_baru: namaWarga,
        foto_ktp: publicUrl,
        status: 'pending',
        extra_data: JSON.stringify({
          jenisKelamin,
          statusDomisili,
          statusHidup,
          keluargaId: keluargaId || null,
          isNewRegistration: !isAssignmentRequest,
          isAssignmentRequest: isAssignmentRequest
        })
      };

      const verification = await VerificationWargaModel.create(verificationData);

      res.status(201).json({
        success: true,
        message: isAssignmentRequest 
          ? 'Assignment request submitted. Admin will review and assign this NIK to your account.'
          : 'Profile created with pending status. Admin will review your KTP.',
        data: {
          warga: newWarga,
          verification_id: verification.id,
          foto_ktp: publicUrl,
          isAssignmentRequest: isAssignmentRequest,
          note: isAssignmentRequest
            ? 'This NIK exists but not assigned. Admin will verify and assign it to you.'
            : 'Your profile status will be updated after admin approval'
        }
      });
    } catch (error) {
      console.error('Self-register warga error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};
