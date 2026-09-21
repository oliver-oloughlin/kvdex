import { collection, type DenoKv, type DenoKvU64, kvdex } from "../mod.ts";
import { brotliCompressor } from "../src/ext/encoding/brotli/brotli_compressor.ts";
import { jsonEncoder } from "../src/ext/encoding/mod.ts";
import { type MapKv, mapKv } from "../src/ext/kv/map/mod.ts";
import { type StorageAdapter, storageAdapter } from "../src/ext/kv/mod.ts";
import { model } from "../src/core/model.ts";
import { TransformUserModel, type User, UserSchema } from "./models.ts";
import "fake-indexeddb/auto";
import {
  type IndexedDbAdapter,
  indexedDbAdapter,
} from "../src/ext/kv/map/indexed_db_adapter.ts";
import { ulid } from "@std/ulid/ulid";
import type { Encoder, KvId } from "../src/core/types.ts";
import { assert, assertEquals } from "@std/assert";

export const testEncoder = jsonEncoder({
  compressor: brotliCompressor(),
});

// Create test db
export function createDb(kv: DenoKv) {
  return kvdex({
    kv,
    schema: {
      u64s: collection({ model: model<DenoKvU64>() }),
      s_u64s: collection({ model: model<DenoKvU64>(), encoder: testEncoder }),
      users: collection({ model: model<User>() }),
      i_users: collection({
        model: model<User>(),
        indices: {
          username: "primary",
          age: "secondary",
        },
      }),
      s_users: collection({ model: model<User>(), encoder: testEncoder }),
      is_users: collection({
        model: model<User>(),
        indices: {
          username: "primary",
          age: "secondary",
        },
        encoder: testEncoder,
      }),
      z_users: collection({ model: UserSchema }),
      zi_users: collection({
        model: UserSchema,
        indices: {
          username: "primary",
          age: "secondary",
        },
      }),
      zs_users: collection({ model: UserSchema, encoder: testEncoder }),
      zis_users: collection({
        model: UserSchema,
        indices: {
          username: "primary",
          age: "secondary",
        },
        encoder: testEncoder,
      }),
      a_users: collection({ model: TransformUserModel }),
      ai_users: collection({
        model: TransformUserModel,
        indices: {
          name: "primary",
          decadeAge: "secondary",
        },
      }),
      as_users: collection({ model: TransformUserModel, encoder: testEncoder }),
      ais_users: collection({
        model: TransformUserModel,
        indices: {
          name: "primary",
          decadeAge: "secondary",
        },
        encoder: testEncoder,
      }),
      multi_part_id_u64s: collection({
        model: model<DenoKvU64>(),
        idGenerator: () => [ulid(), Math.random()] as KvId,
      }),
      multi_part_id_nums: collection({
        model: model<number>(),
        idGenerator: () => [ulid(), Math.random()] as KvId,
      }),
      s_multi_part_id_nums: collection({
        model: model<number>(),
        encoder: testEncoder,
        idGenerator: () => [ulid(), Math.random()] as KvId,
      }),
      i_multi_part_id_users: collection({
        model: model<User>(),
        indices: {
          username: "primary",
          age: "secondary",
        },
        idGenerator: () => [ulid(), Math.random()] as KvId,
      }),
      is_multi_part_id_users: collection({
        model: model<User>(),
        indices: {
          username: "primary",
          age: "secondary",
        },
        encoder: testEncoder,
        idGenerator: () => [ulid(), Math.random()] as KvId,
      }),
    },
  });
}

// Instance functions
export async function useKv(
  fn: (kv: DenoKv) => unknown,
) {
  const kvArg = Deno.args[0];

  const kv = kvArg === "map"
    ? mapKv({ clearOnClose: true })
    : kvArg === "map_local_storage"
    ? mapKv({ map: storageAdapter(localStorage), clearOnClose: true })
    : kvArg === "map_session_storage"
    ? mapKv({ map: storageAdapter(sessionStorage), clearOnClose: true })
    : kvArg === "map_indexed_db"
    ? mapKv({
      map: await indexedDbAdapter(),
      clearOnClose: true,
    })
    : await Deno.openKv(":memory:");

  const result = await fn(kv);
  await kv.close();

  if (typeof result === "function") {
    await result();
  }
}

export async function useDb(
  fn: (db: ReturnType<typeof createDb>) => unknown,
) {
  await useKv(async (kv) => {
    const db = createDb(kv);
    return await fn(db);
  });
}

export async function testNumericIndexProperties(
  test: Deno.TestContext,
  encoder?: Encoder,
) {
  const values = [100, 10, 2.5, 2, 0, -2, -10, -100];
  const ordered = [-100, -10, -2, 0, 2, 2.5, 10, 100];
  const cases = [
    { name: "unbounded", options: {}, expected: ordered },
    {
      name: "inclusive start",
      options: { startValue: 2 },
      expected: [2, 2.5, 10, 100],
    },
    {
      name: "exclusive end",
      options: { endValue: 2 },
      expected: [-100, -10, -2, 0],
    },
    {
      name: "cross-digit range",
      options: { startValue: 2, endValue: 10 },
      expected: [2, 2.5],
    },
    {
      name: "negative range",
      options: { startValue: -100, endValue: -2 },
      expected: [-100, -10],
    },
    {
      name: "empty range",
      options: { startValue: 3, endValue: 10 },
      expected: [],
    },
  ];

  await useKv(async (kv) => {
    const db = kvdex({
      kv,
      schema: {
        numbers: collection({
          model: model<{
            primary: number;
            secondary: number;
            marked: boolean;
          }>(),
          indices: { primary: "primary", secondary: "secondary" },
          encoder,
        }),
      },
    });
    const seed = async () => {
      await db.numbers.deleteMany();
      assert(
        (await db.numbers.addMany(
          values.map((value) => ({
            primary: value,
            secondary: value,
            marked: false,
          })),
        )).ok,
      );
    };
    const markedValues = async () => {
      const { result } = await db.numbers.getMany();
      return result.filter((doc) => doc.value.marked)
        .map((doc) => doc.value.primary)
        .sort((first, second) => first - second);
    };

    for (const index of ["primary", "secondary"] as const) {
      for (const scenario of cases) {
        for (const reverse of [false, true]) {
          await test.step(
            `${index}: ${scenario.name}, reverse=${reverse}`,
            async () => {
              const options = { ...scenario.options, reverse };
              const expected = reverse
                ? [...scenario.expected].reverse()
                : scenario.expected;
              await seed();

              const many = await db.numbers.getManyByOrder(index, options);
              assertEquals(
                many.result.map((doc) => doc.value[index]),
                expected,
                "getManyByOrder",
              );
              const one = await db.numbers.getOneByOrder(index, options);
              assertEquals(one?.value[index], expected[0], "getOneByOrder");
              const mapped = await db.numbers.mapByOrder(
                index,
                (doc) => doc.value[index],
                options,
              );
              assertEquals(mapped.result, expected, "mapByOrder");
              const visited: number[] = [];
              await db.numbers.forEachByOrder(
                index,
                (doc) => visited.push(doc.value[index]),
                options,
              );
              assertEquals(visited, expected, "forEachByOrder");
              assertEquals(
                await db.numbers.countByOrder(index, options),
                expected.length,
                "countByOrder",
              );

              await db.numbers.updateOneByOrder(
                index,
                { marked: true },
                options,
              );
              assertEquals(
                await markedValues(),
                expected.slice(0, 1),
                "updateOneByOrder",
              );

              await seed();
              await db.numbers.updateManyByOrder(
                index,
                { marked: true },
                options,
              );
              assertEquals(
                await markedValues(),
                scenario.expected,
                "updateManyByOrder",
              );

              await seed();
              await db.numbers.deleteManyByOrder(index, options);
              const remaining = await db.numbers.getMany();
              assertEquals(
                remaining.result.map((doc) => doc.value[index])
                  .sort((first, second) => first - second),
                ordered.filter((value) => !expected.includes(value)),
                "deleteManyByOrder",
              );
            },
          );
        }
      }
    }

    await test.step("Numeric index lifecycle", async () => {
      await seed();
      const zero = await db.numbers.findBy("primary", 0);
      assert(zero);
      assert((await db.numbers.update(zero.id, { secondary: 0 })).ok);
      assert(
        !(await db.numbers.add({
          primary: 0,
          secondary: 0,
          marked: false,
        })).ok,
      );
      assert(
        (await db.numbers.update(zero.id, {
          primary: 3,
          secondary: 3,
        })).ok,
      );
      assertEquals(await db.numbers.findBy("primary", 0), null);
      assertEquals((await db.numbers.getManyBy("secondary", 0)).result, []);
      assertEquals((await db.numbers.findBy("primary", 3))?.id, zero.id);
      assertEquals(
        (await db.numbers.getManyBy("secondary", 3)).result.map((doc) =>
          doc.id
        ),
        [zero.id],
      );
      assert((await db.numbers.deleteBy("primary", 3)).ok);
      assertEquals(await db.numbers.findBy("primary", 3), null);
      assertEquals((await db.numbers.getManyBy("secondary", 3)).result, []);
    });
  });
}

export async function useMapKv(
  fn: (kv: MapKv) => unknown,
) {
  const kv = mapKv({ clearOnClose: true });
  await fn(kv);
  await kv.close();
}

export async function useLocalStorageMap(
  fn: (store: StorageAdapter<any, any>) => unknown,
) {
  const store = storageAdapter(localStorage);
  await fn(store);
  store.clear();
}

export async function useSessionStorageMap(
  fn: (store: StorageAdapter<any, any>) => unknown,
) {
  const store = storageAdapter(sessionStorage);
  await fn(store);
  store.clear();
}

export async function useIndexedDbMap(
  fn: (store: IndexedDbAdapter<any, any>) => unknown,
) {
  const map = await indexedDbAdapter();
  await fn(map);
  await map.clear();
  map.close();
}

// Generator functions
export function generateLargeUsers(n: number) {
  const users: User[] = [];

  let country = "";
  for (let i = 0; i < 300_000; i++) {
    country += "A";
  }

  for (let i = 0; i < n; i++) {
    const r = Math.random();
    users.push({
      username: crypto.randomUUID(),
      age: Math.floor(15 + i / 5),
      address: {
        country,
        city: r < 0.5 ? "Bergen" : "Oslo",
        street: r < 0.5 ? "Olav Kyrres gate" : "Karl Johans gate",
        houseNr: Math.round(Math.random() * 100),
      },
    });
  }

  return users;
}

export function generateUsers(n: number, age?: number) {
  const users: User[] = [];

  for (let i = 0; i < n; i++) {
    const r = Math.random();
    users.push({
      username: crypto.randomUUID(),
      age: age ?? Math.floor(15 + i / 5),
      address: {
        country: "Norway",
        city: r < 0.5 ? "Bergen" : "Oslo",
        street: r < 0.5 ? "Olav Kyrres gate" : "Karl Johans gate",
        houseNr: Math.round(Math.random() * 100),
      },
    });
  }

  return users;
}

export function generateInvalidUsers(n: number) {
  const users: User[] = [];

  for (let i = 0; i < n; i++) {
    users.push({
      username: 100,
      age: Math.floor(15 + i / 5),
      address: {
        street: 100n,
      },
    } as unknown as User);
  }

  return users;
}

export function generateNumbers(n: number) {
  const numbers: number[] = [];

  for (let i = 0; i < n; i++) {
    numbers.push(i);
  }

  return numbers;
}

// Promise helpers
export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
