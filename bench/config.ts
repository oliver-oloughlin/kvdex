import { createDb, type Model } from "../mod.ts"

interface User extends Model {
  email: string
  username: string
  age: number
  friends: string[]
  address: {
    country: string
    city: string
    street?: string
  } | null
  created: Date
}

const kv = await Deno.openKv()

export const db = createDb(kv, (builder) => ({
  u64s: builder.collection<Deno.KvU64>(["bench", "u64s"]),
  users: builder.collection<User>(["bench", "users"]),
  iusers: builder.indexableCollection<User>(["bench", "iusers"]).indices({
    email: "primary",
    username: "primary",
    age: "secondary",
  }),
}))

export async function reset() {
  await db.u64s.deleteMany()
  await db.users.deleteMany()
  await db.iusers.deleteMany()
}

export function createTestUser(): User {
  return {
    email: crypto.randomUUID(),
    username: crypto.randomUUID(),
    age: Math.floor(Math.random() * 100),
    address: {
      country: "Norway",
      city: "Bergen",
      street: "Sesame",
    },
    friends: ["Friend1", "Friend2", "Friend3"],
    created: new Date(),
  }
}

export function createTestUsers(n: number) {
  const users: User[] = []
  for (let i = 0; i < n; i++) {
    users.push(createTestUser())
  }
  return users
}
