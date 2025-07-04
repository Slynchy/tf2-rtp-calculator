"use strict";
/*
  File for calculating the RTP of TF2 unbox sessions.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate = calculate;
const vLog_1 = require("../shared/vLog");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const unusualEffects_1 = require("../tf2/enums/unusualEffects");
const itemQuality_1 = require("../shared/enums/itemQuality");
const roundNumToPlace_1 = require("../shared/roundNumToPlace");
async function calculate(
// apiKey: string,
steam64Id, itemIdFrom, totalCostOfUnboxing, itemIdTo, currencyDataPath, priceDataPath, cacheDataPath, skipCache = false) {
    // Validate input parameters
    // if(!apiKey) {
    //   console.error('calculate() called without an API key');
    //   return;
    // }
    if (!steam64Id) {
        console.error('calculate() called without a Steam64 ID');
        return;
    }
    if (!itemIdFrom) {
        console.error('calculate() called without an item ID from');
        return;
    }
    if (typeof totalCostOfUnboxing === 'undefined') {
        console.error('calculate() called without the unboxing cost');
    }
    if (itemIdTo && itemIdTo < itemIdFrom) {
        console.error('calculate() called with an item ID to that is less than the item ID from');
        return;
    }
    vLog_1.v.log(`Loading price data...`);
    let priceData = undefined;
    try {
        priceData = JSON.parse(fs_1.default.readFileSync(priceDataPath ?? `${__dirname}/output.json`, 'utf-8'));
    }
    catch (err) {
        // console.error(err);
    }
    if (!priceData) {
        console.error('No price data found. Please run the install command first.');
        return;
    }
    vLog_1.v.log(`Loaded price data.`);
    vLog_1.v.log(`Loading currency data...`);
    let currencyResponse;
    try {
        currencyResponse = JSON.parse(fs_1.default.readFileSync(currencyDataPath ?? `${__dirname}/data/currency_data.json`, 'utf-8'));
    }
    catch (err) {
        currencyResponse = null;
    }
    if (!currencyResponse) {
        console.error('No currency data found. Please run the install command first.');
        return;
    }
    vLog_1.v.log(`Loaded currency data.`);
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
    let backpackData = null;
    if (!skipCache) {
        const cacheFilePath = path_1.default.resolve(cacheDataPath) + `/${steam64Id}_inventory.json`;
        if (fs_1.default.existsSync(cacheFilePath)) {
            vLog_1.v.log(`Using cached inventory data from ${cacheFilePath}`);
            try {
                const data = JSON.parse(fs_1.default.readFileSync(cacheFilePath, 'utf-8'));
                // Check if the cache is still valid
                const lastUpdated = data.lastUpdated || 0;
                const currentTime = Math.floor(Date.now() / 1000);
                if (currentTime - lastUpdated < 86400) { // 24 hours
                    backpackData = data;
                }
            }
            catch (err) {
                vLog_1.v.error(`Error reading cached inventory data: ${err}`);
            }
        }
        else {
            vLog_1.v.log(`No cached inventory data found for ${steam64Id}.`);
        }
    }
    if (!backpackData) {
        vLog_1.v.log(`Fetching backpack from Steam API...`);
        // Make net request to Steam API url
        const steamApiUrl = `http://steamcommunity.com/inventory/${steam64Id}/440/2?l=english&count=500`;
        const response = await fetch(steamApiUrl);
        if (!response.ok || response.status !== 200) {
            vLog_1.v.error(`Error fetching inventory from Steam API: ${response.status} ${response.statusText}`);
            return;
        }
        backpackData = (await response.json());
        // save the filtered data to a cache file
        const cacheFilePath = path_1.default.resolve(cacheDataPath) + `/${steam64Id}_inventory.json`;
        if (!fs_1.default.existsSync(path_1.default.dirname(cacheFilePath))) {
            vLog_1.v.log(`Creating cache directory at ${path_1.default.dirname(cacheFilePath)}`);
            fs_1.default.mkdirSync(path_1.default.dirname(cacheFilePath), { recursive: true });
        }
        fs_1.default.writeFileSync(cacheFilePath, JSON.stringify(Object.assign(backpackData, { lastUpdated: Math.floor(Date.now() / 1000) }), null, 2));
    }
    const filteredData = backpackData.assets
        .filter((item) => {
        return parseInt(item.assetid) >= itemIdFrom && (itemIdTo ? parseInt(item.assetid) <= itemIdTo : true);
    })
        .sort((a, b) => {
        return parseInt(a.assetid) - parseInt(b.assetid);
    })
        .map((item) => {
        const description = backpackData?.descriptions.find(desc => desc.classid === item.classid && desc.instanceid === item.instanceid);
        if (!description) {
            vLog_1.v.error(`Description for item ${item.classid}:${item.instanceid} not found in backpack data.`);
            return null;
        }
        const retVal = {
            amount: parseInt(item.amount),
            name: description.market_hash_name,
        };
        let isUnusual = false;
        if (retVal.name.indexOf('Unusual') === 0) {
            retVal.name = retVal.name.replace('Unusual ', '');
            isUnusual = true;
        }
        else if (retVal.name.indexOf('Strange Unusual') === 0) {
            retVal.name = retVal.name.replace('Strange Unusual ', '');
            isUnusual = true;
            retVal.isStrange = true;
        }
        else if (retVal.name.indexOf('Strange') === 0 &&
            retVal.name.indexOf('Strange Count') !== 0 &&
            retVal.name.indexOf('Strange Part') !== 0) {
            retVal.name = retVal.name.replace('Strange ', '');
            retVal.isStrange = true;
        }
        if (retVal.name.indexOf('The ') === 0) {
            retVal.name = retVal.name.slice('The '.length);
        }
        if (isUnusual) {
            const effectValue = description.descriptions.find((e) => e.value.indexOf('★ Unusual Effect: ') === 0)?.value;
            if (effectValue) {
                retVal.unusual_effect = unusualEffects_1.ETF2UnusualEffects[
                // @ts-ignore
                effectValue.slice(('★ Unusual Effect: '.length))];
            }
            else {
                console.warn(`Unusual item ${retVal.name} does not have an effect description. This may cause issues in calculations.`);
            }
        }
        return retVal;
    })
        .filter((item) => item !== null);
    let highestValue = -1;
    const totalGrossValue = filteredData.reduce((acc, item) => {
        const itemPrices = priceData?.response?.items?.[item.name]?.prices;
        if (!itemPrices) {
            console.warn(`Unable to find prices for item "${item.name}"`);
        }
        let itemPrice = 0;
        // let currency = '';
        if (item.unusual_effect) {
            itemPrice = itemPrices[itemQuality_1.EItemQuality.Unusual].Tradable.Craftable[item.unusual_effect].value_raw;
            // currency = itemPrices[EItemQuality.Unusual].Tradable.Craftable[item.unusual_effect].currency;
        }
        else if (item.is_strange) {
            itemPrice = itemPrices[itemQuality_1.EItemQuality.Strange].Tradable.Craftable[0].value_raw;
            // currency = itemPrices[EItemQuality.Strange].Tradable.Craftable[0].currency;
        }
        else {
            itemPrice = itemPrices[itemQuality_1.EItemQuality.Unique].Tradable.Craftable[0].value_raw;
            // currency = itemPrices[EItemQuality.Unique].Tradable.Craftable[0].currency;
        }
        const value = ((itemPrice * (priceData.response.raw_usd_value)) * item.amount);
        if (value > highestValue) {
            highestValue = value;
        }
        return acc + value;
    }, 0);
    const result = {
        rtp: (0, roundNumToPlace_1.roundNumToPlace)((((totalGrossValue * 0.9) / totalCostOfUnboxing) * 100), 2).toString() + '%',
        totalGrossValue: '$' + (0, roundNumToPlace_1.roundNumToPlace)(totalGrossValue, 2),
        totalNetValue: '$' + (0, roundNumToPlace_1.roundNumToPlace)(((totalGrossValue * 0.9) - totalCostOfUnboxing), 2),
        maxWin: '$' + (0, roundNumToPlace_1.roundNumToPlace)(highestValue, 2),
    };
    console.log(result);
}
