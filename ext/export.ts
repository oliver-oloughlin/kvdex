import { KVDEX_KEY_PREFIX } from "../src/constants.ts"
import { jsonSerialize } from "../src/utils.ts"
import { compress } from "../src/utils.ts"

const [filepath, kvpath] = Deno.args
const kv = await Deno.openKv(kvpath)
const iter = kv.list({ prefix: [KVDEX_KEY_PREFIX] })
const file = await Deno.open(filepath ?? "./data", { write: true, create: true })
const newline = new TextEncoder().encode("\n")

for await (const { key, value } of iter) {
  const serialized = jsonSerialize({
    key,
    value
  })

  let data = compress(serialized)

  while (true) {
    const bytes = await file.write(data)
    if (bytes === data.byteLength) {
      break
    }

    data = data.subarray(bytes)
  }

  await file.write(newline)
}

file.close()
