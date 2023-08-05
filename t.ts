import { generateNumbers } from "./test/config.ts"

const kv = await Deno.openKv()

const ids = generateNumbers(1_000)

let atomic = kv.atomic()

for (const id of ids) {
  atomic = atomic.delete([id])
}

await atomic.commit()
