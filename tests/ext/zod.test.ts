import { z } from "zod"
import { assert } from "jsr:@std/assert@0.215/assert"
import {
  KvArraySchema,
  KvIdSchema,
  KvObjectSchema,
  KvValueSchema,
  zodModel,
} from "../../ext/zod.ts"
import { collection, kvdex } from "../../mod.ts"
import { useKv } from "../utils.ts"

const UserSchema = z.object({
  username: z.string(),
  age: z.number().default(18),
  address: z.object({
    country: z.string().default("Norway"),
    city: z.string(),
  })
    .default({
      city: "Bergen",
    }),
})

const kvObject = {
  string: "test",
  number: 10,
  boolean: true,
  bigint: 10n,
}

const notKvObject = {
  test1: Symbol("test1"),
  [Symbol("test2")]: "test2",
}

const notKvArray = [Symbol("test")]

const notKvValues = [Symbol(), notKvObject, notKvArray]

const kvArray = ["test", 10, true, 10n]

const kvValues = [
  undefined,
  null,
  "string",
  10,
  true,
  10n,
  new Deno.KvU64(10n),
  kvObject,
  kvArray,
  new Int8Array(),
  new Int16Array(),
  new Int32Array(),
  new BigInt64Array(),
  new Uint8Array(),
  new Uint16Array(),
  new Uint32Array(),
  new BigUint64Array(),
  new Uint8ClampedArray(),
  new Float32Array(),
  new Float64Array(),
  new ArrayBuffer(16),
  new Date(),
  new Set<number>().add(10),
  new Map<string, number>().set("test", 10),
  new RegExp(""),
  new DataView(new ArrayBuffer(16)),
  new Error("test"),
]

Deno.test("ext - zod", async (t) => {
  await t.step("Should correctly parse insert model", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        users: collection(zodModel(UserSchema)),
        i_users: collection(zodModel(UserSchema), {
          indices: {
            username: "primary",
            age: "secondary",
          },
        }),
        s_users: collection(zodModel(UserSchema), { serialize: "json" }),
      })

      const cr1 = await db.users.add({
        username: "oliver",
        address: {
          city: "Bergen",
        },
      })

      const cr2 = await db.i_users.add({
        username: "oliver",
        address: {
          city: "Bergen",
        },
      })

      const cr3 = await db.s_users.add({
        username: "oliver",
        address: {
          city: "Bergen",
        },
      })

      const count = await db.countAll()

      assert(cr1.ok)
      assert(cr2.ok)
      assert(cr3.ok)
      assert(count === 3)
    })
  })

  await t.step(
    "Should use base model when typing selected documents",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          users: collection(zodModel(UserSchema)),
          i_users: collection(zodModel(UserSchema), {
            indices: {
              username: "primary",
              age: "secondary",
            },
          }),
          l_users: collection(zodModel(UserSchema)),
        })

        // Default values should not be inferred as optional when selecting
        const doc1 = await db.users.find("")
        if (doc1) {
          doc1.value.age.valueOf()
        }

        const doc2 = await db.users.find("")
        if (doc2) {
          doc2.value.age.valueOf()
        }

        const doc3 = await db.users.find("")
        if (doc3) {
          doc3.value.age.valueOf()
        }
      })
    },
  )

  await t.step(
    "KvIdSchema should only successfully parse values according to KvId",
    () => {
      const string = KvIdSchema.safeParse("")
      const number = KvIdSchema.safeParse(0)
      const boolean = KvIdSchema.safeParse(true)
      const bigint = KvIdSchema.safeParse(0n)
      const uint8array = KvIdSchema.safeParse(new Uint8Array())
      const undef = KvIdSchema.safeParse(undefined)
      const nul = KvIdSchema.safeParse(null)
      const date = KvIdSchema.safeParse(new Date())

      assert(string.success)
      assert(number.success)
      assert(boolean.success)
      assert(bigint.success)
      assert(uint8array.success)
      assert(!undef.success)
      assert(!nul.success)
      assert(!date.success)
    },
  )

  await t.step(
    "KvValueSchema should only successfully parse values according to KvValue",
    () => {
      kvValues.forEach((val) => assert(KvValueSchema.safeParse(val).success))

      notKvValues.forEach(
        (val) => assert(!KvValueSchema.safeParse(val).success),
      )
    },
  )

  await t.step(
    "KvObjectSchema should only successfully parse values according to KvObject",
    () => {
      assert(KvObjectSchema.safeParse(kvObject).success)
      assert(!KvObjectSchema.safeParse(notKvObject).success)
    },
  )

  await t.step(
    "KvArraySchema should only successfully parse values according to KvArray",
    () => {
      assert(KvArraySchema.safeParse(kvArray).success)
      assert(!KvArraySchema.safeParse(notKvArray).success)
    },
  )
})
