import { createClient } from './supabase/client';
import type { Review } from './types';

const supabase = createClient();

function mapRow(row: any): Review {
  return {
    id: row.id,
    dishId: row.dish_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    date: row.created_at,
  };
}

export async function fetchReviews(dishId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('dish_id', dishId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createReview(
  userId: string,
  userName: string,
  dishId: string,
  rating: number,
  comment: string
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      dish_id: dishId,
      user_id: userId,
      user_name: userName,
      rating,
      comment,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  if (error) throw error;
}