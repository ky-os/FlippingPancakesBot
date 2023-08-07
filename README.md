![Cover Image](assets/cover.png)

# FlippingPancakesBot

## Support the Project

If you would like to support the project, you can make a cryptocurrency donation to the following wallet addresses:

![BSC Address](https://img.shields.io/badge/bsc-address?style=for-the-badge&logo=binance&label=0xfF606670cc6496349A21C314B25afA218d30D173&color=%23F0B90B)

Your contributions will help keep this project active and further its development. Thank you for your support! 🙌

## Overview

Meet Flipping Pancakes Bot, a TypeScript-based betting genius for PancakeSwap Prediction. Predicting (BNBUSD) value fluctuations, it strategically places bets for daily profit goals. Automated profit transfers and seamless winning bet collection included. Elevate your prediction game now! 🥞🤖

**Disclaimer:** Cryptocurrency trading involves substantial risk and may not be suitable for everyone. The bot's predictions are not guaranteed, and you should exercise extreme caution and perform extensive research before making any investment decisions. Failure to do so may result in significant financial loss, emotional distress, and the summoning of ancient dark forces. Use this bot at your own peril. ⚠️

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Strategy](#strategy)
- [Betting](#betting)
- [Statistics and Rewards](#statistics-and-rewards)
- [License](#license)

## Installation

To set up the Flipping Pancakes Bot, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/ky-os/FlippingPancakesBot.git
cd FlippingPancakesBot
```

2. Install the required dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory of the project and add the following environmental variables:

```plaintext
PRIVATE_KEY="YOUR_PRIVATE_KEY"
PCS_ADDRESS=0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA
MAIN_ACC_ADDRESS="YOUR_MAIN_ACCOUNT_ADDRESS"
BSC_RPC=https://bsc.publicnode.com
```

Make sure to replace `YOUR_PRIVATE_KEY` with your actual private key. The `MAIN_ACC_ADDRESS` should be a Binance Smart Chain address and will serve as the safekeeping of 15% of the profit once the profit goal is reached.

## Usage

To run the Flipping Pancakes Bot, use the following command:

```bash
npm start
```

This will start the bot and it will begin placing bets based on the configured strategy.

### Configuration

Before running the bot, you need to configure it by setting the necessary parameters such as the daily goal, betting amount, threshold, and other settings. You can find the configuration file at [config.ts](config.ts). Edit this file according to your preferences.

### Strategy

The betting strategy of the bot involves predicting whether the cryptocurrency price will go up or down after 5 minutes. The `strategy` function takes a `minAcurracy` threshold and places bets based on prediction signals.

### Betting

To start the betting process, the bot listens for the "StartRound" event and places bets when the waiting timer is completed. The `bet` function takes the betting amount and epoch number and places bets using the `betUp` or `betDown` functions based on the prediction results.

### Statistics and Rewards

The bot collects statistics on successful and unsuccessful bets, win streaks, loss streaks, and unclaimed rounds. It prints out the statistics and checks for cooldown conditions and unclaimed rewards when the "EndRound" event is triggered.

## License

This project is licensed under the [MIT License](LICENSE). 📝