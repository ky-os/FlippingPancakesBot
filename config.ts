export default {
  AMOUNT_TO_BET: 0.02,        // Capital Amount
  BET_AMOUNT: 0.6,            // in USD
  DAILY_GOAL: 20,             // in USD,
  WAITING_TIME:  240000,       // in Miliseconds (4 Minutes)
  THRESHOLD: 65,              // Minimum % of certainty of signals (50 - 100)
  LOSS_STREAK_THRESHOLD: 5,   // Cooldown threshold trigger
  COOLDOWN_ROUNDS: 6,         // Number of rounds to wait after a loss streak
};
