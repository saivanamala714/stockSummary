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
  };
  symbols: Array<{
    id: number;
    symbol: string;
    title: string;
  }>;
  sentiment?: {
    basic: string;
  };
}

export interface StockState {
  messages: StockMessage[];
  loading: boolean;
  error: string | null;
  symbol: string;
}

const initialState: StockState = {
  messages: [],
  loading: false,
  error: null,
  symbol: 'NVDA',
};

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    fetchTrendingMessagesStart: (state, action: PayloadAction<string>) => {
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
  fetchTrendingMessagesStart,
  fetchTrendingMessagesSuccess,
  fetchTrendingMessagesFailure,
} = stockSlice.actions;

export default stockSlice.reducer;
