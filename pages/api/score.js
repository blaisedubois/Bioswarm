import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  // ✅ Always set these CORS headers for EVERY request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // ✅ Parse body
  const { telegram_id, username, profile_photo, score } = req.body;
  if (!telegram_id || !username || !profile_photo || !score) {
    return res.status(400).json({ status: 'error', message: 'Missing fields' });
  }

  const today = new Date().toISOString().slice(0, 10);

  // ✅ Fetch existing
  const { data: existing, error: fetchError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('telegram_id', String(telegram_id))
    .eq('date', today)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Database fetch error:', fetchError);
    return res.status(500).json({ status: 'error', message: 'Database fetch error' });
  }

  // ✅ If no existing row, insert
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
        }
      ]);

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ status: 'error', message: 'Database insert error' });
    }

    return res.status(200).json({ status: 'success', message: 'New score inserted' });
  }

  // ✅ If score is higher, update
  if (score > existing.score) {
    const { error: updateError } = await supabase
      .from('leaderboard')
      .update({ score, username, profile_photo })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({ status: 'error', message: 'Database update error' });
    }

    return res.status(200).json({ status: 'success', message: 'Score updated' });
  }

  // ✅ If score not higher, do nothing
  return res.status(200).json({ status: 'success', message: 'Score not updated (not higher)' });
}
