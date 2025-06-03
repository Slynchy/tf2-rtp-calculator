/**
 * sim-worker.ts
 * Simple worker thread for simulating crate openings in parallel.
 */
import { parentPort, workerData } from "worker_threads";
import sim from "./sim";

const { batchSize, crateData, iterations, weights, odds } = workerData;
sim(crateData, iterations, weights, odds, batchSize, parentPort);
parentPort!.close();