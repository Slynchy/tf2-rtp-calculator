export interface ITF2ItemPriceData {
  "value": number;
  "currency": "keys" | "metal" | "buds" | "usd";
  "difference": number;
  "last_update": number; // timestamp in seconds
  "value_raw": number; // value to be multiplied against raw_usd_value to get usd value
}
