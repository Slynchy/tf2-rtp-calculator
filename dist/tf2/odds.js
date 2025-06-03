"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TF2Odds = void 0;
const tf2Grades_1 = require("./enums/tf2Grades");
exports.TF2Odds = {
    uncrateStrangeChance: 0.1,
    uncrateUnusualChance: 0.0066,
    uncrateGradeChance: {
        [tf2Grades_1.TF2Grades.Mercenary]: 0.8,
        [tf2Grades_1.TF2Grades.Commando]: 0.16,
        [tf2Grades_1.TF2Grades.Assassin]: 0.032,
        [tf2Grades_1.TF2Grades.Elite]: 0.008, // 0.8% chance to uncrate an Elite grade item
    }
};
