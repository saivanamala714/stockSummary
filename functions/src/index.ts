import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Proxy for StockTwits trending messages
app.get('/api/trending_messages/symbol/:symbol.json', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { filter = 'all', limit = '100' } = req.query as { filter?: string; limit?: string };

    const url = `https://api.stocktwits.com/api/2/trending_messages/symbol/${encodeURIComponent(
      symbol
    )}.json?filter=${encodeURIComponent(filter)}&limit=${encodeURIComponent(limit)}`;

    const response = await axios.get(url, {
      headers: {
        accept: 'application/json',
        origin: 'https://stocktwits.com',
        referer: 'https://stocktwits.com/',
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    res.status(response.status).json(response.data);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: 'StockTwits proxy error' };
    res.status(status).json(data);
  }
});

export const api = functions.https.onRequest(app);
