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

  // Upstream (lihat modul asli vertif-prem.js) butuh DUA parameter: email + link.
  // Terima "link" atau "url" dari client supaya kompatibel sama frontend lama.
  const { email, link, url } = req.query;
  const verifyLink = link || url;

  if (!email || !verifyLink) {
    return res.status(400).json({
      status: false,
      code: 400,
      message: 'Parameter "email" dan "link" (atau "url") wajib diisi.'
    });
  }

  try {
    // Proxy ke upstream tanpa memerlukan apikey dari client
    const target = `https://api.qsr.web.id/tools/vertif-prem?email=${encodeURIComponent(email)}&link=${encodeURIComponent(verifyLink)}&apikey=1`;
    const response = await fetch(target, {
      method: 'GET',
      headers: {
        'User-Agent': 'AlightMotion-Proxy/1.0',
        'Accept': 'application/json'
      }
    });

    const data = await response.json().catch(() => ({}));

    // Payload asli ada di dalam "result", bukan "data.data".
    // "status" di top-level cuma nandain request-nya sukses dihit ke upstream
    // (mis. apikey valid, param lengkap) — hasil verifikasi ASLI ada di result.success.
    // Kalau upstream gagal duluan (apikey invalid / param kurang), field errornya "error", bukan "message".
    const result = (data.result && typeof data.result === 'object') ? data.result : {};
    const upstreamOk = response.ok && data.status === true;
    const verified = upstreamOk && result.success === true;

    const statusCode = response.ok ? 200 : (response.status || 500);

    return res.status(statusCode).json({
      status: verified,
      code: verified ? 200 : (data.code ?? statusCode),
      success: verified,
      message: data.error || data.message
        || (verified
          ? 'Verifikasi berhasil. Premium aktif.'
          : (upstreamOk
            ? 'URL verifikasi tidak valid, kedaluwarsa, atau belum diklik.'
            : 'Upstream error.')),
      data: verified ? result : null
    });
  } catch (err) {
    return res.status(502).json({
      status: false,
      code: 502,
      message: 'Failed to reach upstream verification server.',
      error: err.message
    });
  }
}
