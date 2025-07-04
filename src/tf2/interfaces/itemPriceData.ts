export interface ITF2ItemPriceData {
  "value": number;
  "currency": "keys" | "metal" | "buds" | "usd";
  "difference": number;

  // timestamp in seconds
  "last_update": number;

  // value to be multiplied against raw_usd_value to get usd value
  "value_raw": number;
}
