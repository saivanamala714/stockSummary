import * as functions from 'firebase-functions';
import express from 'express';
import axios from 'axios';
import cors from 'cors';

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

// Simple stock price endpoint using Stooq daily CSV (no API key required)
// Returns latest close and last 10 days for a symbol
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const symbol = String(req.params.symbol || '').toLowerCase();
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
    const { data } = await axios.get(url, { responseType: 'text' });

    // Parse CSV: Date,Open,High,Low,Close,Volume
    const lines = String(data).trim().split(/\r?\n/);
    if (lines.length <= 1) {
      return res.status(502).json({ error: 'No data from provider' });
    }
    const rows = lines.slice(1) // skip header
      .map((line) => line.split(','))
      .filter((cols) => cols.length >= 6 && cols[0] && cols[4]);

    const parsed = rows.map((cols) => ({
      date: cols[0],
      open: Number(cols[1]),
      high: Number(cols[2]),
      low: Number(cols[3]),
      close: Number(cols[4]),
      volume: Number(cols[5]),
    }));

    if (parsed.length === 0) {
      return res.status(502).json({ error: 'Empty data from provider' });
    }

    const last10 = parsed.slice(-10);
    const latest = last10[last10.length - 1];

    return res.json({
      symbol: symbol.toUpperCase(),
      latest: {
        date: latest.date,
        close: latest.close,
      },
      history: last10.map((d) => ({ date: d.date, close: d.close })),
      source: 'stooq',
    });
  } catch (err: any) {
    console.error('Error fetching stock data:', err?.message || err);
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

export const api = functions.https.onRequest(app);
