import { parse } from "../src/utils.ts"
import { TextLineStream } from "https://deno.land/std@0.212.0/streams/mod.ts"
import type { KvKey } from "../src/types.ts"

if (import.meta.main) {
  const [filepath, kvpath] = Deno.args

  if (!filepath) {
    throw new Error("No filepath was specified")
  }

  await importData(filepath, kvpath)
}

export async function importData(filepath: string, kvpath?: string) {
  const kv = await Deno.openKv(kvpath)
  const file = await Deno.open(filepath, { read: true })

  const reader = file.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .getReader()

  let eof = false
  while (!eof) {
    const { value, done } = await reader.read()
    if (!done) {
      const data = parse<{ key: KvKey, value: unknown }>(value)
      await kv.set(data.key, data.value)
    }

    eof = done
  }

  kv.close()
  file.close()
}
