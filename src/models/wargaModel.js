import { supabase } from '../config/supabase.js';

export const WargaModel = {
  // Get all warga
  async getAll() {
    const { data, error } = await supabase
      .from('warga')
      .select('*, keluarga(namaKeluarga)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  // Get warga by NIK
  async findByNIK(nik) {
    const { data, error } = await supabase
      .from('warga')
      .select('*, keluarga(namaKeluarga)')
      .eq('nik', nik)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  // Create new warga
  async create(wargaData) {
    const { data, error } = await supabase
      .from('warga')
      .insert([wargaData])
      .select('*, keluarga(namaKeluarga)')
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Update warga
  async update(nik, wargaData) {
    const { data, error } = await supabase
      .from('warga')
      .update(wargaData)
      .eq('nik', nik)
      .select('*, keluarga(namaKeluarga)')
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Delete warga
  async delete(nik) {
    const { data, error } = await supabase
      .from('warga')
      .delete()
      .eq('nik', nik)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Get warga by user ID
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }
};
