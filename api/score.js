export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

const { telegram_id, username, profile_photo, score } = req.body;

if (!telegram_id || !username || !profile_photo || !score) {
  return res.status(400).json({ status: 'error', message: 'Missing fields' });
}

return res.status(200).json({ status: 'success', message: 'Received fields' });
