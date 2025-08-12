// Proxy API requests to StockTwits during development to avoid CORS
// CRA loads this file automatically when running `npm start`.

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/stocktwits',
    createProxyMiddleware({
      target: 'https://api.stocktwits.com',
      changeOrigin: true,
      pathRewrite: {
        '^/stocktwits': '',
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('accept', 'application/json');
        proxyReq.setHeader('origin', 'https://stocktwits.com');
        proxyReq.setHeader('referer', 'https://stocktwits.com/');
        proxyReq.setHeader(
          'user-agent',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
        );
      },
    })
  );
};
