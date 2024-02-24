import { collection, kvdex, model } from "../../mod.ts"
import { assert } from "../test.deps.ts"
import { sleep, useKv } from "../utils.ts"
import { mockUser1, mockUser2, mockUser3 } from "../mocks.ts"
import type { User } from "../models.ts"

Deno.test("collection - history", async (t) => {
  await t.step(
    "Should persist history of multiple inserts in correct order",
    async () => {
      await useKv(async (kv) => {
        const db = kvdex(kv, {
          users: collection(model<User>(), { history: true }),
        })

        const id = "id"
        await db.users.set(id, mockUser1, { overwrite: true })
        await sleep(10)
        await db.users.set(id, mockUser2, { overwrite: true })
        await sleep(10)
        await db.users.set(id, mockUser3, { overwrite: true })

        const { result: [h1, h2, h3] } = await db.users.findHistory(id)
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
          users: collection(model<User>(), { history: true }),
        })

        const id = "id"
        await db.users.set(id, mockUser1, { overwrite: true })
        await sleep(10)
        await db.users.delete(id)
        await sleep(10)
        await db.users.set(id, mockUser2, { overwrite: true })
        await sleep(10)
        await db.users.set(id, mockUser3, { overwrite: true })
        await sleep(10)
        await db.users.delete(id)

        const { result: [h1, h2, h3, h4, h5] } = await db.users.findHistory(id)
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
          users: collection(model<User>(), { history: true }),
        })

        const id = "id"
        await db.users.set(id, mockUser1, { overwrite: true })
        await sleep(10)
        await db.users.update(id, mockUser2)
        await sleep(10)
        await db.users.update(id, mockUser3)

        const { result: [h1, h2, h3] } = await db.users.findHistory(id)
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
          users: collection(model<User>(), { history: true }),
        })

        const id = "id"
        await db.users.set(id, mockUser1, { overwrite: true })
        await sleep(10)
        await db.users.deleteMany()
        await sleep(10)
        await db.users.set(id, mockUser2, { overwrite: true })
        await sleep(10)
        await db.users.deleteMany({ filter: () => true })

        const { result: [h1, h2, h3, h4] } = await db.users.findHistory(id)
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
          users: collection(model<User>()),
        })

        const id = "id"
        await db.users.set(id, mockUser1, { overwrite: true })
        await db.users.update(id, mockUser2)
        await db.users.delete(id)
        await db.users.deleteMany()

        const { result: history } = await db.users.findHistory(id)
        assert(history.length === 0)
      })
    },
  )

  await t.step("Should find filtered history", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        users: collection(model<User>(), { history: true }),
      })

      const id = "id"
      await db.users.set(id, mockUser1, { overwrite: true })
      await db.users.delete(id)
      await db.users.set(id, mockUser2, { overwrite: true })
      await db.users.update(id, mockUser3)

      const { result: history1 } = await db.users.findHistory(id, {
        filter: (entry) => entry.type === "delete",
      })

      const { result: history2 } = await db.users.findHistory(id, {
        filter: (entry) =>
          entry.type === "write" && entry.value.age === mockUser1.age,
      })

      assert(history1.length === 1)
      assert(history2.length === 2)

      assert(
        history2.some((h) =>
          h.type === "write" && h.value.username === mockUser1.username
        ),
      )

      assert(
        history2.some((h) =>
          h.type === "write" && h.value.username === mockUser2.username
        ),
      )
    })
  })

  await t.step("Should delete all document history", async () => {
    await useKv(async (kv) => {
      const db = kvdex(kv, {
        users: collection(model<User>(), { history: true }),
      })

      const id = "id"
      await db.users.set(id, mockUser1, { overwrite: true })
      await db.users.set(id, mockUser2, { overwrite: true })
      await db.users.set(id, mockUser3, { overwrite: true })
      const cr = await db.users.add(mockUser1)

      assert(cr.ok)

      const { result: history1_1 } = await db.users.findHistory(id)
      const { result: history1_2 } = await db.users.findHistory(cr.id)
      assert(history1_1.length === 3)
      assert(history1_2.length === 1)

      await db.users.deleteHistory(id)

      const { result: history2_1 } = await db.users.findHistory(id)
      const { result: history2_2 } = await db.users.findHistory(cr.id)
      assert(history2_1.length === 0)
      assert(history2_2.length === 1)
    })
  })
})
