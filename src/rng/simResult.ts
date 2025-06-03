export interface ISimResult {
  iterations: number;
  rtp: string;
  volatility: string;
  winsOver100x: number;
  largestWin: number;
  largestWinOdds: number;
  items: Record<string, { count: number; value: number; }>;
}