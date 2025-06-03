"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * sim-worker.ts
 * Simple worker thread for simulating crate openings in parallel.
 */
const worker_threads_1 = require("worker_threads");
const sim_1 = __importDefault(require("./sim"));
const { batchSize, crateData, iterations, weights, odds } = worker_threads_1.workerData;
(0, sim_1.default)(crateData, iterations, weights, odds, batchSize, worker_threads_1.parentPort);
worker_threads_1.parentPort.close();
