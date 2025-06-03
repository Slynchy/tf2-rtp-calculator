"use strict";
// backpack-tf.ts
// Minimal client for the public backpack.tf WebAPI (OAS3 “WebAPI …” sections)
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackpackTF = void 0;
class BackpackTF {
    apiKey;
    base = 'https://backpack.tf/api'; // default server :contentReference[oaicite:0]{index=0}
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    /** GET /IGetCurrencies/v1 – internal currency list */
    getCurrencies(params = {}) {
        return this.request('/IGetCurrencies/v1', params); // :contentReference[oaicite:1]{index=1}
    }
    /** GET /IGetPriceHistory/v1 – price history for one SKU */
    getPriceHistory(params) {
        return this.request('/IGetPriceHistory/v1', params); // :contentReference[oaicite:2]{index=2}
    }
    /** GET /IGetPrices/v4 – full price schema (TF2 only) */
    getPrices(params = {}) {
        return this.request('/IGetPrices/v4', params); // :contentReference[oaicite:3]{index=3}
    }
    /** GET /IGetSpecialItems/v1 – list of items with special behaviour */
    getSpecialItems() {
        return this.request('/IGetSpecialItems/v1'); // :contentReference[oaicite:4]{index=4}
    }
    /** GET /IGetUsers/v3 – metadata for one or more users */
    getUsers(steamids) {
        return this.request('/IGetUsers/v3', { steamids: steamids.join(',') }); // :contentReference[oaicite:5]{index=5}
    }
    /** GET /IGetUsers/GetImpersonatedUsers – flagged impersonators */
    getImpersonatedUsers(params = {}) {
        return this.request('/IGetUsers/GetImpersonatedUsers', params); // :contentReference[oaicite:6]{index=6}
    }
    /** GET /IGetUserTrades/v1 – public trades for a user */
    getUserTrades() {
        return this.request('/IGetUserTrades/v1'); // :contentReference[oaicite:7]{index=7}
    }
    // --------------- internals ---------------
    async request(path, query = {}) {
        const search = new URLSearchParams(
        // @ts-ignore
        Object.entries({ ...query, key: this.apiKey })
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]));
        const url = `${this.base}${path}?${search.toString()}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok)
            throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
    }
}
exports.BackpackTF = BackpackTF;
