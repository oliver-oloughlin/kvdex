import { createDb } from "./utils.ts"

const db = createDb(await Deno.openKv(":memory:"))

db.cron(() => console.log("Hello!"), {
  interval: 1_000,
})

db.cron(() => console.log("== WORLD =="), {
  startDelay: 10_000,
  interval: 4_000,
})

console.log("After")
