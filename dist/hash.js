"use strict";
/**
 * Hashing functions for a TF2 unbox.
 * Hashes and unhashes into a 32-bit integer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.unhash = exports.hash = void 0;
/* ----- bit positions & masks ----- */
const HAT_SHIFT = 0, HAT_MASK = 0xff << HAT_SHIFT;
const STR_SHIFT = 8, STR_MASK = 1 << STR_SHIFT;
const UNUS_SHIFT = 9, UNUS_MASK = 1 << UNUS_SHIFT;
const FX_SHIFT = 10, FX_MASK = 0xff << FX_SHIFT;
/* ----- functions ----- */
/**
 * Hashes the given hat flags into a 32-bit integer.
 * @param hatIndex The index of the hat inside the crate.
 * @param isStrange 1 if strange, 0 if not strange.
 * @param isUnusual 1 if unusual, 0 if not unusual.
 * @param unusualEffectIndex The index of the unusual effect inside the crate.
 */
function hash(hatIndex, isStrange, isUnusual, unusualEffectIndex) {
    let v = ((hatIndex & 0xff) << HAT_SHIFT) |
        ((isStrange & 1) << STR_SHIFT) |
        ((isUnusual & 1) << UNUS_SHIFT) |
        ((unusualEffectIndex & 0xff) << FX_SHIFT);
    return v >>> 0; // force Uint32
}
exports.hash = hash;
/**
 * Unhashes the given 32-bit integer into hat flags.
 * @param v The hashed value to unhash.
 */
function unhash(v) {
    const hatIndex = (v & HAT_MASK) >>> HAT_SHIFT;
    const isStrange = ((v & STR_MASK) >>> STR_SHIFT);
    const isUnusual = ((v & UNUS_MASK) >>> UNUS_SHIFT);
    const flags = { hatIndex, isStrange, isUnusual };
    flags.unusualEffectIndex = (v & FX_MASK) >>> FX_SHIFT;
    return flags;
}
exports.unhash = unhash;
