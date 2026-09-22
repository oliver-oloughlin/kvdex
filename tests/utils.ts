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
import type {
  DenoKvStrictKeyPart,
  Encoder,
  KvId,
  KvValue,
} from "../src/core/types.ts";
import { encodeData, keyEq } from "../src/core/utils.ts";
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

export async function testIndexProperties(
  test: Deno.TestContext,
  encoder?: Encoder,
) {
  const datasets: { name: string; ordered: DenoKvStrictKeyPart[] }[] = [
    { name: "number", ordered: [-100, -10, -2, 0, 2, 2.5, 10, 100] },
    {
      name: "string",
      ordered: [
        "",
        "\u0000",
        "\n",
        '"',
        "A",
        "a",
        "aa",
        "z",
        "\ue000",
        "\u{10000}",
      ],
    },
    { name: "bigint", ordered: [-100n, -10n, -2n, 0n, 2n, 10n, 100n] },
    { name: "boolean", ordered: [false, true] },
    {
      name: "Uint8Array",
      ordered: [[], [0], [0, 0], [0, 255], [1], [2], [10], [255]]
        .map((bytes) => new Uint8Array(bytes)),
    },
    {
      name: "mixed native types",
      ordered: [
        new Uint8Array(),
        new Uint8Array([1]),
        "",
        "a",
        2n,
        10n,
        2,
        10,
        false,
        true,
      ],
    },
  ];

  for (const dataset of datasets) {
    await test.step(dataset.name, async (test) => {
      await testOrderedIndexProperties(test, dataset.ordered, encoder);
    });
  }

  await test.step("Encoded objects must not collide with native bytes", async () => {
    await useKv(async (kv) => {
      const db = kvdex({
        kv,
        schema: {
          entries: collection({
            model: model<{ primary: KvValue; secondary: KvValue }>(),
            indices: { primary: "primary", secondary: "secondary" },
            encoder,
          }),
        },
      });
      for (
        const value of [
          null,
          { name: "object" },
          ["array", 2],
          new Map([["key", "value"]]),
          new Set(["value"]),
          new Date(0),
        ]
      ) {
        const bytes = await encodeData(value, encoder);
        const objectResult = await db.entries.add({
          primary: value,
          secondary: value,
        });
        const bytesResult = await db.entries.add({
          primary: bytes,
          secondary: bytes,
        });
        assert(objectResult.ok);
        assert(bytesResult.ok);
        assert(
          !(await db.entries.add({ primary: value, secondary: value })).ok,
        );
        assert(
          !(await db.entries.add({ primary: bytes, secondary: bytes })).ok,
        );
        assertEquals(
          (await db.entries.findBy("primary", value))?.id,
          objectResult.id,
        );
        assertEquals(
          (await db.entries.findBy("primary", bytes))?.id,
          bytesResult.id,
        );
        assertEquals(
          (await db.entries.getManyBy("secondary", value)).result.map((doc) =>
            doc.id
          ),
          [objectResult.id],
        );
        assertEquals(
          (await db.entries.getManyBy("secondary", bytes)).result.map((doc) =>
            doc.id
          ),
          [bytesResult.id],
        );
        assert(
          (await db.entries.update(objectResult.id, { secondary: value })).ok,
        );
        assert(
          (await db.entries.update(objectResult.id, { secondary: bytes })).ok,
        );
        assertEquals(
          (await db.entries.getManyBy("secondary", value)).result,
          [],
        );
        assertEquals(
          (await db.entries.getManyBy("secondary", bytes)).result.length,
          2,
        );
        assert((await db.entries.deleteBy("primary", value)).ok);
        assertEquals(await db.entries.findBy("primary", value), null);
        assertEquals(
          (await db.entries.getManyBy("secondary", bytes)).result.map((doc) =>
            doc.id
          ),
          [bytesResult.id],
        );
        assert((await db.entries.deleteBy("primary", bytes)).ok);
        assertEquals(await db.entries.count(), 0);
        assertEquals(await db.entries.countByOrder("primary"), 0);
        assertEquals(await db.entries.countByOrder("secondary"), 0);
      }
    });
  });
}

async function testOrderedIndexProperties(
  test: Deno.TestContext,
  ordered: DenoKvStrictKeyPart[],
  encoder?: Encoder,
) {
  const values = [...ordered].reverse();
  const start = Math.floor(ordered.length / 2);
  const end = ordered.length - 1;
  const rank = (value: DenoKvStrictKeyPart) =>
    ordered.findIndex((candidate) => keyEq([candidate], [value]));
  const cases = [
    { name: "unbounded", options: {}, expected: ordered },
    {
      name: "inclusive start",
      options: { startValue: ordered[start] },
      expected: ordered.slice(start),
    },
    {
      name: "exclusive end",
      options: { endValue: ordered[start] },
      expected: ordered.slice(0, start),
    },
    {
      name: "bounded range",
      options: { startValue: ordered[start], endValue: ordered[end] },
      expected: ordered.slice(start, end),
    },
    {
      name: "lower range",
      options: { startValue: ordered[0], endValue: ordered[start] },
      expected: ordered.slice(0, start),
    },
    {
      name: "empty range",
      options: { startValue: ordered[end], endValue: ordered[end] },
      expected: [],
    },
  ];

  if (typeof ordered[0] === "number") {
    cases.push(
      {
        name: "cross-digit numeric range",
        options: { startValue: 2, endValue: 10 },
        expected: [2, 2.5],
      },
      {
        name: "negative numeric range",
        options: { startValue: -100, endValue: -2 },
        expected: [-100, -10],
      },
    );
  }

  await useKv(async (kv) => {
    const db = kvdex({
      kv,
      schema: {
        numbers: collection({
          model: model<{
            primary: DenoKvStrictKeyPart;
            secondary: DenoKvStrictKeyPart;
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
        .sort((first, second) => rank(first) - rank(second));
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
              const visited: DenoKvStrictKeyPart[] = [];
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
                  .sort((first, second) => rank(first) - rank(second)),
                ordered.filter((value) =>
                  !expected.some((selected) => keyEq([selected], [value]))
                ),
                "deleteManyByOrder",
              );
            },
          );
        }
      }
    }

    await test.step("Index lifecycle", async () => {
      await seed();
      const first = ordered[0];
      const last = ordered[end];
      const zero = await db.numbers.findBy("primary", first);
      assert(zero);
      assert((await db.numbers.update(zero.id, { secondary: first })).ok);
      assert(
        !(await db.numbers.add({
          primary: first,
          secondary: first,
          marked: false,
        })).ok,
      );
      assert((await db.numbers.deleteBy("primary", last)).ok);
      assert(
        (await db.numbers.update(zero.id, {
          primary: last,
          secondary: last,
        })).ok,
      );
      assertEquals(await db.numbers.findBy("primary", first), null);
      assertEquals((await db.numbers.getManyBy("secondary", first)).result, []);
      assertEquals((await db.numbers.findBy("primary", last))?.id, zero.id);
      assertEquals(
        (await db.numbers.getManyBy("secondary", last)).result.map((doc) =>
          doc.id
        ),
        [zero.id],
      );
      assert((await db.numbers.deleteBy("primary", last)).ok);
      assertEquals(await db.numbers.findBy("primary", last), null);
      assertEquals((await db.numbers.getManyBy("secondary", last)).result, []);
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
export function generateIncompressibleUser(): User {
  const [user] = generateUsers(1);
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const country = Array.from({ length: 4 }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(65_536));
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(
      "",
    );
  }).join("");
  return { ...user, address: { ...user.address, country } };
}

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
