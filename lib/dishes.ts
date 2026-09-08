import { createClient } from './supabase/client';
import type { Dish, DishInput, IconType } from './types';

function mapRow(row: any): Dish {
  return {
    id: row.id,
    name: row.name,
    cat: row.cat,
    desc: row.description, // ← column renamed
    fullDesc: row.full_desc,
    price: row.price,
    icon: row.icon as IconType,
    tone: row.tone,
    tag: row.tag ?? undefined,
    images: row.images ?? [],
  };
}

export async function fetchDishes(): Promise<Dish[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Supabase fetchDishes error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }
  return (data ?? []).map(mapRow);
}

export async function fetchDishById(id: string): Promise<Dish | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('dishes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function uploadDishImage(dishName: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const safeName = dishName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const path = `${safeName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from('dish-images').upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from('dish-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function createDish(input: DishInput, imageFiles: File[]): Promise<Dish> {
  const supabase = createClient();

  const images = await Promise.all(
    imageFiles.slice(0, 3).map((f) => uploadDishImage(input.name, f)),
  );

  const { data, error } = await supabase
    .from('dishes')
    .insert({
      name: input.name.trim(),
      cat: input.cat,
      description: input.desc.trim(), // ← column renamed
      full_desc: input.fullDesc.trim(),
      price: parseFloat(input.price),
      icon: input.icon,
      tone: input.tone,
      tag: input.tag.trim() || null,
      images,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deleteDish(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('dishes').delete().eq('id', id);
  if (error) throw error;
}