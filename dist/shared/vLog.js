"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.v = void 0;
exports.setVerbose = setVerbose;
let verbose = false;
function setVerbose(v) {
    verbose = v;
}
exports.v = {
    error: (...args) => { if (verbose)
        console.error(...args); },
    warn: (...args) => { if (verbose)
        console.warn(...args); },
    log: (...args) => { if (verbose)
        console.log(...args); },
};
