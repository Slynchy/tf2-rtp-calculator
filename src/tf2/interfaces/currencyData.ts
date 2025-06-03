export interface ITF2CurrencyData {
  "price": {
    "value": number;
    "currency": "keys" | "metal" | "buds" | "usd";
    "difference": number;
    "last_update": number; // timestamp in seconds
    "value_high": number;
  };
}