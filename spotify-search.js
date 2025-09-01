export default async function handler(req, res) {
  const q = req.query.q || '';
  if (!q) return res.status(400).json({ error: 'Missing q' });

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Missing Spotify credentials' });
  }

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    const { access_token } = await tokenRes.json();

    const sRes = await fetch(
      'https://api.spotify.com/v1/search?type=track&limit=15&q=' + encodeURIComponent(q),
      { headers: { 'Authorization': 'Bearer ' + access_token } }
    );
    const sJson = await sRes.json();
    const items = (sJson.tracks && sJson.tracks.items) || [];
    const out = items.map(t => ({
      title: t.name,
      artist: (t.artists || []).map(a => a.name).join(', '),
      platform: 'spotify',
      id: t.id,
      url: 'https://open.spotify.com/track/' + t.id
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Spotify failed' });
  }
}
