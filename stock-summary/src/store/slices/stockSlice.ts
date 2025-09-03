import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StockMessage {
  id: number;
  body: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    name: string;
    avatar_url: string;
    followers?: number;
    followers_count?: number;
  };
  entities?: {
    sentiment?: {
      basic?: string;
    };
  };
  symbols: Array<{
    id: number;
    symbol: string;
    title: string;
  }>;
  sentiment?: {
    basic: string;
  };
  // Engagement metrics
  likes?: any[];
  replies?: any[];
  reposts?: any[];
}

// List of top 100 tickers by market cap (as of 2023)
const TOP_100_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'LLY', 'AVGO',
  'V', 'JPM', 'WMT', 'UNH', 'MA', 'PG', 'JNJ', 'XOM', 'HD', 'CVX', 'MRK', 'ABBV',
  'PEP', 'COST', 'KO', 'PFE', 'MCD', 'ABT', 'TMO', 'DHR', 'ACN', 'CSCO', 'ADBE',
  'NFLX', 'NKE', 'VZ', 'CMCSA', 'DIS', 'WFC', 'TXN', 'PM', 'NEE', 'RTX', 'LIN',
  'HON', 'INTC', 'QCOM', 'IBM', 'LOW', 'UNP', 'AMGN', 'CAT', 'BA', 'GS', 'SBUX',
  'PLD', 'T', 'AMD', 'UBER', 'INTU', 'SPGI', 'NOW', 'ISRG', 'BLK', 'MDT', 'AMT',
  'DE', 'LMT', 'ADP', 'AXP', 'BKNG', 'SYK', 'ADI', 'GILD', 'C', 'VRTX', 'REGN',
  'PGR', 'ELV', 'TGT', 'LRCX', 'PANW', 'SCHW', 'MDLZ', 'AMAT', 'CB', 'ZTS', 'BSX',
  'MO', 'CI', 'MMC', 'SNPS', 'ADSK', 'CME', 'KLAC', 'TMUS', 'APD', 'MU', 'TFC',
  'HUM', 'DUK', 'SO', 'NOC', 'CCI', 'SHW', 'MCO', 'ICE', 'BDX', 'SLB', 'CL', 'FISV'
];

export interface StockState {
  messages: StockMessage[];
  loading: boolean;
  error: string | null;
  symbol: string;
  availableTickers: string[];
  searchQuery: string;
}

const initialState: StockState = {
  messages: [],
  loading: false,
  error: null,
  symbol: 'NVDA',
  availableTickers: TOP_100_TICKERS,
  searchQuery: '',
};

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setSymbol(state, action: PayloadAction<string>) {
      state.symbol = action.payload;
    },
    fetchTrendingMessagesStart(state, action: PayloadAction<string>) {
      state.loading = true;
      state.error = null;
      state.symbol = action.payload;
    },
    fetchTrendingMessagesSuccess: (state, action: PayloadAction<StockMessage[]>) => {
      state.loading = false;
      state.messages = action.payload;
      state.error = null;
    },
    fetchTrendingMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  setSearchQuery,
  setSymbol,
  fetchTrendingMessagesStart,
  fetchTrendingMessagesSuccess,
  fetchTrendingMessagesFailure,
} = stockSlice.actions;

export default stockSlice.reducer;
