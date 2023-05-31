import { createTestUser, createTestUsers, db, reset } from "../config.ts"

const testUser1 = createTestUser()
const testUser2 = createTestUser()
const testUsers_10 = createTestUsers(10)
const testUsers_100 = createTestUsers(100)
const testUsers_1000 = createTestUsers(1_000)
const testUsers_10000 = createTestUsers(10_000)

await reset()

Deno.bench("COLLECTION - add - 1 object", async () => {
  await db.users.add(testUser1)
})

await reset()

Deno.bench("COLLECTION - addMany - 10 objects", async () => {
  await db.users.addMany(...testUsers_10)
})

await reset()

Deno.bench("COLLECTION - set - 1 object", async () => {
  await db.users.set("user1", testUser1)
})

await reset()

await db.users.set("user1", testUser1)
Deno.bench("COLLECTION - update - 1 object, partial", async () => {
  await db.users.update("user1", {
    email: "dasdasdgmail.com",
    age: 66,
  })
})

await reset()

await db.users.set("user1", testUser1)
Deno.bench("COLLECTION - update - 1 object, full", async () => {
  await db.users.update("user1", testUser2)
})
