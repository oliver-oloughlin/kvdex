import type { DenoKv } from "../../mod.ts"
import type { Kv } from "../test.deps.ts"

function check(_: DenoKv) {}

Deno.test("db - properties", async (t) => {
  await t.step("Should allow native Deno KV type", () => {
    check(null as unknown as Deno.Kv)
  })

  await t.step("Should allow NPM Deno KV type", () => {
    check(null as unknown as Kv)
  })
})
