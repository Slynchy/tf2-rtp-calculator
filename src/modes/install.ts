import * as fs from "node:fs";
import { v } from "../shared/vLog";
import { BackpackTF, CurrenciesResponse, PricesResponse } from "../tf2/backpack-tf";
import path from "node:path";
import { parser } from 'stream-json';

const defaultTimeoutTime = 2000;
let timeoutTime = defaultTimeoutTime;
const lastModifiedTime = 24 * 60 * 60 * 1000; // 1 day in milliseconds

async function readTimestamp(path: string): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(path, { encoding: 'utf8' });
    const jsonParser = parser();

    jsonParser.on('data', (data: { key: string, value: any }) => {
      if (data.key === 'timestamp') {
        resolve(data.value);
        stream.destroy();      // stop reading the file
        jsonParser.destroy();  // stop parsing
      }
    });
    jsonParser.on('end', () => {
      resolve(undefined); // if no timestamp found, resolve with undefined
    });

    jsonParser.on('error', reject);
    stream.on('error', reject);
    stream.pipe(jsonParser);
  });
}

export async function install(
  apiKey: string,
  currencyDataPath: string,
  priceDataPath: string,
  update: boolean = false,
) {
  currencyDataPath = path.resolve(currencyDataPath);
  priceDataPath = path.resolve(priceDataPath);
  // check if output folder exists, if not create it
  if(!fs.existsSync(path.dirname(priceDataPath))) {
    fs.mkdirSync(path.dirname(priceDataPath), { recursive: true });
  }
  const priceDataExists = fs.existsSync(priceDataPath);

  if(!apiKey) {
    throw new Error('install() called without an API key');
  }
  const backpackTF = new BackpackTF(apiKey);

  // always update currencyData
  const currencyData = await backpackTF.getCurrencies();
  fs.writeFileSync(currencyDataPath, JSON.stringify(currencyData, null, 2));

  if(update) {
    if(priceDataExists) {
      const timestamp = await readTimestamp(priceDataPath);
      const currentTime = Math.round(Date.now() / 1000);
      if(typeof timestamp === 'undefined') {
        throw new Error('File exists but does not contain a timestamp. Please delete the file and try again:\n  ' + priceDataPath);
      } else if(currentTime - timestamp < lastModifiedTime) {
        v.log('Price data is up to date. Skipping update.');
        return;
      }
    } else {

    }
  }

  const existingPriceData: PricesResponse = (update && priceDataExists) ? JSON.parse(fs.readFileSync(priceDataPath, 'utf8')) : null;
  if(existingPriceData) {
    // fetch and merge
    v.log('Fetching delta price data from backpack.tf...');
    const priceData = await backpackTF.getPrices({ raw: 1, since: existingPriceData.response.current_time });
    if(!priceData?.response?.success) {
      throw new Error('Failed to fetch price data from backpack.tf');
    }
    existingPriceData.response.current_time = priceData.response.current_time;
    existingPriceData.response.raw_usd_value = priceData.response.raw_usd_value;
    existingPriceData.response.usd_currency = priceData.response.usd_currency;
    existingPriceData.response.usd_currency_index = priceData.response.usd_currency_index;
    existingPriceData.response.items = Object.assign(
      existingPriceData.response.items,
      priceData.response.items
    );
    fs.writeFileSync(priceDataPath, JSON.stringify(existingPriceData, null, 2));
  } else {
    v.log('Fetching full price data...');
    const priceData = await backpackTF.getPrices({ raw: 1, since: 0 });
    if(!priceData?.response?.success) {
      throw new Error('Failed to fetch price data from backpack.tf');
    }
    fs.writeFileSync(priceDataPath, JSON.stringify(priceData, null, 2));
  }
  v.log('Price data installed successfully.');
}