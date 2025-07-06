import { supabase } from '../../supabaseClient';

export default async function handler(req, res) {
  // ✅ Allow any origin (or customize as needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Log incoming request method and raw body for debugging
  console.log('Incoming request (method, raw body):', req.method, JSON.stringify(req.body, null, 2));

  // ✅ Handle GET requests (for leaderboard data)
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

  // ✅ Only allow POST requests for score submission
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // ✅ Extract and parse data from the request body
  // Set default values here if the properties are missing or empty in req.body
  let { telegram_id, username, profile_photo, score, wallet_address } = req.body;

  // Handle username: if not provided or empty, default to 'Anonymous'
  // This ensures 'username' is always a string and not null/undefined for Supabase
  username = username || 'Anonymous';

  // Handle profile_photo: if not provided or empty, default to null
  // This aligns with your decision to not send it from Construct 3
  profile_photo = profile_photo || null;

  // Parse score to an integer (force conversion)
  score = parseInt(score, 10);

  // ✅ Log cleaned and defaulted input for debugging
  console.log('Parsed POST data (with defaults):', {
    telegram_id,
    username,       // This will now be 'Anonymous' if originally empty/undefined
    profile_photo,  // This will be null if not sent by Construct 3
    score,
    wallet_address
  });

  // ✅ Validate required fields (telegram_id and score are mandatory)
  // Removed `!username` from this validation as it's now handled by defaulting
  if (
    !telegram_id ||
    isNaN(score) // Checks if score is a valid number
  ) {
    console.error('Validation failed: Missing or invalid fields', {
      telegram_id,
      username, // Include these in the error log for better debugging
      score
    });
    return res.status(400).json({ status: 'error', message: 'Missing or invalid fields' });
  }

  const today = new Date().toISOString().slice(0, 10);

  // ✅ Check if an existing record for this telegram_id and date already exists
  const { data: existing, error: fetchError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('telegram_id', String(telegram_id)) // Ensure telegram_id is treated as a string for comparison
    .eq('date', today)
    .maybeSingle(); // Use maybeSingle to get one record or null

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means "no rows found", which is not an error here
    console.error('Database fetch error:', JSON.stringify(fetchError, null, 2));
    return res.status(500).json({ status: 'error', message: 'Database fetch error' });
  }

  // ✅ If no existing record, insert a new one
  if (!existing) {
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert([
        {
          telegram_id,
          username, // Use the processed username
          profile_photo, // Use the processed profile_photo
          score,
          date: today,
          wallet_address: wallet_address || null, // Ensure wallet_address is null if not provided
        }
      ]);

    if (insertError) {
      console.error('Database insert error:', JSON.stringify(insertError, null, 2));
      return res.status(500).json({ status: 'error', message: 'Database insert error' });
    }

    console.log('Inserted new score record.');
    return res.status(200).json({ status: 'success', message: 'New score inserted' });
  }

  // ✅ If an existing record is found, update it only if the new score is higher
  if (score > existing.score) {
    const { error: updateError } = await supabase
      .from('leaderboard')
      .update({
        score,
        username, // Update username as well, in case it changed or was provided
        profile_photo, // Update profile_photo
        wallet_address: wallet_address || existing.wallet_address, // Update wallet, or keep existing if new one is null
      })
      .eq('id', existing.id); // Update by primary key

    if (updateError) {
      console.error('Database update error:', JSON.stringify(updateError, null, 2));
      return res.status(500).json({ status: 'error', message: 'Database update error' });
    }

    console.log('Updated existing score record (new score was higher).');
    return res.status(200).json({ status: 'success', message: 'Score updated' });
  }

  // ✅ If the new score is not higher than the existing one, no update is needed
  console.log('Score not higher — no update needed for existing record.');
  return res.status(200).json({ status: 'success', message: 'Score not updated (not higher)' });
}