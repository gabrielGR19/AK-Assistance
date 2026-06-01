require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const AGENT_ID = 'agent_b89bd2dbb018ae6c2644e7b69d';
const PORT = 3030;

app.post('/create-call', async (req, res) => {
  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: AGENT_ID }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    res.json({ access_token: data.access_token });
  } catch (err) {
    console.error('Retell API Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

app.listen(PORT, () => {
  console.log(`Demo-Server läuft auf http://localhost:${PORT}`);
});
