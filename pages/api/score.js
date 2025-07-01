import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { telegram_id, username, profile_photo, score } = req.body;

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

console.log('Fetched existing:', existing);
  if (!existing) {
    // No entry yet today — insert new row
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert([
        {
          telegram_id,
          username,
          profile_photo,
          score,
          date: today
        }
      ]);

 if (insertError) {
  console.error('Database insert error:', insertError);
  return res.status(500).json({ status: 'error', message: 'Database insert error' });
}


    return res.status(200).json({ status: 'success', message: 'New score inserted' });
  } else if (score > existing.score) {
    // Existing entry but new score is higher — update it
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

  // New score is lower or equal — no update
  return res.status(200).json({ status: 'success', message: 'Score not updated (lower or equal)' });
}
