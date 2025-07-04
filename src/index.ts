import 'dotenv/config';
import { Command, Option } from 'commander';
import { install } from "./modes/install";
import { setVerbose } from "./shared/vLog";
import { calculate } from "./modes/calculate";

const DEFAULT_RESPONSE_DATA_PATH = './data/response.json';
const DEFAULT_CURRENCY_DATA_PATH = './data/currency.json';
const DEFAULT_CACHE_FOLDER_PATH = './cache';
const DEFAULT_OUTPUT_DATA_PATH = '.';

type TMode = 'install' | 'simulate' | 'calculate' | null;

interface CLIArguments {
  update?: boolean;
  verbose?: boolean;

  apikey?: string;
  steam64Id: string;
  itemIdFrom: number;
  itemIdTo?: number;
  totalUnboxCost: number;
  cacheDataPath?: string;
  skipCache?: boolean;
  currencyDataPath: string;
  outputPath?: string;
  priceDataPath: string;
}

async function main(args: string | string[], opts: CLIArguments): Promise<void> {
  const mode: TMode = ((Array.isArray(args) ? args?.[0]?.toLowerCase() : args) || null) as TMode;
  if(
    (!mode)
  ) {
    program.help();
    return process.exit(1);
  }
  if (!opts || (!opts.apikey && (mode == 'install' || mode == 'calculate'))) {
    console.error('You must provide an API key using the --apikey option or the BACKPACK_TF_API_KEY environment variable.');
    return process.exit(2);
  }

  setVerbose(opts.verbose || false);
  console.log(`Starting TF2 RTP Calculator`);

  switch (mode) {
    case 'install':
      await install(
        opts.apikey as string,
        opts.currencyDataPath ?? DEFAULT_CURRENCY_DATA_PATH,
        opts.priceDataPath ?? DEFAULT_RESPONSE_DATA_PATH,
        opts.update
      );
      break;
    case 'calculate':
      if(opts.update) {
        await install(
          opts.apikey as string,
          opts.currencyDataPath ?? DEFAULT_CURRENCY_DATA_PATH,
          opts.priceDataPath ?? DEFAULT_RESPONSE_DATA_PATH,
          true, // always update
        );
      }

      await calculate(
        // opts.apikey as string,
        opts.steam64Id,
        opts.itemIdFrom,
        opts.totalUnboxCost,
        opts.itemIdTo ?? Number.MAX_SAFE_INTEGER,
        opts.currencyDataPath ?? DEFAULT_CURRENCY_DATA_PATH,
        opts.priceDataPath ?? DEFAULT_RESPONSE_DATA_PATH,
        opts.cacheDataPath ?? DEFAULT_CACHE_FOLDER_PATH,
        opts.skipCache ?? false,
      );
      break;
    default:
      console.error(`Unknown action: ${mode}`);
      program.help();
      process.exit(3);
  }
  return process.exit(0);
}

const program = new Command();
program
  .name('tf2-rtp-calculator')
  .description('Calculates the RTP of TF2 crates and unusuals');

program
  .argument('<mode>', '(`install` or `calculate`)');

/* boolean props */
program
  .option('-v, --verbose', 'Enables additional logging')
  .option('-u, --update', 'Same as running `install`, but also updates the data if it is older than 24hrs');

/* calculate props */
program
  .option('-s, --steam64Id <id>', 'Steam64 ID of the user to calculate RTP for')
  .option('--cacheFolderPath <dir>', 'Path to the cache folder', DEFAULT_CACHE_FOLDER_PATH)
  .option('--itemIdFrom <id>', 'The item ID from which to calculate RTP (i.e. the first item unboxed)', (val) => parseInt(val), 0)
  .option('--itemIdTo <id>', 'The item ID at which to stop calculating RTP (i.e. the last item unboxed)', (val) => parseInt(val), Number.MAX_SAFE_INTEGER)
  .option('--totalUnboxCost <id>', 'The total cost (in USD) of the unbox session, usually the combined cost of the crates + keys', (val) => parseFloat(val))
  .option('--skipCache', 'If specified, the program will fetch the current inventory from Steam without using cache (default: false, don\'t skip cache)');

/* install props */
program
  .option('-o, --outputPath <dir>', 'Destination path for simulation output', DEFAULT_OUTPUT_DATA_PATH)
  .option('-p, --priceDataPath <dir>', 'Path or destination of item price data JSON', DEFAULT_RESPONSE_DATA_PATH)
  .option('-c, --currencyDataPath <dir>', 'Path or destination of currency data JSON', DEFAULT_CURRENCY_DATA_PATH);

/* env variables */
program.addOption(
  new Option('-a, --apikey <key>', 'The API key for backpack.tf').env('BACKPACK_TF_API_KEY')
);

program
  .action(( args: string[], opts: CLIArguments ) => main(args,opts));

program
  .showHelpAfterError()
  .showSuggestionAfterError();

program
  .parseAsync()
  .catch((err) => {
    if(err) {
      console.error('An error occurred:', err.message || err);
      if (err.stack) {
        console.error(err.stack);
      }
    } else {
      console.error('An unknown error occurred.');
    }
  });