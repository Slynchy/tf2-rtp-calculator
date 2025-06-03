// backpack-tf.ts
// Minimal client for the public backpack.tf WebAPI (OAS3 “WebAPI …” sections)

import { EItemQuality } from "../shared/enums/itemQuality";
import { ITF2ItemPriceData } from "./interfaces/itemPriceData";
import { ETF2UnusualEffects } from "./enums/unusualEffects";
interface CurrencyData {
  "name": string;
  "quality": EItemQuality;
  "priceindex": string;
  "single": string;
  "plural": string;
  "round": number; // how much decimal to round to
  "blanket": number; // no idea what this is
  "craftable": "Craftable" | "Uncraftable";
  "tradable": "Tradable" | "Untradable";
  "defindex": number;
  "price": {
    "value": number;
    "currency": "metal" | "keys" | "buds" | "usd";
    "difference": number;
    "last_update": number;
    "value_high": number;
  }
}
export interface CurrenciesResponse {
  "response": {
    "success": number;
    "currencies": {
      "metal": CurrencyData;
      "keys": CurrencyData;
      "buds": CurrencyData;
      "usd": CurrencyData;
    }
    "name": "Team Fortress 2";
    "url": "https://backpack.tf";
  };
}
export interface PriceHistoryResponse { /* … */ }
export interface PricesResponse    {
  response: {
    "success": 1;
    "current_time": number; // in seconds
    "raw_usd_value": number;
    "usd_currency": "metal";
    "usd_currency_index": 5002;
    "items": Record<string, {
      "defindex": Array<number>;
      "prices": Record<EItemQuality, {
        "Tradable": {
          "Non-Craftable": Array<ITF2ItemPriceData>;
          "Craftable": Array<ITF2ItemPriceData> | Record<Partial<ETF2UnusualEffects>, ITF2ItemPriceData>;
        }
      }>;
    }>;
  }
}
export interface SpecialItemsResponse { /* … */ }
export interface UsersResponse     { /* … */ }
export interface ImpersonatedUsersResponse { /* … */ }
export interface UserTradesResponse { /* … */ }

type Query = Record<string, string | number | boolean | undefined>;

export class BackpackTF {
  private readonly base = 'https://backpack.tf/api'; // default server :contentReference[oaicite:0]{index=0}
  constructor(private readonly apiKey: string) {}

  /** GET /IGetCurrencies/v1 – internal currency list */
  getCurrencies(params: { raw?: number } = {}): Promise<CurrenciesResponse> {
    return this.request('/IGetCurrencies/v1', params); // :contentReference[oaicite:1]{index=1}
  }

  /** GET /IGetPriceHistory/v1 – price history for one SKU */
  getPriceHistory(params: {
    appid: string; item: string; quality?: string;
    tradable?: string; craftable?: string; priceindex?: string | number;
  }): Promise<PriceHistoryResponse> {
    return this.request('/IGetPriceHistory/v1', params); // :contentReference[oaicite:2]{index=2}
  }

  /** GET /IGetPrices/v4 – full price schema (TF2 only) */
  getPrices(params: { raw?: number; since?: number } = {}): Promise<PricesResponse> {
    return this.request('/IGetPrices/v4', params); // :contentReference[oaicite:3]{index=3}
  }

  /** GET /IGetSpecialItems/v1 – list of items with special behaviour */
  getSpecialItems(): Promise<SpecialItemsResponse> {
    return this.request('/IGetSpecialItems/v1'); // :contentReference[oaicite:4]{index=4}
  }

  /** GET /IGetUsers/v3 – metadata for one or more users */
  getUsers(steamids: string[]): Promise<UsersResponse> {
    return this.request('/IGetUsers/v3', { steamids: steamids.join(',') }); // :contentReference[oaicite:5]{index=5}
  }

  /** GET /IGetUsers/GetImpersonatedUsers – flagged impersonators */
  getImpersonatedUsers(params: { limit?: number; skip?: number } = {}): Promise<ImpersonatedUsersResponse> {
    return this.request('/IGetUsers/GetImpersonatedUsers', params); // :contentReference[oaicite:6]{index=6}
  }

  /** GET /IGetUserTrades/v1 – public trades for a user */
  getUserTrades(): Promise<UserTradesResponse> {
    return this.request('/IGetUserTrades/v1'); // :contentReference[oaicite:7]{index=7}
  }

  // --------------- internals ---------------

  private async request<T = unknown>(path: string, query: Query = {}): Promise<T> {
    const search = new URLSearchParams(
      // @ts-ignore
      Object.entries({ ...query, key: this.apiKey })
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    );
    const url = `${this.base}${path}?${search.toString()}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
  }
}
