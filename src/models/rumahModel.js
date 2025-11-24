import { supabase } from '../config/supabase.js';

export const RumahModel = {
  // Get all rumah
  async getAll() {
    const { data, error } = await supabase
      .from('rumah')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  // Get rumah by id
  async findById(id) {
    const { data, error } = await supabase
      .from('rumah')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  // Create new rumah
  async create(rumahData) {
    const { data, error } = await supabase
      .from('rumah')
      .insert([rumahData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Update rumah
  async update(id, rumahData) {
    const { data, error } = await supabase
      .from('rumah')
      .update(rumahData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Delete rumah
  async delete(id) {
    const { data, error } = await supabase
      .from('rumah')
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
