import { EItemQuality } from "../shared/enums/itemQuality";
import { ITF2ItemPriceData } from "./interfaces/itemPriceData";
import { ETF2UnusualEffects } from "./enums/unusualEffects";
interface CurrencyData {
    "name": string;
    "quality": EItemQuality;
    "priceindex": string;
    "single": string;
    "plural": string;
    "round": number;
    "blanket": number;
    "craftable": "Craftable" | "Uncraftable";
    "tradable": "Tradable" | "Untradable";
    "defindex": number;
    "price": {
        "value": number;
        "currency": "metal" | "keys" | "buds" | "usd";
        "difference": number;
        "last_update": number;
        "value_high": number;
    };
}
export interface CurrenciesResponse {
    "response": {
        "success": number;
        "currencies": {
            "metal": CurrencyData;
            "keys": CurrencyData;
            "buds": CurrencyData;
            "usd": CurrencyData;
        };
        "name": "Team Fortress 2";
        "url": "https://backpack.tf";
    };
}
export interface PriceHistoryResponse {
}
export interface PricesResponse {
    response: {
        "success": 1;
        "current_time": number;
        "raw_usd_value": number;
        "usd_currency": "metal";
        "usd_currency_index": 5002;
        "items": Record<string, {
            "defindex": Array<number>;
            "prices": Record<EItemQuality, {
                "Tradable": {
                    "Non-Craftable": Array<ITF2ItemPriceData>;
                    "Craftable": Array<ITF2ItemPriceData> | Record<Partial<ETF2UnusualEffects>, ITF2ItemPriceData>;
                };
            }>;
        }>;
    };
}
export interface SpecialItemsResponse {
}
export interface UsersResponse {
    "response": {
        "success": number;
        "players": Record<string, {
            "steamid": string;
            "success": number;
            "backpack_value": Record<string, number>;
            "backpack_update": Record<string, number>;
            "name": string;
            "backpack_tf_reputation": number;
            "backpack_tf_trust": {
                for: number;
                against: number;
            };
        }>;
    };
}
export interface ImpersonatedUsersResponse {
}
export interface UserTradesResponse {
}
export declare class BackpackTF {
    private readonly apiKey;
    private readonly base;
    constructor(apiKey: string);
    /** GET /IGetCurrencies/v1 – internal currency list */
    getCurrencies(params?: {
        raw?: number;
    }): Promise<CurrenciesResponse>;
    /** GET /IGetPriceHistory/v1 – price history for one SKU */
    getPriceHistory(params: {
        appid: string;
        item: string;
        quality?: string;
        tradable?: string;
        craftable?: string;
        priceindex?: string | number;
    }): Promise<PriceHistoryResponse>;
    /** GET /IGetPrices/v4 – full price schema (TF2 only) */
    getPrices(params?: {
        raw?: number;
        since?: number;
    }): Promise<PricesResponse>;
    /** GET /IGetSpecialItems/v1 – list of items with special behaviour */
    getSpecialItems(): Promise<SpecialItemsResponse>;
    /** GET /IGetUsers/v3 – metadata for one or more users */
    getUsers(steamids: string[]): Promise<UsersResponse>;
    /** GET /IGetUsers/GetImpersonatedUsers – flagged impersonators */
    getImpersonatedUsers(params?: {
        limit?: number;
        skip?: number;
    }): Promise<ImpersonatedUsersResponse>;
    /** GET /IGetUserTrades/v1 – public trades for a user */
    getUserTrades(): Promise<UserTradesResponse>;
    private request;
}
export {};
