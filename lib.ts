import _ from "lodash";
import fetch from "cross-fetch";
import { getRoundsHistory } from "./historyCRUD";

export const PercentageChange = (a: number, b: number): number => {
  return ((b - a) * 100) / a;
};

export const weightedAverage = (a: number, b: number): number => {
  return (100 * a) / (a + b);
};

const getBNBPrice = async (): Promise<number> => {
  const apiUrl = "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT";
  try {
    const res = await fetch(apiUrl);
    if (res.status >= 400) {
      throw new Error("Bad response from server");
    }
    const price = await res.json();
    return parseFloat(price.price);
  } catch (err) {
    console.error("Unable to connect to Binance API", err);
    return 0;
  }
};

const getStats = async () => {
  const history = (await getRoundsHistory()) || [];
  const BNBPrice = await getBNBPrice();
  let totalEarnings = 0;
  let win = 0;
  let loss = 0;
  let winStreak = 0;
  let lossStreak = 0;
  let unclaimedRounds: { count: number; rounds: number[] } = {
    count: 0,
    rounds: [],
  };

  history.sort((a, b) => a.round - b.round);

  for (const round of history) {
    const {
      betAmount,
      bet,
      winner,
      bullPayout,
      bearPayout,
      claimed,
      round: roundNumber,
    } = round;

    if (betAmount && bet && winner) {
      const payoutMultiplier =
        winner === "bull"
          ? parseFloat(bullPayout || "0")
          : parseFloat(bearPayout || "0");

      if (bet === winner) {
        win++;
        winStreak++;
        lossStreak = 0;
        const roundEarnings = betAmount * payoutMultiplier - betAmount;
        totalEarnings += roundEarnings;

        if (!claimed) {
          unclaimedRounds.count++;
          unclaimedRounds.rounds.push(roundNumber);
        }
      } else {
        loss++;
        lossStreak++;
        winStreak = 0;
        totalEarnings -= betAmount;
      }
    }
  }

  return {
    profit_USD: totalEarnings * BNBPrice,
    profit_BNB: totalEarnings,
    percentage: `${-PercentageChange(win + loss, loss)}%`,
    win,
    loss,
    winStreak,
    lossStreak,
    unclaimedRounds,
  };
};

export { getStats, getBNBPrice };
