import { type Document, flatten } from "../../mod.ts"
import { type Person, reset, testPerson } from "../config.ts"
import { assert } from "../deps.ts"

Deno.test("utils", async (t1) => {
  // Test "flatten" method
  await t1.step("flatten", async (t2) => {
    await t2.step("Should flatten document of type KvObject", () => {
      const doc: Document<Person> = {
        id: 123n,
        versionstamp: "versionstamp",
        value: testPerson,
      }

      const flattenedTest = {
        id: doc.id,
        versionstamp: doc.versionstamp,
        ...doc.value,
      }

      const testEntries = Object.entries(flattenedTest)

      const flattened = flatten(doc)

      assert(testEntries.every(([key, value]) => {
        return Object.hasOwn(flattened, key) &&
          flattened[key]?.toString() === value.toString()
      }))
    })
  })

  // Perform last reset
  await t1.step("RESET", async () => await reset())
})
