import { TF2Grades } from "../enums/tf2Grades";
import { ETF2UnusualEffects } from "../enums/unusualEffects";
export interface TF2Crate {
    items: Record<string, TF2Grades>;
    unusualItems: Record<Partial<keyof TF2Crate['items']>, boolean>;
    effects: ETF2UnusualEffects[];
}
