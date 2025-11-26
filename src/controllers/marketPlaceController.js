import axios from 'axios';
import FormData from 'form-data';
import { MarketPlaceModel } from '../models/marketPlaceModel.js';

export const MarketPlaceController = {
  // Get all marketplace items
  async getAll(req, res) {
    try {
      const items = await MarketPlaceModel.getAll();

      res.status(200).json({
        success: true,
        message: 'Marketplace items retrieved successfully',
        data: items
      });
    } catch (error) {
      console.error('Get all marketplace error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get marketplace item by id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const item = await MarketPlaceModel.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Marketplace item not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Marketplace item retrieved successfully',
        data: item
      });
    } catch (error) {
      console.error('Get marketplace by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Create new marketplace item with image validation
  async create(req, res) {
    try {
      const { namaProduk, harga, deskripsi } = req.body;
      const file = req.file;

      // Validate required fields
      if (!namaProduk || !harga || !deskripsi || !file) {
        return res.status(400).json({
          success: false,
          message: 'namaProduk, harga, deskripsi, and gambar are required'
        });
      }

      // Validate harga is a number
      if (isNaN(harga) || harga < 0) {
        return res.status(400).json({
          success: false,
          message: 'harga must be a non-negative number'
        });
      }

      // Step 1: Check image cleanliness using external API
      const formData = new FormData();
      formData.append('image', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype
      });

      let cleanlinessResult;
      try {
        const response = await axios.post('http://virtualtech.icu:3000/predict', formData, {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 30000 // 30 seconds timeout
        });

        cleanlinessResult = response.data;
      } catch (apiError) {
        console.error('Cleanliness API error:', apiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to validate image cleanliness',
          error: apiError.message
        });
      }

      // Step 2: Check if image is clean
      const isClean = cleanlinessResult.predicted_label === "bersih"

      if (!isClean) {
        return res.status(400).json({
          success: false,
          message: 'Image rejected: Product appears to be dirty or unclean',
          validationResult: cleanlinessResult
        });
      }

      // Step 3: Upload image to Supabase Storage
      const fileName = `${Date.now()}-${file.originalname}`;
      let imageUrl;
      
      try {
        imageUrl = await MarketPlaceModel.uploadImage(file, fileName);
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadError.message
        });
      }

      // Step 4: Save to database
      const newItem = await MarketPlaceModel.create({
        namaProduk,
        harga: parseFloat(harga),
        deskripsi,
        gambar: imageUrl
      });

      res.status(201).json({
        success: true,
        message: 'Marketplace item created successfully',
        data: newItem,
        validationResult: cleanlinessResult
      });
    } catch (error) {
      console.error('Create marketplace error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update marketplace item
  async update(req, res) {
    try {
      const { id } = req.params;
      const { namaProduk, harga, deskripsi } = req.body;

      // Check if item exists
      const existingItem = await MarketPlaceModel.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Marketplace item not found'
        });
      }

      // Prepare update data
      const updateData = {};
      if (namaProduk) updateData.namaProduk = namaProduk;
      if (harga !== undefined) {
        if (isNaN(harga) || harga < 0) {
          return res.status(400).json({
            success: false,
            message: 'harga must be a non-negative number'
          });
        }
        updateData.harga = parseFloat(harga);
      }
      if (deskripsi) updateData.deskripsi = deskripsi;

      const updatedItem = await MarketPlaceModel.update(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Marketplace item updated successfully',
        data: updatedItem
      });
    } catch (error) {
      console.error('Update marketplace error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Delete marketplace item
  async delete(req, res) {
    try {
      const { id } = req.params;

      // Check if item exists
      const existingItem = await MarketPlaceModel.findById(id);
      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Marketplace item not found'
        });
      }

      // Delete image from storage if exists
      if (existingItem.gambar) {
        try {
          const fileName = existingItem.gambar.split('/').pop();
          await MarketPlaceModel.deleteImage(fileName);
        } catch (deleteError) {
          console.error('Error deleting image:', deleteError);
          // Continue with deletion even if image deletion fails
        }
      }

      await MarketPlaceModel.delete(id);

      res.status(200).json({
        success: true,
        message: 'Marketplace item deleted successfully'
      });
    } catch (error) {
      console.error('Delete marketplace error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};
