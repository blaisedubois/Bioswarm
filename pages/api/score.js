import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Vary', 'Origin');


  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('leaderboard')
      .select('telegram_id, username, profile_photo, score, wallet_address')
      .eq('date', today)
      .order('score', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Database fetch error:', error);
      return res.status(500).json({ status: 'error', message: 'Database fetch error' });
    }

    return res.status(200).json({ status: 'success', data });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { telegram_id, username, profile_photo, score, wallet_address } = req.body;
  if (!telegram_id || !username || !profile_photo || !score) {
    return res.status(400).json({ status: 'error', message: 'Missing fields' });
  }

  const today = new Date().toISOString().slice(0, 10);

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
      console.error('Database insert error:', insertError);
      return res.status(500).json({ status: 'error', message: 'Database insert error' });
    }

    return res.status(200).json({ status: 'success', message: 'New score inserted' });
  }

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
      console.error('Database update error:', updateError);
      return res.status(500).json({ status: 'error', message: 'Database update error' });
    }

    return res.status(200).json({ status: 'success', message: 'Score updated' });
  }

  return res.status(200).json({ status: 'success', message: 'Score not updated (not higher)' });
}
