import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);

  const loadTransactions = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) { console.error('loadTransactions:', error); return; }
    setTransactions(data || []);
  }, [userId]);

  const addTransaction = useCallback(async (row) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...row, user_id: userId })
      .select()
      .single();

    if (error) return { error };

    setTransactions(prev => [data, ...prev]);
    return { data };
  }, [userId]);

  const deleteTransaction = useCallback(async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { error };

    setTransactions(prev => prev.filter(t => t.id !== id));
    return {};
  }, []);

  const updateTransaction = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return { error };

    setTransactions(prev => prev.map(t => t.id === id ? data : t));
    return { data };
  }, []);

  const clearAll = useCallback(async () => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);
    if (error) return { error };

    setTransactions([]);
    return {};
  }, [userId]);

  const updateCategoryName = useCallback((oldName, newName, type) => {
    setTransactions(prev =>
      prev.map(t =>
        t.type === type && t.category === oldName
          ? { ...t, category: newName }
          : t
      )
    );
  }, []);

  return { transactions, loadTransactions, addTransaction, updateTransaction, deleteTransaction, clearAll, updateCategoryName };
}
