export enum SpendCategory {
  FOOD = "FOOD",
  TRANSPORT = "TRANSPORT",
  SHOPPING = "SHOPPING",
  HOUSING = "HOUSING",
  ENTERTAINMENT = "ENTERTAINMENT",
  HEALTH = "HEALTH",
  EDUCATION = "EDUCATION",
  UTILITIES = "UTILITIES",
  TRAVEL = "TRAVEL",
  OTHER = "OTHER",
}

export const SPEND_CATEGORIES: SpendCategory[] = Object.values(SpendCategory)
