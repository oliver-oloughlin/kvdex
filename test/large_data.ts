import { generateNumbers, LargeData } from "./config.ts"

export const testLargeData: LargeData = {
  name: "large_data_1",
  numbers: generateNumbers(500_000),
}

export const testLargeData2: LargeData = {
  name: "large_data_2",
  numbers: generateNumbers(500_000),
}
