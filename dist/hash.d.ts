/**
 * Hashing functions for a TF2 unbox.
 * Hashes and unhashes into a 32-bit integer.
 */
interface HatFlags {
    hatIndex: number;
    isStrange: 0 | 1;
    isUnusual: 0 | 1;
    unusualEffectIndex?: number;
}
/**
 * Hashes the given hat flags into a 32-bit integer.
 * @param hatIndex The index of the hat inside the crate.
 * @param isStrange 1 if strange, 0 if not strange.
 * @param isUnusual 1 if unusual, 0 if not unusual.
 * @param unusualEffectIndex The index of the unusual effect inside the crate.
 */
export declare function hash(hatIndex: number, isStrange: 0 | 1, isUnusual: 0 | 1, unusualEffectIndex: number): number;
/**
 * Unhashes the given 32-bit integer into hat flags.
 * @param v The hashed value to unhash.
 */
export declare function unhash(v: number): HatFlags;
export {};
