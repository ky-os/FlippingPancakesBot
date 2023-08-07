import fs from "fs";
import { promisify } from "util";
import { RoundData } from "./types";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const historyCache: { [key: string]: RoundData[] } = {};

const getHistoryName = (): string => {
  const date = new Date();
  const day = date.getDate();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const fullDate = `${year}${month}${day}`;
  return fullDate;
};

export const roundExists = (round: number, history?: RoundData[]): boolean => {
  const historyName = getHistoryName();
  const currentHistory = history || historyCache[historyName];
  return currentHistory?.some((data) => data.round === round) ?? false;
};

export const getRoundsHistory = async (
  fileName?: string
): Promise<RoundData[] | null> => {
  const historyName = fileName || getHistoryName();
  const path = `./history/${historyName}.json`;

  try {
    if (historyCache[historyName]) {
      return historyCache[historyName];
    }

    if (fs.existsSync(path)) {
      const historyData = await readFile(path, "utf8");
      const parsedData = JSON.parse(historyData);
      historyCache[historyName] = parsedData;
      return parsedData;
    }

    return null;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const upsertRoundHistory = async (data: RoundData): Promise<void> => {
  const roundData = data;
  const historyName = getHistoryName();
  const path = `./history/${historyName}.json`;

  try {
    if (historyCache[historyName]) {
      historyCache[historyName].push(roundData);
    } else {
      historyCache[historyName] = [roundData];
    }

    const mergedData = historyCache[historyName].reduce(
      (result: RoundData[], item: RoundData) => {
        const existingItem = result.find((r) => r.round === item.round);
        if (existingItem) {
          Object.assign(existingItem, item);
        } else {
          result.push(item);
        }
        return result;
      },
      []
    );

    const sortedData = mergedData.sort(
      (a, b) => Number(b.round) - Number(a.round)
    );

    await writeFile(path, JSON.stringify(sortedData), "utf8");
  } catch (err) {
    console.error(err);
  }
};
