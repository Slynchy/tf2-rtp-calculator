import { TF2Crate } from "../interfaces/crateData";
/**
 * This isn't used at runtime, but is used for making the `crates.json` file more easily
 * Can just stringify this object and write it to a file to recreate `crates.json`
 */
export declare const TF2Crates: Record<string, TF2Crate>;
