import type { TF2Crate } from "../tf2/interfaces/crateData";
import type { TF2Odds } from "../tf2/odds";
import { intInRange, random } from "./index";
import { MessagePort } from "node:worker_threads";
import { hash } from "../hash";

const DEFAULT_BATCH_SIZE = 256;

export default function sim(
  crateData: TF2Crate,
  iterations: number,
  crateWeights: number[],
  odds: typeof TF2Odds,
  inputBatchSize: number = DEFAULT_BATCH_SIZE,
  parentPort?: null | MessagePort,
): void {
  if(!parentPort) {
    throw new Error("Parent port is required for worker communication.");
  }
  const totalWeight = crateWeights.reduce((a, b) => a + b, 0);
  const itemKeys = Object.keys(crateData.items);
  const batchSize = Math.min(iterations, inputBatchSize);
  let batch = new Array(batchSize);
  let batchCounter = 0;
  for(let i = 0; i < iterations; i++) {
    batch[batchCounter] = tick(crateData, crateWeights, odds, totalWeight, itemKeys);
    if(batchCounter === batchSize - 1) {
      parentPort.postMessage({
        size: batchSize,
        batch: batch
      });
      batch = new Array(batchSize);
      batchCounter = 0;
    } else {
      batchCounter++;
    }
  }
  if(batchCounter > 0) {
    parentPort.postMessage({
      size: batchCounter,
      batch: batch
    });
  }
  return;
}

function tick(
  crateData: TF2Crate,
  crateWeights: number[],
  odds: typeof TF2Odds,
  totalWeight: number,
  itemKeys: string[],
): number {
  // Simulate opening a crate
  let hatIndex = 0;
  let hatWeight = 0;
  let rngWeight = intInRange(0, totalWeight-1);
  while(hatIndex < crateWeights.length) {
    hatWeight += crateWeights[hatIndex];
    if(hatWeight > rngWeight) {
      break;
    }
    hatIndex++;
  }

  const isStrange = random() <= odds.uncrateStrangeChance ? 1 : 0;
  const isUnusual = !crateData.unusualItems[itemKeys[hatIndex]] ? 0 : random() <= odds.uncrateUnusualChance ? 1 : 0;
  const unusualEffect = isUnusual ? intInRange(0, crateData.effects.length-1) : 0;

  return hash(hatIndex, isStrange, isUnusual, unusualEffect);
}