declare module 'yahoo-finance' {
  export interface HistoricalOptions {
    symbol: string;
    from: string;
    to: string;
    period?: 'd' | 'w' | 'm' | 'y';
  }

  export interface HistoricalData {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose?: number;
    symbol?: string;
  }

  export function historical(
    options: HistoricalOptions
  ): Promise<HistoricalData[]>;

  export default {
    historical,
  };
}
