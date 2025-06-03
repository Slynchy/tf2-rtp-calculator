"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v = exports.setVerbose = void 0;
let verbose = false;
function setVerbose(v) {
    verbose = v;
}
exports.setVerbose = setVerbose;
exports.v = {
    error: (...args) => { if (verbose)
        console.error(...args); },
    warn: (...args) => { if (verbose)
        console.warn(...args); },
    log: (...args) => { if (verbose)
        console.log(...args); },
};
