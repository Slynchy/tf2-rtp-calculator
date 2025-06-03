import fortuna = require("javascript-fortuna");
fortuna.init();

/**
 * Generates a random integer in the range [min, max].
 * @param min
 * @param max
 */
export function intInRange(min: number, max: number): number {
  return min + Math.floor(fortuna.random() * (max - min + 1));
}

export function random(): number {
  return fortuna.random();
}