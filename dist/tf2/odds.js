"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TF2Odds = void 0;
const tf2Grades_1 = require("./enums/tf2Grades");
exports.TF2Odds = {
    uncrateStrangeChance: 0.1, // 10% chance to uncrate a Strange item
    uncrateUnusualChance: 0.0066, // 0.66% chance to uncrate an Unusual item
    uncrateGradeChance: {
        [tf2Grades_1.TF2Grades.Mercenary]: 0.8, // 80% chance to uncrate a Mercenary grade item
        [tf2Grades_1.TF2Grades.Commando]: 0.16, // 16% chance to uncrate a Commando grade item
        [tf2Grades_1.TF2Grades.Assassin]: 0.032, // 3.2% chance to uncrate an Assassin grade item
        [tf2Grades_1.TF2Grades.Elite]: 0.008, // 0.8% chance to uncrate an Elite grade item
    }
};
