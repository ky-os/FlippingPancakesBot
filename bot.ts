import util from "util";
import { weightedAverage, getBNBPrice, getStats } from "./lib";
import {
  TradingViewScan,
  SCREENERS_ENUM,
  EXCHANGES_ENUM,
  INTERVALS_ENUM,
} from "trading-view-recommends-parser-nodejs";
import {
  betDown,
  betUp,
  checkBalance,
  claimReward,
  getBalance,
  getRoundData,
  listenTo,
  withdrawToMainAcc,
} from "./initContract";
import { roundExists, upsertRoundHistory } from "./historyCRUD";
import CONFIG from "./config";

const sleep = util.promisify(setTimeout);

// Check Signals
const getSignals = async (): Promise<any> => {
  const resultMin = await new TradingViewScan(
    SCREENERS_ENUM["crypto"],
    EXCHANGES_ENUM["BINANCE"],
    "BNBUSDT",
    INTERVALS_ENUM["1m"]
  ).analyze();
  const resultMed = await new TradingViewScan(
    SCREENERS_ENUM["crypto"],
    EXCHANGES_ENUM["BINANCE"],
    "BNBUSDT",
    INTERVALS_ENUM["5m"]
  ).analyze();

  const minRecomendation = JSON.parse(JSON.stringify(resultMin.summary));
  const medRecomendation = JSON.parse(JSON.stringify(resultMed.summary));

  if (minRecomendation && medRecomendation) {
    const averageBuy =
      (parseInt(minRecomendation.BUY) + parseInt(medRecomendation.BUY)) / 2;
    const averageSell =
      (parseInt(minRecomendation.SELL) + parseInt(medRecomendation.SELL)) / 2;
    const averageNeutral =
      (parseInt(minRecomendation.NEUTRAL) +
        parseInt(medRecomendation.NEUTRAL)) /
      2;

    return {
      buy: averageBuy,
      sell: averageSell,
      neutral: averageNeutral,
    };
  } else {
    return false;
  }
};

// Strategy of betting
const strategy = async (props: {
  minAcurracy: number;
  onBetUp: (props: { buyPercentage: number }) => void;
  onBetDown: (props: { sellPercentage: number }) => void;
}): Promise<void> => {
  const signals = await getSignals();

  if (signals) {
    const buyPercentage = weightedAverage(signals.buy, signals.sell);
    const sellPercentage = weightedAverage(signals.sell, signals.buy);

    if (signals.buy > signals.sell && buyPercentage > props.minAcurracy) {
      props.onBetUp({ buyPercentage });
    } else if (
      signals.sell > signals.buy &&
      sellPercentage > props.minAcurracy
    ) {
      props.onBetDown({ sellPercentage });
    } else {
      const lowPercentage = Math.min(buyPercentage, sellPercentage);
      console.log("Waiting for next round ⏳", lowPercentage + "%");
    }
  } else {
    console.log("❌ Error obtaining signals");
  }
};

const bet = async (props: {
  betAmount: number;
  epoch: number;
  onSuccess?: Function;
}) => {
  const earnings = await getStats();

  if (earnings.profit_USD >= CONFIG.DAILY_GOAL) {
    const withdrawalAmount = earnings.profit_USD * 0.15;
    try {
      await withdrawToMainAcc(withdrawalAmount);
      console.log("💸 Successfully withdrew to main account");
    } catch (error: any) {
      console.log("❌ Error in withdrawing to main account:", error.reason);
    }
    console.log("🧞 Daily goal reached. Shuting down... ✨");
    process.exit();
  }

  await strategy({
    minAcurracy: CONFIG.THRESHOLD,
    onBetUp: async ({ buyPercentage }) => {
      console.log(
        `#${props.epoch.toString()} 🔮 Prediction: UP 🟢 ${buyPercentage}%`
      );
      try {
        await betUp(props.betAmount, props.epoch);
        await upsertRoundHistory({
          round: Number(props.epoch),
          betAmount: props.betAmount,
          bet: "bull",
        });
        props.onSuccess?.();
      } catch (error: any) {
        console.log("❌ Error in betting UP", error.reason);
      }
    },
    onBetDown: async ({ sellPercentage }) => {
      console.log(
        `#${props.epoch.toString()} 🔮 Prediction: DOWN 🔴 ${sellPercentage}%`
      );
      try {
        await betDown(props.betAmount, props.epoch);
        await upsertRoundHistory({
          round: Number(props.epoch),
          betAmount: props.betAmount,
          bet: "bear",
        });
        props.onSuccess?.();
      } catch (error: any) {
        console.log("❌ Error in betting DOWN", error.reason);
      }
    },
  });
};

// Check balance
checkBalance(CONFIG.AMOUNT_TO_BET);
console.log("🤗 Welcome! Waiting for next round...");

let cooldownRounds = 0;
let successBets = 0;

// Betting
listenTo("StartRound", async (epoch: number) => {
  console.log("🥞 Starting round: #" + epoch.toString());
  console.log(
    "🕑 Waiting " + (CONFIG.WAITING_TIME / 60000).toFixed(1) + " minutes"
  );
  if (cooldownRounds > 0) {
    console.log(
      `⏳ Cooldown in progress. Remaining cooldown rounds: ${cooldownRounds}`
    );
    cooldownRounds--;
  } else {
    await sleep(CONFIG.WAITING_TIME);
    await bet({
      epoch,
      betAmount: CONFIG.BET_AMOUNT / (await getBNBPrice()),
      onSuccess: () => {
        successBets++;
      },
    });
  }
});

// Show stats
listenTo("EndRound", async (epoch: number) => {
  console.log("✅ Round ended: #" + epoch.toString());

  if (roundExists(Number(epoch))) {
    const roundData = await getRoundData(epoch);
    await upsertRoundHistory({ round: Number(epoch), ...roundData });
  }

  const stats = await getStats();
  console.log("--------------------------------");
  console.log(`💰 Balance: ${await getBalance()} BNB`);
  console.log(`🍀 Fortune: ${stats.percentage}`);
  console.log(`👍 ${stats.win}|${stats.loss} 👎 `);
  console.log(`💰 Profit: ${stats.profit_USD.toFixed(3)} USD`);
  console.log(`🔥 Win Streak: ${stats.winStreak}`);
  console.log(`💔 Loss Streak: ${stats.lossStreak}`);
  console.log(`📜 Unclaimed Rounds: ${stats.unclaimedRounds.count}`);
  console.log("--------------------------------");

  if (stats.lossStreak >= CONFIG.LOSS_STREAK_THRESHOLD) {
    console.log(`⏳ Cooldown initiated.`);
    cooldownRounds = CONFIG.COOLDOWN_ROUNDS;
  }

  const { rounds } = stats.unclaimedRounds;

  if (successBets >= 10 && rounds.length > 0) {
    await claimReward(stats.unclaimedRounds.rounds);
    successBets = 0;
  }
});
