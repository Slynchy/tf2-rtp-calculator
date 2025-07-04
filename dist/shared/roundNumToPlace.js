"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundNumToPlace = roundNumToPlace;
function roundNumToPlace(num, places) {
    if (places < 0) {
        throw new Error("Number of places must be non-negative");
    }
    const factor = Math.pow(10, places);
    return Math.round(num * factor) / factor;
}
