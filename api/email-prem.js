export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      status: false,
      code: 405,
      message: 'Method not allowed. Use GET.'
    });
  }

  const { email } = req.query;

  if (!email) {
    return res.status(400).json({
      status: false,
      code: 400,
      message: 'Parameter "email" is required.'
    });
  }

  try {
    // Proxy ke upstream tanpa memerlukan apikey dari client
    const target = `https://api.qsr.web.id/tools/email-prem?email=${encodeURIComponent(email)}&apikey=1`;
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'AlightMotion-Proxy/1.0',
        'Accept': 'application/json'
      }
    });

    const data = await response.json().catch(() => ({}));

    // Sama seperti vertif-prem: payload asli ada di "result", bukan "data".
    // Kalau upstream ternyata gak nested (langsung flat), fallback ke data itu sendiri.
    const result = (data.result && typeof data.result === 'object') ? data.result : data;
    const upstreamOk = response.ok && data.status === true;
    const succeeded = upstreamOk && (result.success !== false); // default true kalau gak ada field success eksplisit

    const statusCode = response.ok ? 200 : (response.status || 500);

    return res.status(statusCode).json({
      status: succeeded,
      code: succeeded ? 200 : (data.code ?? statusCode),
      success: succeeded,
      message: data.message || result.message || (succeeded ? 'Permintaan email verifikasi berhasil dikirim.' : 'Upstream error.'),
      data: succeeded ? result : null,
      email: email
    });
  } catch (err) {
    return res.status(502).json({
      status: false,
      code: 502,
      message: 'Failed to reach upstream server.',
      error: err.message
    });
  }
}
