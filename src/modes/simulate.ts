import { CurrenciesResponse, PricesResponse } from "../tf2/backpack-tf";
import fs from "fs";
import os from "node:os";
import { v } from "../shared/vLog";
import { Presets, SingleBar } from "cli-progress";
import { TF2Odds } from "../tf2/odds";
import { TF2Grades } from "../tf2/enums/tf2Grades";
import { hash, unhash } from "../hash";
import path from "node:path";
import { clearInterval } from "node:timers";
import { Worker } from "node:worker_threads";
import { ETF2UnusualEffects } from "../tf2/enums/unusualEffects";
import { ITF2ItemPriceData } from "../tf2/interfaces/itemPriceData";
import { EItemQuality } from "../shared/enums/itemQuality";
import { TF2Crate } from "../tf2/interfaces/crateData";
import { ISimResult } from "../rng/simResult";

function calculateVolatility(results: number[]): {mean: number, stdev: number} {
  const n = results.length;
  const mean = results.reduce((a, x) => a + x, 0) / n;

  const varSum = results.reduce((a, x) => a + (x - mean) ** 2, 0);
  const variance = varSum / n;            // population variance
  return { mean, stdev: Math.sqrt(variance) };
}

export async function simulate(
  iterations: number,
  crateId: string,
  threads: number = -1,
  crateDataPath: string,
  priceDataPath?: string,
  currencyDataPath?: string,
  inputBatchSize?: number,
): Promise<void> {
  /* init and setup */
  if(iterations <= 0) {
    console.error('Iterations must be greater than 0');
    return;
  }
  const priceData: PricesResponse = JSON.parse(fs.readFileSync(priceDataPath ?? `${__dirname}/output.json`, 'utf-8'));
  if(!priceData) {
    console.error('No price data found. Please run the install command first.');
    return;
  }
  const currencyResponse: CurrenciesResponse = JSON.parse(fs.readFileSync(currencyDataPath ?? `${__dirname}/data/currency_data.json`, 'utf-8'));
  if(!currencyResponse) {
    console.error('No currency data found. Please run the install command first.');
    return;
  }
  if(!threads || threads <= 0) {
    threads = os.cpus().length; // leave one core free for the main thread
    if(threads <= 0) {
      threads = 1;
    }
  }
  const crateData: TF2Crate = JSON.parse(fs.readFileSync(
    crateDataPath,
    'utf-8'
  ))?.[crateId];
  if(!crateData) {
    console.error(`Crate ${crateId} not found. The data file may be missing or the crate ID is incorrect.`);
    return;
  }

  console.log(`Simulating ${iterations} crate openings...`);

  /* prepare the data for simulation */
  const slice = Math.floor(iterations / threads);
  const odds = TF2Odds;
  const keys = Object.keys(crateData.items);
  const weights =
    Object.values(crateData.items)
      .map((grade: TF2Grades) => Math.floor(odds.uncrateGradeChance[grade] * 1000));

  /* Setup progress bar */
  v.log(`Using ${threads} threads for simulating ${slice} iterations per thread.`);
  const bar = new SingleBar({ hideCursor: true }, Presets.shades_classic);
  bar.start(iterations, 0);

  let rawOutput: Record<number, number> = {};
  for(let h = 0; h < keys.length; h++) {
    // Unique
    rawOutput[hash(h, 0, 0, 0)] = 0;
    // Strange
    rawOutput[hash(h, 1, 0, 0)] = 0;
    for(let i = 0; i < crateData.effects.length; i++) {
      // Unusual
      rawOutput[hash(h, 0, 1, i,)] = 0;
      // Strange Unusual
      rawOutput[hash(h, 1, 1, i,)] = 0;
    }
  }

  /* Actual simulation happens here */
  let progress = 0;
  const startTime = Date.now();
  const workers: Worker[] = [];
  await new Promise<void>((resolve) => {
    const workerPath = path.resolve(__dirname + '/../rng', "simWorker.js"); // compiled JS file
    let interval = setInterval(() => {
      bar.update(progress);
    }, 1000);
    const func = (res: { size: number; batch: number[] }) => {
      progress += res.size;
      res.batch.forEach((e) => (rawOutput[e]++));
      if (progress >= iterations) {
        clearInterval(interval);
        bar.update(progress);
        resolve();
      }
    };
    for (let i = 0; i < threads; ++i) {
      const iter = i === threads - 1 ? iterations - slice * i : slice;
      const w = new Worker(workerPath, {
        workerData: { batchSize: inputBatchSize, crateData, iterations: iter, weights, odds: TF2Odds }
      });
      w.on("message", func);
      w.on("error", console.error);
      workers.push(w);
    }
  });

  /* Cleanup and finish sim flow */
  bar.stop();
  workers.forEach((w, index) => {
    w.terminate();
    workers[index] = null as unknown as Worker; // clear the worker reference
    v.log(`Worker ${index + 1} terminated.`);
  });
  console.log(`Finished simulating ${iterations} crate openings in ${
    new Date(
      Date.now() - startTime
    ).toISOString().substr(11, 8) + '.' + (Date.now() - startTime) % 1000
  }`);

  /* prepare to collate the results with the values */
  const keyValueInUSD = 2.49;
  const results: ISimResult = {
    rtp: '',
    iterations: iterations,
    largestWin: 0,
    largestWinOdds: 0,
    volatility: '',
    winsOver100x: 0,
    items: {},
  };

  const rawOutputKeys = Object.keys(rawOutput);
  bar.start(rawOutputKeys.length, 0);
  for(let i = 0; i < rawOutputKeys.length; i++) {
    const key: number = rawOutputKeys[i] as unknown as number;
    const unhashed = unhash(key);

    const hat = keys[unhashed.hatIndex];
    const isStrange = unhashed.isStrange === 1;
    const isUnusual = unhashed.isUnusual === 1;
    const effectIndex = isUnusual ? unhashed.unusualEffectIndex : undefined;
    const effect: ETF2UnusualEffects =
      isUnusual &&
      typeof effectIndex !== "undefined" ?
        crateData.effects[effectIndex] :
        undefined as unknown as ETF2UnusualEffects;
    const uniquePriceData: ITF2ItemPriceData = (
      priceData.response.items[hat].prices[EItemQuality.Unique].Tradable.Craftable as ITF2ItemPriceData[]
    )[0];
    const strangePriceData: ITF2ItemPriceData = (
      priceData.response.items[hat].prices[EItemQuality.Strange].Tradable.Craftable as ITF2ItemPriceData[]
    )[0];
    const unusualPriceData: Record<Partial<ETF2UnusualEffects>, ITF2ItemPriceData> | undefined = (
      priceData.response.items[hat].prices[EItemQuality.Unusual]?.Tradable?.Craftable as Record<Partial<ETF2UnusualEffects>, ITF2ItemPriceData>
    );

    if(!isStrange && !isUnusual) {
      // unique
      const usdValue = uniquePriceData.value_raw * priceData.response.raw_usd_value;
      results.items[hat] = {
        count: rawOutput[key],
        value: usdValue * rawOutput[key],
      };
      if(usdValue >= keyValueInUSD * 100) {
        results.winsOver100x += rawOutput[key];
      }
      if(rawOutput[key] > 0 && (usdValue > results.largestWin || (
        usdValue === results.largestWin && rawOutput[key] > results.largestWinOdds
      ))) {
        results.largestWin = usdValue;
        results.largestWinOdds = rawOutput[key];
      }
    } else if (isStrange && !isUnusual) {
      // strange
      const usdValue = strangePriceData.value_raw * priceData.response.raw_usd_value;
      results.items['Strange ' + hat] = {
        count: rawOutput[key],
        value: usdValue * rawOutput[key],
      }
      if(usdValue >= keyValueInUSD * 100) {
        results.winsOver100x += rawOutput[key];
      }
      if(rawOutput[key] > 0 && (usdValue > results.largestWin || (
        usdValue === results.largestWin && rawOutput[key] > results.largestWinOdds
      ))) {
        results.largestWin = usdValue;
        results.largestWinOdds = rawOutput[key];
      }
    } else if (isUnusual) {
      const unusualAverages: Record<number, number> = {};
      const resultKey = `Unusual ${isStrange ? 'Strange ' : ''}${ETF2UnusualEffects[effect as any]} ${hat}`;
      if(!unusualPriceData?.[effect]) {
        if(!unusualAverages[effect]) {
          unusualAverages[effect] =
            Object.values(unusualPriceData || {}).reduce((acc, data) => {
              return acc + (data.value_raw);
            }, 0) / (Object.keys(unusualPriceData || {}).length || 1);
        }
      }
      const usdValue = (
        unusualPriceData?.[effect]?.value_raw ??
        unusualAverages[effect]
      ) * priceData.response.raw_usd_value;
      if(usdValue >= keyValueInUSD * 100) {
        results.winsOver100x += rawOutput[key];
      }
      if(rawOutput[key] > 0 && (usdValue > results.largestWin || (
        usdValue === results.largestWin && rawOutput[key] > results.largestWinOdds
      ))) {
        results.largestWin = usdValue;
        results.largestWinOdds = rawOutput[key];
      }
      if(results.items[resultKey]) {
        results.items[resultKey].count += rawOutput[key];
        results.items[resultKey].value += usdValue * rawOutput[key];
      } else {
        results.items[resultKey] = {
          count: rawOutput[key],
          value: usdValue * rawOutput[key],
        }
      }

    }
    bar.update(i);
  }
  bar.update(rawOutputKeys.length);

  // calculate rtp (mean of all items divided by iterations)
  // const rtp = ((Object.values(results.items).reduce((acc, item) => {
  //   return acc + item.value;
  // }, 0) / (iterations * keyValueInUSD) ));

  // calculate volatility + rtp
  const volatilityRtp =
    calculateVolatility(
      Object.values(results.items)
        .filter((item) => item.count > 0 && item.value > 0)
        .map((item) => item.value / item.count)
    );
  results.volatility = (volatilityRtp.stdev / volatilityRtp.mean).toFixed(4);
  results.rtp = (volatilityRtp.mean * 100).toFixed(4);

  const outputName = `${crateId}-${iterations}-${Math.floor(Date.now() / 1000)}.json`;
  const outputPath = path.resolve('.', outputName);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  bar.stop();
}