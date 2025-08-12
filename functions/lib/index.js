"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});
// Proxy for StockTwits trending messages
app.get('/api/trending_messages/symbol/:symbol.json', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { filter = 'all', limit = '100' } = req.query;
        const url = `https://api.stocktwits.com/api/2/trending_messages/symbol/${encodeURIComponent(symbol)}.json?filter=${encodeURIComponent(filter)}&limit=${encodeURIComponent(limit)}`;
        const response = await axios_1.default.get(url, {
            headers: {
                accept: 'application/json',
                origin: 'https://stocktwits.com',
                referer: 'https://stocktwits.com/',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            },
            timeout: 10000,
        });
        res.status(response.status).json(response.data);
    }
    catch (err) {
        const status = err?.response?.status || 500;
        const data = err?.response?.data || { error: 'StockTwits proxy error' };
        res.status(status).json(data);
    }
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map