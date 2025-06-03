import { TF2Grades } from "./enums/tf2Grades";

export const TF2Odds: {
  uncrateStrangeChance: number; // Chance to uncrate a Strange item
  uncrateUnusualChance: number; // Chance to uncrate an Unusual item
  uncrateGradeChance: Record<TF2Grades | string, number>; // Chances to uncrate items of each grade
} = {
  uncrateStrangeChance: 0.1, // 10% chance to uncrate a Strange item
  uncrateUnusualChance: 0.0066, // 0.66% chance to uncrate an Unusual item
  uncrateGradeChance: {
    [TF2Grades.Mercenary]: 0.8, // 80% chance to uncrate a Mercenary grade item
    [TF2Grades.Commando]: 0.16, // 16% chance to uncrate a Commando grade item
    [TF2Grades.Assassin]: 0.032, // 3.2% chance to uncrate an Assassin grade item
    [TF2Grades.Elite]: 0.008, // 0.8% chance to uncrate an Elite grade item
  }
}