import { assert } from "../test.deps.ts"
import {
  val1,
  val10,
  val11,
  val12,
  val13,
  val14,
  val15,
  val16,
  val17,
  val18,
  val19,
  val2,
  val20,
  val21,
  val22,
  val23,
  val24,
  val25,
  val26,
  val27,
  val28,
  val29,
  val3,
  val4,
  val5,
  val6,
  val7,
  val8,
  val9,
} from "../values.ts"
import { isKvObject } from "../../src/utils.ts"

Deno.test("utils - isKvObject", async (t) => {
  await t.step("Should return true for normal object", () => {
    assert(isKvObject(val27))
  })

  await t.step(
    "Should return false for all non-normal objects and primtives",
    () => {
      assert(!isKvObject(val1))
      assert(!isKvObject(val2))
      assert(!isKvObject(val3))
      assert(!isKvObject(val4))
      assert(!isKvObject(val5))
      assert(!isKvObject(val6))
      assert(!isKvObject(val7))
      assert(!isKvObject(val8))
      assert(!isKvObject(val9))
      assert(!isKvObject(val10))
      assert(!isKvObject(val11))
      assert(!isKvObject(val12))
      assert(!isKvObject(val13))
      assert(!isKvObject(val14))
      assert(!isKvObject(val15))
      assert(!isKvObject(val16))
      assert(!isKvObject(val17))
      assert(!isKvObject(val18))
      assert(!isKvObject(val19))
      assert(!isKvObject(val20))
      assert(!isKvObject(val21))
      assert(!isKvObject(val22))
      assert(!isKvObject(val23))
      assert(!isKvObject(val24))
      assert(!isKvObject(val25))
      assert(!isKvObject(val26))
      assert(!isKvObject(val28))
      assert(!isKvObject(val29))
    },
  )
})
