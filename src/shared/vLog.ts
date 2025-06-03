let verbose = false;
export function setVerbose(v: boolean) {
  verbose = v;
}
export const v = {
  error: (...args: any[]) => { if(verbose) console.error(...args); },
  warn: (...args: any[]) => { if(verbose) console.warn(...args); },
  log: (...args: any[]) => { if(verbose) console.log(...args); },
}