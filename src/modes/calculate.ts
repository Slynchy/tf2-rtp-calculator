/*
  File for calculating the RTP of TF2 unbox sessions.
 */

import { v } from "../shared/vLog";
import { BackpackTF, CurrenciesResponse, PricesResponse } from "../tf2/backpack-tf";
import fs from "fs";
import path from "path";
import { ETF2UnusualEffects } from "../tf2/enums/unusualEffects";
import { EItemQuality } from "../shared/enums/itemQuality";
import { roundNumToPlace } from "../shared/roundNumToPlace";

interface IInventoryItemDescriptionData {
  // additional property
  amount?: number;
  unusual_effect?: ETF2UnusualEffects;
  // additional property

  appid: number;
  classid: string;
  instanceid: string;
  currency: number;
  name: string;
  market_name: string;
  market_hash_name: string;
  type: string;

  background_color: string; // hex color without the #
  name_color: string;

  icon_url: string; // base64 encoded image URL
  icon_url_large: string;

  descriptions: Array<
    {
      "value": string;
      "color": string; // e.g. "ffd700";
      "name": string; // "attribute"
    }
  >;
  tradable: 0 | 1;
  commodity: number; // ?
  actions: unknown;
  market_actions: unknown;
  market_tradable_restriction: number;
  market_marketable_restriction: number;
  marketable: 0 | 1;
  tags: Array<ITagData>;
}

interface ITagData {
  "category": string; // e.g. "Quality",
  "internal_name": string; // e.g. "Unique",
  "localized_category_name": string; // e.g. "Quality",
  "localized_tag_name": string; // e.g. "Unique",
  "color"?: string; // e.g. "7D6D00"
}

interface IInventoryData {
  assets: Array<{
    appid: number;
    contextid: '2';
    assetid: string;
    classid: string;
    instanceid: string;
    amount: string; // string number
  }>;
  descriptions: Array<IInventoryItemDescriptionData>;
}

export async function calculate(
  // apiKey: string,
  steam64Id: string,
  itemIdFrom: number,
  totalCostOfUnboxing: number,

  itemIdTo: number,
  currencyDataPath: string,
  priceDataPath: string,
  cacheDataPath: string,
  skipCache: boolean = false
): Promise<void> {
  // Validate input parameters
  // if(!apiKey) {
  //   console.error('calculate() called without an API key');
  //   return;
  // }
  if(!steam64Id) {
    console.error('calculate() called without a Steam64 ID');
    return;
  }
  if(!itemIdFrom) {
    console.error('calculate() called without an item ID from');
    return;
  }
  if(typeof totalCostOfUnboxing === 'undefined') {
    console.error('calculate() called without the unboxing cost')
  }
  if(itemIdTo && itemIdTo < itemIdFrom) {
    console.error('calculate() called with an item ID to that is less than the item ID from');
    return;
  }

  v.log(`Loading price data...`);
  let priceData: PricesResponse = undefined as unknown as PricesResponse;
  try {
    priceData = JSON.parse(fs.readFileSync(priceDataPath ?? `${__dirname}/output.json`, 'utf-8'));
  } catch(err) {
    // console.error(err);
  }
  if(!priceData) {
    console.error('No price data found. Please run the install command first.');
    return;
  }
  v.log(`Loaded price data.`);
  v.log(`Loading currency data...`);
  let currencyResponse: CurrenciesResponse | null;
  try {
    currencyResponse = JSON.parse(fs.readFileSync(currencyDataPath ?? `${__dirname}/data/currency_data.json`, 'utf-8'));
  } catch(err) {
    currencyResponse = null;
  }
  if(!currencyResponse) {
    console.error('No currency data found. Please run the install command first.');
    return;
  }
  v.log(`Loaded currency data.`);

  // v.log(`Fetching data for user ${steam64Id} from item ${itemIdFrom}${itemIdTo ? `to item ${itemIdTo}...` : ''}`);
  // const backpackTF = new BackpackTF(apiKey);
  // const userData = await backpackTF.getUsers([steam64Id]);
  // if(!userData || !userData.response || userData.response.success !== 1) {
  //   v.error(`Error encountered fetching Backpack.tf data for user ${steam64Id}`);
  //   return;
  // }
  //
  // console.log(userData.response.players[steam64Id]);

  // user is valid
  // v.log(`User ${steam64Id} Backpack.tf data fetched successfully.`);

  // Check if cached file exists
  let backpackData: IInventoryData | null = null;
  if(!skipCache) {
    const cacheFilePath = path.resolve(cacheDataPath) + `/${steam64Id}_inventory.json`;
    if(fs.existsSync(cacheFilePath)) {
      v.log(`Using cached inventory data from ${cacheFilePath}`);
      try {
        const data: IInventoryData & { lastUpdated: number } = JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8'));
        // Check if the cache is still valid
        const lastUpdated = data.lastUpdated || 0;
        const currentTime = Math.floor(Date.now() / 1000);
        if(currentTime - lastUpdated < 86400) { // 24 hours
          backpackData = data;
        }
      } catch(err) {
        v.error(`Error reading cached inventory data: ${err}`);
      }
    } else {
      v.log(`No cached inventory data found for ${steam64Id}.`);
    }
  }

  if(!backpackData) {
    v.log(`Fetching backpack from Steam API...`);
    // Make net request to Steam API url
    const steamApiUrl = `http://steamcommunity.com/inventory/${steam64Id}/440/2?l=english&count=500`;
    const response = await fetch(steamApiUrl);
    if(!response.ok || response.status !== 200) {
      v.error(`Error fetching inventory from Steam API: ${response.status} ${response.statusText}`);
      return;
    }
    backpackData = (await response.json()) as IInventoryData;

    // save the filtered data to a cache file
    const cacheFilePath = path.resolve(cacheDataPath) + `/${steam64Id}_inventory.json`;
    if(
      !fs.existsSync(
        path.dirname(cacheFilePath)
      )
    ) {
      v.log(`Creating cache directory at ${path.dirname(cacheFilePath)}`);
      fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(
        Object.assign(backpackData, { lastUpdated: Math.floor(Date.now() / 1000) }),
        null,
        2
      )
    );
  }

  const filteredData: {
    amount: number;
    name: string;
    unusual_effect?: ETF2UnusualEffects | undefined;
    is_strange?: boolean | undefined;
  }[] = backpackData.assets
    .filter((item) => {
      return parseInt(item.assetid) >= itemIdFrom && (
        itemIdTo ? parseInt(item.assetid) <= itemIdTo : true
      );
    })
    .sort((a, b) => {
      return parseInt(a.assetid) - parseInt(b.assetid);
    })
    .map((item) => {
      const description = backpackData?.descriptions.find(desc => desc.classid === item.classid && desc.instanceid === item.instanceid);
      if(!description) {
        v.error(`Description for item ${item.classid}:${item.instanceid} not found in backpack data.`);
        return null;
      }
      const retVal: {
        amount: number;
        name: string;
        unusual_effect?: ETF2UnusualEffects;
        isStrange?: boolean;
      } = {
        amount: parseInt(item.amount),
        name: description.market_hash_name,
      };
      let isUnusual = false;
      if(
        retVal.name.indexOf('Unusual') === 0
      ) {
        retVal.name = retVal.name.replace('Unusual ', '');
        isUnusual = true;
      } else if(
        retVal.name.indexOf('Strange Unusual') === 0
      ) {
        retVal.name = retVal.name.replace('Strange Unusual ', '');
        isUnusual = true;
        retVal.isStrange = true;
      } else if(
        retVal.name.indexOf('Strange') === 0 &&
        retVal.name.indexOf('Strange Count') !== 0 &&
        retVal.name.indexOf('Strange Part') !== 0
      ) {
        retVal.name = retVal.name.replace('Strange ', '');
        retVal.isStrange = true;
      }

      if (retVal.name.indexOf('The ') === 0) {
        retVal.name = retVal.name.slice('The '.length);
      }

      if(isUnusual) {
        const effectValue =
          description.descriptions.find((e) => e.value.indexOf('★ Unusual Effect: ') === 0)?.value;
        if(effectValue) {
          retVal.unusual_effect = ETF2UnusualEffects[
            // @ts-ignore
            effectValue.slice(
              ('★ Unusual Effect: '.length)
            )
          ];
        } else {
          console.warn(`Unusual item ${retVal.name} does not have an effect description. This may cause issues in calculations.`);
        }
      }

      return retVal;
    })
    .filter((item) => item !== null) as {
      amount: number;
      name: string;
      unusual_effect?: ETF2UnusualEffects | undefined;
      is_strange?: boolean | undefined;
    }[];

  let highestValue = -1;
  const totalGrossValue = filteredData.reduce((acc, item) => {
    const itemPrices = priceData?.response?.items?.[item.name]?.prices;
    if(!itemPrices) {
      console.warn(`Unable to find prices for item "${item.name}"`);
    }
    let itemPrice = 0;
    // let currency = '';
    if(item.unusual_effect) {
      itemPrice = itemPrices[EItemQuality.Unusual].Tradable.Craftable[item.unusual_effect].value_raw;
      // currency = itemPrices[EItemQuality.Unusual].Tradable.Craftable[item.unusual_effect].currency;
    } else if(item.is_strange) {
      itemPrice = itemPrices[EItemQuality.Strange].Tradable.Craftable[0].value_raw;
      // currency = itemPrices[EItemQuality.Strange].Tradable.Craftable[0].currency;
    } else {
      itemPrice = itemPrices[EItemQuality.Unique].Tradable.Craftable[0].value_raw;
      // currency = itemPrices[EItemQuality.Unique].Tradable.Craftable[0].currency;
    }

    const value = ((itemPrice * (priceData.response.raw_usd_value)) * item.amount);
    if(value > highestValue) {
      highestValue = value;
    }
    return acc + value;
  }, 0);
  const result = {
    rtp: roundNumToPlace(
      (((totalGrossValue * 0.9) / totalCostOfUnboxing) * 100),
      2
    ).toString() + '%',
    totalGrossValue: '$' + roundNumToPlace(totalGrossValue, 2),
    totalNetValue: '$' + roundNumToPlace(((totalGrossValue * 0.9) - totalCostOfUnboxing), 2),
    maxWin: '$' +  roundNumToPlace(highestValue, 2),
  };

  console.log(result);
}