import { supabase } from '../config/supabase.js';

export const KeluargaModel = {
  // Get all keluarga
  async getAll() {
    const { data, error } = await supabase
      .from('keluarga')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  // Get keluarga by id
  async findById(id) {
    const { data, error } = await supabase
      .from('keluarga')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  // Create new keluarga
  async create(keluargaData) {
    const { data, error } = await supabase
      .from('keluarga')
      .insert([keluargaData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Update keluarga
  async update(id, keluargaData) {
    const { data, error } = await supabase
      .from('keluarga')
      .update(keluargaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Delete keluarga
  async delete(id) {
    const { data, error } = await supabase
      .from('keluarga')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
};
