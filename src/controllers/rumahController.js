import { RumahModel } from '../models/rumahModel.js';

export const RumahController = {
  // Get all rumah
  async getAll(req, res) {
    try {
      const rumah = await RumahModel.getAll();

      res.status(200).json({
        success: true,
        message: 'Rumah retrieved successfully',
        data: rumah
      });
    } catch (error) {
      console.error('Get all rumah error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get rumah by id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const rumah = await RumahModel.findById(id);

      if (!rumah) {
        return res.status(404).json({
          success: false,
          message: 'Rumah not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Rumah retrieved successfully',
        data: rumah
      });
    } catch (error) {
      console.error('Get rumah by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Create new rumah
  async create(req, res) {
    try {
      const { statusKepemilikan, alamat, keluargaId, jumlahPenghuni } = req.body;

      // Validate required fields
      if (!statusKepemilikan || !alamat || !jumlahPenghuni) {
        return res.status(400).json({
          success: false,
          message: 'statusKepemilikan, alamat, and jumlahPenghuni are required'
        });
      }

      // Validate statusKepemilikan
      if (!['milik_sendiri', 'kontrak'].includes(statusKepemilikan)) {
        return res.status(400).json({
          success: false,
          message: 'statusKepemilikan must be either milik_sendiri or kontrak'
        });
      }

      // Validate jumlahPenghuni is a number
      if (isNaN(jumlahPenghuni) || jumlahPenghuni < 0) {
        return res.status(400).json({
          success: false,
          message: 'jumlahPenghuni must be a non-negative number'
        });
      }

      // Prepare rumah data
      const rumahData = {
        statusKepemilikan,
        alamat,
        jumlahPenghuni: parseInt(jumlahPenghuni)
      };

      // Add keluargaId only if provided
      if (keluargaId) {
        rumahData.keluargaId = keluargaId;
      }

      const newRumah = await RumahModel.create(rumahData);

      res.status(201).json({
        success: true,
        message: 'Rumah created successfully',
        data: newRumah
      });
    } catch (error) {
      console.error('Create rumah error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update rumah
  async update(req, res) {
    try {
      const { id } = req.params;
      const { statusKepemilikan, alamat, keluargaId, jumlahPenghuni } = req.body;

      // Check if rumah exists
      const existingRumah = await RumahModel.findById(id);
      if (!existingRumah) {
        return res.status(404).json({
          success: false,
          message: 'Rumah not found'
        });
      }

      // Prepare update data
      const updateData = {};
      
      if (statusKepemilikan) {
        if (!['milik_sendiri', 'kontrak'].includes(statusKepemilikan)) {
          return res.status(400).json({
            success: false,
            message: 'statusKepemilikan must be either milik_sendiri or kontrak'
          });
        }
        updateData.statusKepemilikan = statusKepemilikan;
      }
      
      if (alamat) updateData.alamat = alamat;
      
      if (jumlahPenghuni !== undefined) {
        if (isNaN(jumlahPenghuni) || jumlahPenghuni < 0) {
          return res.status(400).json({
            success: false,
            message: 'jumlahPenghuni must be a non-negative number'
          });
        }
        updateData.jumlahPenghuni = parseInt(jumlahPenghuni);
      }
      
      if (keluargaId !== undefined) {
        updateData.keluargaId = keluargaId || null;
      }

      const updatedRumah = await RumahModel.update(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Rumah updated successfully',
        data: updatedRumah
      });
    } catch (error) {
      console.error('Update rumah error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Delete rumah
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if rumah exists
      const existingRumah = await RumahModel.findById(id);
      if (!existingRumah) {
        return res.status(404).json({
          success: false,
          message: 'Rumah not found'
        });
      }

      await RumahModel.delete(id);

      res.status(200).json({
        success: true,
        message: 'Rumah deleted successfully'
      });
    } catch (error) {
      console.error('Delete rumah error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};
