import { KVDEX_KEY_PREFIX } from "../src/constants.ts"
import { jsonSerialize } from "../src/utils.ts"

if (import.meta.main) {
  const [filepath, kvpath] = Deno.args
  await exportData(filepath, kvpath)
}

export async function exportData(filepath = "./data", kvpath?: string) {
  const kv = await Deno.openKv(kvpath)
  const iter = kv.list({ prefix: [KVDEX_KEY_PREFIX] })
  const file = await Deno.open(filepath, { write: true, create: true })
  const newline = new TextEncoder().encode("\n")

  for await (const { key, value } of iter) {
    let data = jsonSerialize({
      key,
      value
    })

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
  kv.close()
}
