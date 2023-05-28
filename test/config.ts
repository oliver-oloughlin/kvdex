import { createDb, type Model } from "../mod.ts"

export interface Person extends Model {
  name: string
  age: number
  friends: string[]
  address: {
    country: string
    city: string
    postcode: number
  }
}

export const testPerson: Person = {
  name: "Oliver",
  age: 24,
  friends: ["Elias", "Anders"],
  address: {
    country: "Norway",
    city: "Bergen",
    postcode: 420,
  },
}

export const testPerson2: Person = {
  name: "Anders",
  age: 24,
  friends: ["Oliver", "Elias"],
  address: {
    country: "Norway",
    city: "Oslo",
    postcode: 1024,
  },
}

const kv = await Deno.openKv()

export const db = createDb(kv, (cb) => ({
  people: cb.collection<Person>(["people"]),
  indexablePeople: cb.indexableCollection<Person>(["indexablePeople"], {
    name: "primary",
    age: "secondary",
  }),
  values: {
    numbers: cb.collection<number>(["values", "numbers"]),
    strings: cb.collection<string>(["values", "strings"]),
    u64s: cb.collection<Deno.KvU64>(["values", "u64s"]),
  },
  arrs: cb.collection<string[]>(["arrs"]),
  dates: cb.collection<Date>(["dates"]),
}))

export async function reset() {
  await db.people.deleteMany()
  await db.indexablePeople.deleteMany()
  await db.values.numbers.deleteMany()
  await db.values.strings.deleteMany()
  await db.values.u64s.deleteMany()
  await db.arrs.deleteMany()
  await db.dates.deleteMany()
}
