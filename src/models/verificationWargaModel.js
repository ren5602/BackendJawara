import { supabase } from '../config/supabase.js';

export const VerificationWargaModel = {
  // Create verification request
  async create(verificationData) {
    const { data, error } = await supabase
      .from('verification_warga')
      .insert([verificationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all verification requests
  async getAll() {
    const { data, error } = await supabase
      .from('verification_warga')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get verification by ID
  async findById(id) {
    const { data, error } = await supabase
      .from('verification_warga')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get verification requests by warga_id (NIK)
  async findByWargaId(wargaId) {
    const { data, error } = await supabase
      .from('verification_warga')
      .select('*')
      .eq('warga_id', wargaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get verification requests by user_id
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('verification_warga')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get pending verification requests
  async getPending() {
    const { data, error } = await supabase
      .from('verification_warga')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get pending verification by user_id (untuk check apakah user punya pending verification)
  async findPendingByUserId(userId) {
    const { data, error } = await supabase
      .from('verification_warga')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  // Update verification status and process approval
  async updateStatus(id, status, adminId) {
    const { data, error } = await supabase
      .from('verification_warga')
      .update({
        status,
        verified_by: adminId,
        verified_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete verification request
  async delete(id) {
    const { error } = await supabase
      .from('verification_warga')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
