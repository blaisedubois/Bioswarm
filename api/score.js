export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Placeholder for now
  return res.status(200).json({ status: 'success', message: 'API is working' });
}
