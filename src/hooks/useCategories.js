import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_CATEGORIES = {
  income: ['Salario', 'Ventas', 'Inversiones', 'Otros'],
  expense: ['Alimentación', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Otros'],
};

export function useCategories(userId) {
  const [categories, setCategories] = useState({ income: [], expense: [] });

  const loadCategories = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) { console.error('loadCategories:', error); return; }

    const cats = { income: [], expense: [] };
    (data || []).forEach(c => {
      if (cats[c.type]) cats[c.type].push({ id: c.id, name: c.name });
    });
    setCategories(cats);
  }, [userId]);

  const ensureDefaults = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (count > 0) return;

    const rows = [];
    ['income', 'expense'].forEach(type => {
      DEFAULT_CATEGORIES[type].forEach(name => {
        rows.push({ user_id: userId, name, type, is_default: true });
      });
    });
    await supabase.from('categories').insert(rows);
  }, [userId]);

  const addCategory = useCallback(async (name, type) => {
    const formatted = name.charAt(0).toUpperCase() + name.slice(1);
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: userId, name: formatted, type, is_default: false })
      .select()
      .single();

    if (error) return { error };

    setCategories(prev => ({
      ...prev,
      [type]: [...prev[type], { id: data.id, name: data.name }],
    }));
    return { data };
  }, [userId]);

  const deleteCategory = useCallback(async (catId, catName, catType, newCatName) => {
    if (newCatName) {
      const { error: updateErr } = await supabase
        .from('transactions')
        .update({ category: newCatName })
        .eq('user_id', userId)
        .eq('type', catType)
        .eq('category', catName);
      if (updateErr) return { error: updateErr };
    }

    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) return { error };

    setCategories(prev => ({
      ...prev,
      [catType]: prev[catType].filter(c => c.id !== catId),
    }));
    return { newCatName };
  }, [userId]);

  return { categories, loadCategories, ensureDefaults, addCategory, deleteCategory };
}
