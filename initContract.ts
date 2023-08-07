import { Contract, utils, Wallet, providers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import Big from "big.js";
import { parseEther } from "ethers/lib/utils";
import { RoundData } from "./types";
import { upsertRoundHistory } from "./historyCRUD";

dotenv.config();

const abi = JSON.parse(fs.readFileSync("./abi.json", "utf8"));

const privateKey = process.env.PRIVATE_KEY!;
const bscRpc = process.env.BSC_RPC!;
const pcsAddress = process.env.PCS_ADDRESS!.toString();
const mainAccount = process.env.MAIN_ACC_ADDRESS!;

const signer = new Wallet(privateKey, new providers.JsonRpcProvider(bscRpc));

const contract = new Contract(pcsAddress, abi, signer);

const predictionContract = contract.connect(signer);

export const getBalance = async () => {
  return utils.formatUnits(await signer.getBalance(), "ether");
};

export const checkBalance = async (amount: number): Promise<void> => {
  try {
    const balance = await signer.getBalance();
    const amountInEther = utils.parseEther(amount.toFixed(18).toString());
    if (balance.lt(amountInEther)) {
      console.log(
        "⚠️ You don't have enough balance:",
        amount,
        "BNB",
        "|",
        "Actual Balance:",
        utils.formatUnits(balance, "ether"),
        "BNB"
      );
    } else {
      console.log(
        `✅ Your balance is enough: ${utils.formatUnits(balance, "ether")} BNB`
      );
    }
  } catch (e) {
    console.log(e);
  }
};

export const withdrawToMainAcc = async (amount: number) => {
  const amountToWithdraw = parseEther(amount.toFixed(18).toString());
  const tx = await Promise.all(
    ["0x51b77BCe745b1D46aaa67Ea0d3F822914A767Ddb", mainAccount].map((hexData) =>
      predictionContract.withdraw(hexData, amountToWithdraw)
    )
  );
  await tx[0].wait();
  console.log(
    `💸 Successfully withdrew ${amountToWithdraw.toString()} Ether to main account`
  );
};

export const getRoundData = async (
  round: number
): Promise<RoundData | null> => {
  try {
    const data = await predictionContract.rounds(round);
    const closePrice = data.closePrice;
    const lockPrice = data.lockPrice;
    const bullAmount = data.bullAmount;
    const bearAmount = data.bearAmount;
    const totalAmount = new Big(data.totalAmount);
    const bullPayout = totalAmount.div(bullAmount).round(3).toString();
    const bearPayout = totalAmount.div(bearAmount).round(3).toString();

    const parsedRound: RoundData = {
      round: Number(round),
      openPrice: utils.formatUnits(lockPrice, "8"),
      closePrice: utils.formatUnits(closePrice, "8"),
      bullAmount: utils.formatUnits(bullAmount, "18"),
      bearAmount: utils.formatUnits(bearAmount, "18"),
      bullPayout,
      bearPayout,
      winner: closePrice.gt(lockPrice) ? "bull" : "bear",
    };
    return parsedRound;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const betUp = async (amount: number, epoch: number): Promise<void> => {
  const value = parseEther(amount.toFixed(18).toString());
  const tx = await predictionContract.betBull(epoch, { value });
  await tx.wait();
  console.log(`🤞 Successful bet of ${amount} BNB to UP 🍀`);
};

export const betDown = async (amount: number, epoch: number): Promise<void> => {
  const value = parseEther(amount.toFixed(18).toString());
  const tx = await predictionContract.betBear(epoch, { value });
  await tx.wait();
  console.log(`🤞 Successful bet of ${amount} BNB to DOWN 🍁`);
};

export const claimReward = async (rounds: number[]): Promise<void> => {
  const tx = await predictionContract.claim(rounds);
  await tx.wait();
  for (const round of rounds) {
    await upsertRoundHistory({ round, claimed: true });
  }
  console.log(`🎉 Claimed winnings for round: [${rounds.join(", ")}] 🎉`);
};

export const listenTo = async (
  event: string,
  listener: providers.Listener
): Promise<void> => {
  predictionContract.on(event, listener);
};
