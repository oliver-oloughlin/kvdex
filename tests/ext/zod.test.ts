import { assert, z } from "../deps.ts"
import { zodModel } from "../../ext/zod.ts"
import {
  collection,
  indexableCollection,
  kvdex,
  largeCollection,
} from "../../mod.ts"
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

Deno.test("ext - zod", async (t) => {
  await t.step("Should correctly parse insert model", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        users: collection(zodModel(UserSchema)),
        i_users: indexableCollection(zodModel(UserSchema), { indices: {} }),
        l_users: largeCollection(zodModel(UserSchema)),
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

      const cr3 = await db.l_users.add({
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
})
