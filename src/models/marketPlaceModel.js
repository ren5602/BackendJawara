import { supabase } from '../config/supabase.js';

export const MarketPlaceModel = {
  // Get all marketplace items
  async getAll() {
    const { data, error } = await supabase
      .from('marketPlace')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  // Get marketplace item by id
  async findById(id) {
    const { data, error } = await supabase
      .from('marketPlace')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  // Create new marketplace item
  async create(marketPlaceData) {
    const { data, error } = await supabase
      .from('marketPlace')
      .insert([marketPlaceData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Update marketplace item
  async update(id, marketPlaceData) {
    const { data, error } = await supabase
      .from('marketPlace')
      .update(marketPlaceData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Delete marketplace item
  async delete(id) {
    const { data, error } = await supabase
      .from('marketPlace')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  // Upload image to Supabase Storage
  async uploadImage(file, fileName) {
    const { data, error } = await supabase.storage
      .from('marketplace')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('marketplace')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  },

  // Delete image from Supabase Storage
  async deleteImage(fileName) {
    const { error } = await supabase.storage
      .from('marketplace')
      .remove([fileName]);

    if (error) {
      throw error;
    }
  }
};
