import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';

export const AuthController = {
  // Register new user
  async register(req, res) {
    try {
      const { nama, email, password, nomor_telefon, role } = req.body;

      // Validate input
      if (!nama || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nama, email, and password are required'
        });
      }

      // Validate role if provided
      const validRoles = ['adminSistem', 'ketuaRT', 'ketuaRW', 'bendahara', 'sekretaris', 'warga'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData = {
        nama,
        email,
        password: hashedPassword,
        role: role || 'warga' // Default to 'warga' if not provided
      };

      if (nomor_telefon) {
        userData.nomor_telefon = nomor_telefon;
      }

      const newUser = await UserModel.create(userData);

      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role || 'warga' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            nama: newUser.nama,
            email: newUser.email,
            nomor_telefon: newUser.nomor_telefon,
            role: newUser.role || 'warga'
          },
          token
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role || 'warga' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            nama: user.nama,
            email: user.email,
            nomor_telefon: user.nomor_telefon,
            role: user.role || 'warga'
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          nomor_telefon: user.nomor_telefon,
          role: user.role || 'warga'
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};
