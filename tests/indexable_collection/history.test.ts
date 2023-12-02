import { collection, kvdex, model } from "../../mod.ts"
import { assert } from "../deps.ts"
import { sleep, useKv } from "../utils.ts"
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts"
import type { User } from "../models.ts"

Deno.test("indexable_collection - history", async (t) => {
  await t.step(
    "Should persist history of multiple inserts in correct order",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          users: collection(model<User>(), {
            history: true,
            indices: {
              username: "primary",
              age: "secondary",
            },
          }),
        })

        const id = "id"
        await db.users.write(id, mockUser1)
        await sleep(10)
        await db.users.write(id, mockUser2)
        await sleep(10)
        await db.users.write(id, mockUser3)

        const [h1, h2, h3] = await db.users.findHistory(id)
        assert(h1.type === "write")
        assert(h1.value.username === mockUser1.username)
        assert(h1.timestamp.valueOf() <= h2.timestamp.valueOf())
        assert(h2.type === "write")
        assert(h2.value.username === mockUser2.username)
        assert(h2.timestamp.valueOf() <= h3.timestamp.valueOf())
        assert(h3.type === "write")
        assert(h3.value.username === mockUser3.username)
      })
    },
  )

  await t.step(
    "Should persist history of multiple inserts in correct order after deleting",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          users: collection(model<User>(), {
            history: true,
            indices: {
              username: "primary",
              age: "secondary",
            },
          }),
        })

        const id = "id"
        await db.users.write(id, mockUser1)
        await sleep(10)
        await db.users.delete(id)
        await sleep(10)
        await db.users.write(id, mockUser2)
        await sleep(10)
        await db.users.write(id, mockUser3)
        await sleep(10)
        await db.users.delete(id)

        const [h1, h2, h3, h4, h5] = await db.users.findHistory(id)
        assert(h1.type === "write")
        assert(h1.value.username === mockUser1.username)
        assert(h1.timestamp.valueOf() <= h2.timestamp.valueOf())
        assert(h2.type === "delete")
        assert(h2.timestamp.valueOf() <= h3.timestamp.valueOf())
        assert(h3.type === "write")
        assert(h3.value.username === mockUser2.username)
        assert(h3.timestamp.valueOf() <= h4.timestamp.valueOf())
        assert(h4.type === "write")
        assert(h4.value.username === mockUser3.username)
        assert(h4.timestamp.valueOf() <= h5.timestamp.valueOf())
        assert(h5.type === "delete")
      })
    },
  )

  await t.step(
    "Should persist history of multiple inserts and updates in correct order",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          users: collection(model<User>(), {
            history: true,
            indices: {
              username: "primary",
              age: "secondary",
            },
          }),
        })

        const id = "id"
        await db.users.write(id, mockUser1)
        await sleep(10)
        await db.users.update(id, mockUser2)
        await sleep(10)
        await db.users.update(id, mockUser3)

        const [h1, h2, h3] = await db.users.findHistory(id)
        assert(h1.type === "write")
        assert(h1.value.username === mockUser1.username)
        assert(h1.timestamp.valueOf() <= h2.timestamp.valueOf())
        assert(h2.type === "write")
        assert(h2.value.username === mockUser2.username)
        assert(h2.timestamp.valueOf() <= h3.timestamp.valueOf())
        assert(h3.type === "write")
        assert(h3.value.username === mockUser3.username)
      })
    },
  )

  await t.step(
    "Should persist version history of insert and delete by deleteMany()",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          users: collection(model<User>(), {
            history: true,
            indices: {
              username: "primary",
              age: "secondary",
            },
          }),
        })

        const id = "id"
        await db.users.write(id, mockUser1)
        await sleep(10)
        await db.users.deleteMany()
        await sleep(10)
        await db.users.write(id, mockUser2)
        await sleep(10)
        await db.users.deleteMany({ filter: () => true })

        const [h1, h2, h3, h4] = await db.users.findHistory(id)
        assert(h1.type === "write")
        assert(h1.value.username === mockUser1.username)
        assert(h1.timestamp.valueOf() <= h2.timestamp.valueOf())
        assert(h2.type === "delete")
        assert(h2.timestamp.valueOf() <= h3.timestamp.valueOf())
        assert(h3.type === "write")
        assert(h3.value.username === mockUser2.username)
        assert(h3.timestamp.valueOf() <= h4.timestamp.valueOf())
        assert(h4.type === "delete")
      })
    },
  )

  await t.step(
    "Should not find history",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          users: collection(model<User>(), {
            indices: {
              username: "primary",
              age: "secondary",
            },
          }),
        })

        const id = "id"
        await db.users.write(id, mockUser1)
        await db.users.update(id, mockUser2)
        await db.users.delete(id)
        await db.users.deleteMany()

        const history = await db.users.findHistory(id)
        assert(history.length === 0)
      })
    },
  )

  await t.step("Should delete all document history", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        users: collection(model<User>(), {
          history: true,
          indices: {
            username: "primary",
            age: "secondary",
          },
        }),
      })

      const id = "id"
      await db.users.write(id, mockUser1)
      await db.users.write(id, mockUser2)
      await db.users.write(id, mockUser3)
      const cr = await db.users.add(mockUser1)

      assert(cr.ok)

      const history1_1 = await db.users.findHistory(id)
      const history1_2 = await db.users.findHistory(cr.id)
      assert(history1_1.length === 3)
      assert(history1_2.length === 1)

      await db.users.deleteHistory(id)

      const history2_1 = await db.users.findHistory(id)
      const history2_2 = await db.users.findHistory(cr.id)
      assert(history2_1.length === 0)
      assert(history2_2.length === 1)
    })
  })
})
