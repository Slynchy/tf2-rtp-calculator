import 'dotenv/config';
import { Command, Option } from 'commander';
import { install } from "./modes/install";
import { simulate } from "./modes/simulate";
import { setVerbose } from "./shared/vLog";

const DEFAULT_RESPONSE_DATA_PATH = './data/response.json';
const DEFAULT_CURRENCY_DATA_PATH = './data/currency.json';
const DEFAULT_CRATE_DATA_PATH = './data/crates.json';
const DEFAULT_OUTPUT_DATA_PATH = '.';

interface CLIArguments {
  update?: boolean;
  verbose?: boolean;

  batchSize?: number;
  offload?: number;
  iterations: number;

  apikey?: string;
  crateName: string;
  crateDataPath: string;
  currencyDataPath: string;
  outputPath?: string;
  priceDataPath: string;
}

async function main(args: string | string[], opts: CLIArguments): Promise<void> {
  const mode = (Array.isArray(args) ? args?.[0]?.toLowerCase() : args) || '';
  if(
    (!mode)
  ) {
    program.help();
    return process.exit(1);
  }
  if (!opts || (!opts.apikey && mode == 'install')) {
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
    case 'simulate':
      await simulate(
        opts.iterations,
        opts.crateName,
        opts.offload,
        opts.crateDataPath,
        opts.priceDataPath,
        opts.currencyDataPath,
        opts.batchSize,
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
  .argument('<mode>', '(`install` or `simulate`)');

/* boolean props */
program
  .option('-v, --verbose', 'Enables additional logging')
  .option('-u, --update', 'Same as --install, but also updates the data if it is older than 24hrs')
  .option('-b, --batchSize <amount>', 'The amount of simulations per thread before emitting output (default: 256)');

/* install props */
program
  .option('--offload <amount>', 'Number of cores to offload to (all cores)', (val) => parseInt(val), -1);

/* simulation props */
program
  .option('-n, --crateName <string>', 'Name of crate to simulate')
  .option('-i, --iterations <amount>', 'Amount of iterations/unboxes to simulate', (val) => parseInt(val))
  .option('-d, --crateDataPath <dir>', 'Path to the key-value JSON file of crates', DEFAULT_CRATE_DATA_PATH)
  .option('-o, --outputPath <dir>', 'Destination path for simulation output', DEFAULT_OUTPUT_DATA_PATH)
  .option('-p, --priceDataPath <dir>', 'Path or destination of item price data JSON', DEFAULT_RESPONSE_DATA_PATH)
  .option('-c, --currencyDataPath <dir>', 'Path or destination of currency data JSON', DEFAULT_CURRENCY_DATA_PATH);

/* env variables */
program.addOption(
  new Option('-a, --apikey <key>', 'The API key for backpack.tf').env('BACKPACK_TF_API_KEY')
);

// program
//   .addHelpText('after', `
// Examples:
//   $ .
//   $ .
//
// Notes:
//   asdf
// `);

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