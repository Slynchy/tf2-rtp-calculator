# tf2-rtp-calculator

A command-line application for calculating RTP ('return-to-player') from unbox sessions in Team Fortress 2.

## Usage

### Command-Line Interface
```
Usage: tf2-rtp-calculator [options] <mode>

Calculates the RTP of TF2 crates and unusuals

Arguments:
  mode                          (`install` or `calculate`)

Options:
  -v, --verbose                 Enables additional logging
  -u, --update                  Same as running `install`, but also updates the data if it is older than 24hrs
  -s, --steam64Id <id>          Steam64 ID of the user to calculate RTP for
  --cacheFolderPath <dir>       Path to the cache folder (default: "./cache")
  --itemIdFrom <id>             The item ID from which to calculate RTP (i.e. the first item unboxed) (default: 0)
  --itemIdTo <id>               The item ID at which to stop calculating RTP (i.e. the last item unboxed) (default: 9007199254740991)
  --totalUnboxCost <id>         The total cost (in USD) of the unbox session, usually the combined cost of the crates + keys
  --skipCache                   If specified, the program will fetch the current inventory from Steam without using cache (default: false, don't skip cache)
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
   1. Or alternatively, you can provide the API key as a command-line argument using `-a your-api-key-here`
   1. You can obtain an API key from [backpack.tf](https://backpack.tf/api/docs)
1. Run `tf2-rtp-calculator install`
1. Find the item ID on backpack.tf of the first item you unboxed.
   1. (optional) Find the item ID of the last item you unboxed, if you want to limit the calculation to a specific range
1. Run the tool using the options above, for example:
   ```bash
   tf2-rtp-calculator calculate -s 76561197960287930 --itemIdFrom 1234567890 --itemIdTo 1234567899 --totalUnboxCost 100.00
   ```
   1. Remember: All currency is in USD! So convert from your local currency to USD before/after running the command.