"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.install = install;
const fs = __importStar(require("node:fs"));
const vLog_1 = require("../shared/vLog");
const backpack_tf_1 = require("../tf2/backpack-tf");
const node_path_1 = __importDefault(require("node:path"));
const stream_json_1 = require("stream-json");
const defaultTimeoutTime = 2000;
let timeoutTime = defaultTimeoutTime;
const lastModifiedTime = 24 * 60 * 60 * 1000; // 1 day in milliseconds
async function readTimestamp(path) {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(path, { encoding: 'utf8' });
        const jsonParser = (0, stream_json_1.parser)();
        jsonParser.on('data', (data) => {
            if (data.key === 'timestamp') {
                resolve(data.value);
                stream.destroy(); // stop reading the file
                jsonParser.destroy(); // stop parsing
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
async function install(apiKey, currencyDataPath, priceDataPath, update = false) {
    currencyDataPath = node_path_1.default.resolve(currencyDataPath);
    priceDataPath = node_path_1.default.resolve(priceDataPath);
    // check if output folder exists, if not create it
    if (!fs.existsSync(node_path_1.default.dirname(priceDataPath))) {
        fs.mkdirSync(node_path_1.default.dirname(priceDataPath), { recursive: true });
    }
    const priceDataExists = fs.existsSync(priceDataPath);
    if (!apiKey) {
        throw new Error('install() called without an API key');
    }
    const backpackTF = new backpack_tf_1.BackpackTF(apiKey);
    // always update currencyData
    const currencyData = await backpackTF.getCurrencies();
    fs.writeFileSync(currencyDataPath, JSON.stringify(currencyData, null, 2));
    if (update) {
        if (priceDataExists) {
            const timestamp = await readTimestamp(priceDataPath);
            const currentTime = Math.round(Date.now() / 1000);
            if (typeof timestamp === 'undefined') {
                throw new Error('File exists but does not contain a timestamp. Please delete the file and try again:\n  ' + priceDataPath);
            }
            else if (currentTime - timestamp < lastModifiedTime) {
                vLog_1.v.log('Price data is up to date. Skipping update.');
                return;
            }
        }
        else {
        }
    }
    const existingPriceData = (update && priceDataExists) ? JSON.parse(fs.readFileSync(priceDataPath, 'utf8')) : null;
    if (existingPriceData) {
        // fetch and merge
        vLog_1.v.log('Fetching delta price data from backpack.tf...');
        const priceData = await backpackTF.getPrices({ raw: 1, since: existingPriceData.response.current_time });
        if (!priceData?.response?.success) {
            throw new Error('Failed to fetch price data from backpack.tf');
        }
        existingPriceData.response.current_time = priceData.response.current_time;
        existingPriceData.response.raw_usd_value = priceData.response.raw_usd_value;
        existingPriceData.response.usd_currency = priceData.response.usd_currency;
        existingPriceData.response.usd_currency_index = priceData.response.usd_currency_index;
        existingPriceData.response.items = Object.assign(existingPriceData.response.items, priceData.response.items);
        fs.writeFileSync(priceDataPath, JSON.stringify(existingPriceData, null, 2));
    }
    else {
        vLog_1.v.log('Fetching full price data...');
        const priceData = await backpackTF.getPrices({ raw: 1, since: 0 });
        if (!priceData?.response?.success) {
            throw new Error('Failed to fetch price data from backpack.tf');
        }
        fs.writeFileSync(priceDataPath, JSON.stringify(priceData, null, 2));
    }
    vLog_1.v.log('Price data installed successfully.');
}
