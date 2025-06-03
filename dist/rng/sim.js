"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const hash_1 = require("../hash");
const DEFAULT_BATCH_SIZE = 256;
function sim(crateData, iterations, crateWeights, odds, inputBatchSize = DEFAULT_BATCH_SIZE, parentPort) {
    if (!parentPort) {
        throw new Error("Parent port is required for worker communication.");
    }
    const totalWeight = crateWeights.reduce((a, b) => a + b, 0);
    const itemKeys = Object.keys(crateData.items);
    const batchSize = Math.min(iterations, inputBatchSize);
    let batch = new Array(batchSize);
    let batchCounter = 0;
    for (let i = 0; i < iterations; i++) {
        batch[batchCounter] = tick(crateData, crateWeights, odds, totalWeight, itemKeys);
        if (batchCounter === batchSize - 1) {
            parentPort.postMessage({
                size: batchSize,
                batch: batch
            });
            batch = new Array(batchSize);
            batchCounter = 0;
        }
        else {
            batchCounter++;
        }
    }
    if (batchCounter > 0) {
        parentPort.postMessage({
            size: batchCounter,
            batch: batch
        });
    }
    return;
}
exports.default = sim;
function tick(crateData, crateWeights, odds, totalWeight, itemKeys) {
    // Simulate opening a crate
    let hatIndex = 0;
    let hatWeight = 0;
    let rngWeight = (0, index_1.intInRange)(0, totalWeight - 1);
    while (hatIndex < crateWeights.length) {
        hatWeight += crateWeights[hatIndex];
        if (hatWeight > rngWeight) {
            break;
        }
        hatIndex++;
    }
    const isStrange = (0, index_1.random)() <= odds.uncrateStrangeChance ? 1 : 0;
    const isUnusual = !crateData.unusualItems[itemKeys[hatIndex]] ? 0 : (0, index_1.random)() <= odds.uncrateUnusualChance ? 1 : 0;
    const unusualEffect = isUnusual ? (0, index_1.intInRange)(0, crateData.effects.length - 1) : 0;
    return (0, hash_1.hash)(hatIndex, isStrange, isUnusual, unusualEffect);
}
