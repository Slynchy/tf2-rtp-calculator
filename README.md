# tf2-rtp-calculator

A command-line application for simulating mass unboxing in Team Fortress 2 for the purposes of approximating RTP (return-to-player) and other related data.

## Usage

### Command-Line Interface
```
Usage: tf2-rtp-calculator <mode> [options] 

Calculates the RTP of TF2 crates and unusuals

Arguments:
  mode                          (`install` or `simulate`)
Options:
  -v, --verbose                 Enables additional logging
  -u, --update                  Same as --install, but also updates the data if it is older than 24hrs
  -b, --batchSize <amount>      The amount of simulations per thread before emitting output (default: 256)
  --offload <amount>            Number of cores to offload to (default: -1, all cores) (default: -1)
  -n, --crateName <string>      Name of crate to simulate
  -i, --iterations <amount>     Amount of iterations/unboxes to simulate
  -d, --crateDataPath <dir>     Path to the key-value JSON file of crates (default: "./data/crates.json")
  -o, --outputPath <dir>        Destination path for simulation output (default: ".")
  -p, --priceDataPath <dir>     Path or destination of item price data JSON (default: "./data/response.json")
  -c, --currencyDataPath <dir>  Path or destination of currency data JSON (default: "./data/currency.json")
  -a, --apikey <key>            The API key for backpack.tf (env: BACKPACK_TF_API_KEY)
  -h, --help                    display help for command
```

### Step-By-Step Guide

1. Install the application from npm: `npm install -g tf2-rtp-calculator`
1. Create a `.env` file in the root directory with the following content:
   ```env
   BACKPACK_TF_API_KEY=your_api_key_here
   ```
   1. You can obtain an API key from [backpack.tf](https://backpack.tf/api/docs)
1. Run `npm run install-data`
1. Ensure the crate you wish to simulate is available in the `./data/crates.json` file. 
   1. If it is not, you can add it manually in `./data/crate.json`
   1. The number values conform to enumerators defined in `./src/tf2/enums/*`
1. Run the application with the desired mode and options. 
   1. For example, this will simulate unboxing 10,000 times for "Ghoulish Gains Case":
      ```bash
      tf2-rtp-calculator simulate -n "Ghoulish Gains Crate" -i 10000
      ```
