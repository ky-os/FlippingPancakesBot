export interface RoundData {
    betAmount?: number;
    bet?: "bull" | "bear";
    round: number;
    openPrice?: string;
    closePrice?: string;
    bullAmount?: string;
    bearAmount?: string;
    bullPayout?: string;
    bearPayout?: string;
    winner?: string;
    claimed?: boolean;
  }