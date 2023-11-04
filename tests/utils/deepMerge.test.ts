import { deepMerge } from "../../src/utils.ts"
import { assert } from "../deps.ts"
import { mockUser1, mockUser2 } from "../mocks.ts"

Deno.test("utils - deepMerge", async (t) => {
  await t.step(
    "Should override all properties of the first object with properties from the second",
    () => {
      const merged = deepMerge(mockUser1, mockUser2)

      assert(merged.username === mockUser2.username)
      assert(merged.age === mockUser2.age)
      assert(merged.address.city === mockUser2.address.city)
      assert(merged.address.country === mockUser2.address.country)
      assert(merged.address.houseNr === mockUser2.address.houseNr)
      assert(merged.address.street === mockUser2.address.street)
    },
  )

  await t.step("Should fill in additional properties of nested object", () => {
    const data = {
      address: {
        prop1: "prop1",
        prop2: 10,
      },
    }

    const merged = deepMerge(mockUser1, data)

    assert(merged.address.city === mockUser1.address.city)
    assert(merged.address.country === mockUser1.address.country)
    assert(merged.address.houseNr === mockUser1.address.houseNr)
    assert(merged.address.street === mockUser1.address.street)
    assert(merged.address.prop1 === data.address.prop1)
    assert(merged.address.prop2 === data.address.prop2)
  })
})
