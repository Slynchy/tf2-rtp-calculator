"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulate = void 0;
const fs_1 = __importDefault(require("fs"));
const node_os_1 = __importDefault(require("node:os"));
const vLog_1 = require("../shared/vLog");
const cli_progress_1 = require("cli-progress");
const odds_1 = require("../tf2/odds");
const hash_1 = require("../hash");
const node_path_1 = __importDefault(require("node:path"));
const node_timers_1 = require("node:timers");
const node_worker_threads_1 = require("node:worker_threads");
const unusualEffects_1 = require("../tf2/enums/unusualEffects");
const itemQuality_1 = require("../shared/enums/itemQuality");
function calculateVolatility(results) {
    const n = results.length;
    const mean = results.reduce((a, x) => a + x, 0) / n;
    const varSum = results.reduce((a, x) => a + (x - mean) ** 2, 0);
    const variance = varSum / n; // population variance
    return { mean, stdev: Math.sqrt(variance) };
}
async function simulate(iterations, crateId, threads = -1, crateDataPath, priceDataPath, currencyDataPath, inputBatchSize) {
    /* init and setup */
    if (iterations <= 0) {
        console.error('Iterations must be greater than 0');
        return;
    }
    const priceData = JSON.parse(fs_1.default.readFileSync(priceDataPath ?? `${__dirname}/output.json`, 'utf-8'));
    if (!priceData) {
        console.error('No price data found. Please run the install command first.');
        return;
    }
    const currencyResponse = JSON.parse(fs_1.default.readFileSync(currencyDataPath ?? `${__dirname}/data/currency_data.json`, 'utf-8'));
    if (!currencyResponse) {
        console.error('No currency data found. Please run the install command first.');
        return;
    }
    if (!threads || threads <= 0) {
        threads = node_os_1.default.cpus().length; // leave one core free for the main thread
        if (threads <= 0) {
            threads = 1;
        }
    }
    const crateData = JSON.parse(fs_1.default.readFileSync(crateDataPath, 'utf-8'))?.[crateId];
    if (!crateData) {
        console.error(`Crate ${crateId} not found. The data file may be missing or the crate ID is incorrect.`);
        return;
    }
    console.log(`Simulating ${iterations} crate openings...`);
    /* prepare the data for simulation */
    const slice = Math.floor(iterations / threads);
    const odds = odds_1.TF2Odds;
    const keys = Object.keys(crateData.items);
    const weights = Object.values(crateData.items)
        .map((grade) => Math.floor(odds.uncrateGradeChance[grade] * 1000));
    /* Setup progress bar */
    vLog_1.v.log(`Using ${threads} threads for simulating ${slice} iterations per thread.`);
    const bar = new cli_progress_1.SingleBar({ hideCursor: true }, cli_progress_1.Presets.shades_classic);
    bar.start(iterations, 0);
    let rawOutput = {};
    for (let h = 0; h < keys.length; h++) {
        // Unique
        rawOutput[(0, hash_1.hash)(h, 0, 0, 0)] = 0;
        // Strange
        rawOutput[(0, hash_1.hash)(h, 1, 0, 0)] = 0;
        for (let i = 0; i < crateData.effects.length; i++) {
            // Unusual
            rawOutput[(0, hash_1.hash)(h, 0, 1, i)] = 0;
            // Strange Unusual
            rawOutput[(0, hash_1.hash)(h, 1, 1, i)] = 0;
        }
    }
    /* Actual simulation happens here */
    let progress = 0;
    const startTime = Date.now();
    const workers = [];
    await new Promise((resolve) => {
        const workerPath = node_path_1.default.resolve(__dirname + '/../rng', "simWorker.js"); // compiled JS file
        let interval = setInterval(() => {
            bar.update(progress);
        }, 1000);
        const func = (res) => {
            progress += res.size;
            res.batch.forEach((e) => (rawOutput[e]++));
            if (progress >= iterations) {
                (0, node_timers_1.clearInterval)(interval);
                bar.update(progress);
                resolve();
            }
        };
        for (let i = 0; i < threads; ++i) {
            const iter = i === threads - 1 ? iterations - slice * i : slice;
            const w = new node_worker_threads_1.Worker(workerPath, {
                workerData: { batchSize: inputBatchSize, crateData, iterations: iter, weights, odds: odds_1.TF2Odds }
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
        workers[index] = null; // clear the worker reference
        vLog_1.v.log(`Worker ${index + 1} terminated.`);
    });
    console.log(`Finished simulating ${iterations} crate openings in ${new Date(Date.now() - startTime).toISOString().substr(11, 8) + '.' + (Date.now() - startTime) % 1000}`);
    /* prepare to collate the results with the values */
    const keyValueInUSD = 2.49;
    const results = {
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
    for (let i = 0; i < rawOutputKeys.length; i++) {
        const key = rawOutputKeys[i];
        const unhashed = (0, hash_1.unhash)(key);
        const hat = keys[unhashed.hatIndex];
        const isStrange = unhashed.isStrange === 1;
        const isUnusual = unhashed.isUnusual === 1;
        const effectIndex = isUnusual ? unhashed.unusualEffectIndex : undefined;
        const effect = isUnusual &&
            typeof effectIndex !== "undefined" ?
            crateData.effects[effectIndex] :
            undefined;
        const uniquePriceData = priceData.response.items[hat].prices[itemQuality_1.EItemQuality.Unique].Tradable.Craftable[0];
        const strangePriceData = priceData.response.items[hat].prices[itemQuality_1.EItemQuality.Strange].Tradable.Craftable[0];
        const unusualPriceData = priceData.response.items[hat].prices[itemQuality_1.EItemQuality.Unusual]?.Tradable?.Craftable;
        if (!isStrange && !isUnusual) {
            // unique
            const usdValue = uniquePriceData.value_raw * priceData.response.raw_usd_value;
            results.items[hat] = {
                count: rawOutput[key],
                value: usdValue * rawOutput[key],
            };
            if (usdValue >= keyValueInUSD * 100) {
                results.winsOver100x += rawOutput[key];
            }
            if (rawOutput[key] > 0 && (usdValue > results.largestWin || (usdValue === results.largestWin && rawOutput[key] > results.largestWinOdds))) {
                results.largestWin = usdValue;
                results.largestWinOdds = rawOutput[key];
            }
        }
        else if (isStrange && !isUnusual) {
            // strange
            const usdValue = strangePriceData.value_raw * priceData.response.raw_usd_value;
            results.items['Strange ' + hat] = {
                count: rawOutput[key],
                value: usdValue * rawOutput[key],
            };
            if (usdValue >= keyValueInUSD * 100) {
                results.winsOver100x += rawOutput[key];
            }
            if (rawOutput[key] > 0 && (usdValue > results.largestWin || (usdValue === results.largestWin && rawOutput[key] > results.largestWinOdds))) {
                results.largestWin = usdValue;
                results.largestWinOdds = rawOutput[key];
            }
        }
        else if (isUnusual) {
            const unusualAverages = {};
            const resultKey = `Unusual ${isStrange ? 'Strange ' : ''}${unusualEffects_1.ETF2UnusualEffects[effect]} ${hat}`;
            if (!unusualPriceData?.[effect]) {
                if (!unusualAverages[effect]) {
                    unusualAverages[effect] =
                        Object.values(unusualPriceData || {}).reduce((acc, data) => {
                            return acc + (data.value_raw);
                        }, 0) / (Object.keys(unusualPriceData || {}).length || 1);
                }
            }
            const usdValue = (unusualPriceData?.[effect]?.value_raw ??
                unusualAverages[effect]) * priceData.response.raw_usd_value;
            if (usdValue >= keyValueInUSD * 100) {
                results.winsOver100x += rawOutput[key];
            }
            if (rawOutput[key] > 0 && (usdValue > results.largestWin || (usdValue === results.largestWin && rawOutput[key] > results.largestWinOdds))) {
                results.largestWin = usdValue;
                results.largestWinOdds = rawOutput[key];
            }
            if (results.items[resultKey]) {
                results.items[resultKey].count += rawOutput[key];
                results.items[resultKey].value += usdValue * rawOutput[key];
            }
            else {
                results.items[resultKey] = {
                    count: rawOutput[key],
                    value: usdValue * rawOutput[key],
                };
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
    const volatilityRtp = calculateVolatility(Object.values(results.items)
        .filter((item) => item.count > 0 && item.value > 0)
        .map((item) => item.value / item.count));
    results.volatility = (volatilityRtp.stdev / volatilityRtp.mean).toFixed(4);
    results.rtp = (volatilityRtp.mean * 100).toFixed(4);
    const outputName = `${crateId}-${iterations}-${Math.floor(Date.now() / 1000)}.json`;
    const outputPath = node_path_1.default.resolve('.', outputName);
    fs_1.default.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    bar.stop();
}
exports.simulate = simulate;
