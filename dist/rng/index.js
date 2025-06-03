"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = exports.intInRange = void 0;
const fortuna = require("javascript-fortuna");
fortuna.init();
/**
 * Generates a random integer in the range [min, max].
 * @param min
 * @param max
 */
function intInRange(min, max) {
    return min + Math.floor(fortuna.random() * (max - min + 1));
}
exports.intInRange = intInRange;
function random() {
    return fortuna.random();
}
exports.random = random;
