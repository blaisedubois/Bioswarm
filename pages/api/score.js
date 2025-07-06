import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  // ✅ Allow any origin (or customize as needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Log request method & body early for debugging
  console.log('Incoming request:', req.method, req.body);

  // ✅ Handle GET
  if (req.method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('leaderboard')
      .select('telegram_id, username, profile_photo, score, wallet_address')
      .eq('date', today)
      .order('score', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database fetch error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ status: 'error', message: 'Database fetch error' });
    }

    return res.status(200).json({ status: 'success', data });
  }

  // ✅ Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // ✅ Extract and parse
  let { telegram_id, username, profile_photo, score, wallet_address } = req.body;

  // ✅ Parse score to integer (force conversion)
  score = parseInt(score, 10);

  // ✅ Log cleaned input
  console.log('Parsed POST data:', {
    telegram_id,
    username,
    profile_photo,
    score,
    wallet_address
  });

  // ✅ Validate required fields (allow 0 score)
  if (
    !telegram_id ||
    !username ||
    isNaN(score)
  ) {
    console.error('Validation failed: Missing or invalid fields', req.body);
    return res.status(400).json({ status: 'error', message: 'Missing or invalid fields' });
  }

  const today = new Date().toISOString().slice(0, 10);

  // ✅ Check if existing record for today
  const { data: existing, error: fetchError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('telegram_id', String(telegram_id))
    .eq('date', today)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Database fetch error:', JSON.stringify(fetchError, null, 2));
    return res.status(500).json({ status: 'error', message: 'Database fetch error' });
  }

  // ✅ Insert if none exists
  if (!existing) {
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert([
        {
          telegram_id,
          username,
          profile_photo,
          score,
          date: today,
          wallet_address: wallet_address || null,
        }
      ]);

    if (insertError) {
      console.error('Database insert error:', JSON.stringify(insertError, null, 2));
      return res.status(500).json({ status: 'error', message: 'Database insert error' });
    }

    console.log('Inserted new score');
    return res.status(200).json({ status: 'success', message: 'New score inserted' });
  }

  // ✅ Update if higher
  if (score > existing.score) {
    const { error: updateError } = await supabase
      .from('leaderboard')
      .update({
        score,
        username,
        profile_photo,
        wallet_address: wallet_address || existing.wallet_address,
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Database update error:', JSON.stringify(updateError, null, 2));
      return res.status(500).json({ status: 'error', message: 'Database update error' });
    }

    console.log('Updated score');
    return res.status(200).json({ status: 'success', message: 'Score updated' });
  }

  // ✅ No update needed
  console.log('Score not higher — no update');
  return res.status(200).json({ status: 'success', message: 'Score not updated (not higher)' });
}
