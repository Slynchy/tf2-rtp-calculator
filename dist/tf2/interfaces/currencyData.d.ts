export interface ITF2CurrencyData {
    "price": {
        "value": number;
        "currency": "keys" | "metal" | "buds" | "usd";
        "difference": number;
        "last_update": number;
        "value_high": number;
    };
}
