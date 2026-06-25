export function normalizeReview(review) {
 return {
  id: review.id,
  name: review.name,
  rating: Number(review.rating),
  comment: review.comment,
  created_at: review.created_at,
 }
}

export function getReviewStats(reviews) {
 if (!reviews.length) return null
 const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0)
 return {
  count: reviews.length,
  average: Number((total / reviews.length).toFixed(1)),
 }
}

export async function fetchApprovedReviews(supabase, { limit = 6, productId = null } = {}) {
 let query = supabase
  .from('reviews')
  .select('id,name,rating,comment,created_at')
  .eq('is_approved', true)
  .order('created_at', { ascending: false })
  .limit(limit)

 if (productId !== null && productId !== undefined) query = query.eq('product_id', productId)

 const { data, error } = await query
 if (error) throw error
 return Array.isArray(data) ? data.map(normalizeReview) : []
}
