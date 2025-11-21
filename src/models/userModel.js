import { supabase } from '../config/supabase.js';

export const UserModel = {
  // Find user by email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('user')
      .select('id, nama, email, password, nomor_telefon, role')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  // Create new user
  async create(userData) {
    const { data, error } = await supabase
      .from('user')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get user by id
  async findById(id) {
    const { data, error } = await supabase
      .from('user')
      .select('id, nama, email, nomor_telefon, role')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }
};
