const AGENT_ID = 'agent_b89bd2dbb018ae6c2644e7b69d';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/create-call') {
      try {
        const response = await fetch('https://api.retellai.com/v2/create-web-call', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RETELL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ agent_id: AGENT_ID }),
        });

        if (!response.ok) {
          const err = await response.text();
          return new Response(JSON.stringify({ error: err }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const data = await response.json();
        return new Response(JSON.stringify({ access_token: data.access_token }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Interner Fehler' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

const HTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AK-Assistance — Demo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 460px;
      width: 90%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    .logo {
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 24px;
    }

    h1 {
      font-size: 26px;
      font-weight: 700;
      color: #111;
      line-height: 1.3;
      margin-bottom: 12px;
    }

    p {
      font-size: 15px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 36px;
    }

    #btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 16px 36px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }

    #btn:hover { background: #333; }
    #btn:active { transform: scale(0.97); }
    #btn:disabled { background: #ccc; cursor: not-allowed; }

    .pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse 1.2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }

    #status {
      margin-top: 20px;
      font-size: 14px;
      color: #888;
      min-height: 20px;
    }

    #status.error { color: #ef4444; }

    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #bbb;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">AK-Assistance</div>
    <h1>Sprechen Sie direkt mit unserem KI-Assistenten</h1>
    <p>Testen Sie, wie unser Assistent Ihre Kundenanrufe entgegennimmt — einfach auf den Button klicken und lossprechen.</p>

    <button id="btn">
      <span id="btn-icon">&#128222;</span>
      <span id="btn-label">Gespr&#228;ch starten</span>
    </button>

    <div id="status"></div>

    <div class="footer">Gespr&#228;ch wird verschl&#252;sselt &#252;bertragen &nbsp;&bull;&nbsp; Demo-Version</div>
  </div>

  <script type="module">
    import { RetellWebClient } from 'https://esm.sh/retell-client-js-sdk@latest';

    const client = new RetellWebClient();
    const btn = document.getElementById('btn');
    const statusEl = document.getElementById('status');
    let active = false;

    function setStatus(msg, isError = false) {
      statusEl.textContent = msg;
      statusEl.className = isError ? 'error' : '';
    }

    client.on('call_started', () => {
      setStatus('Verbunden — sprechen Sie jetzt');
      btn.innerHTML = '<span class="pulse"></span><span>Gespräch beenden</span>';
      active = true;
    });

    client.on('call_ended', () => {
      setStatus('Gespräch beendet');
      btn.disabled = false;
      btn.innerHTML = '&#128222; Neues Gespräch starten';
      active = false;
    });

    client.on('error', (err) => {
      console.error(err);
      setStatus('Fehler: ' + (err?.message || 'Verbindung unterbrochen'), true);
      btn.disabled = false;
      btn.innerHTML = '&#128222; Erneut versuchen';
      active = false;
    });

    btn.addEventListener('click', async () => {
      if (active) {
        client.stopCall();
        return;
      }

      btn.disabled = true;
      setStatus('Verbinde...');

      try {
        const res = await fetch('/create-call', { method: 'POST' });
        if (!res.ok) throw new Error('Server-Fehler ' + res.status);
        const { access_token, error } = await res.json();
        if (error) throw new Error(error);

        await client.startCall({ accessToken: access_token });
      } catch (err) {
        console.error(err);
        setStatus('Verbindung fehlgeschlagen: ' + err.message, true);
        btn.disabled = false;
        btn.innerHTML = '&#128222; Erneut versuchen';
      }
    });
  </script>
</body>
</html>`;
