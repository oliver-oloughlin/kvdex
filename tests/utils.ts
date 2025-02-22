import { collection, type DenoKv, type DenoKvU64, kvdex } from "../mod.ts";
import { brotliCompressor } from "../src/ext/encoding/brotli/brotli_compressor.ts";
import { jsonEncoder } from "../src/ext/encoding/mod.ts";
import { MapKv } from "../src/ext/kv/map_kv.ts";
import { StorageAdapter } from "../src/ext/kv/mod.ts";
import { model } from "../src/model.ts";
import { TransformUserModel, type User, UserSchema } from "./models.ts";

export const testEncoder = jsonEncoder({
  compressor: brotliCompressor(),
});

// Create test db
export function createDb(kv: DenoKv) {
  return kvdex({
    kv,
    schema: {
      u64s: collection(model<DenoKvU64>()),
      s_u64s: collection(model<DenoKvU64>(), {
        encoder: testEncoder,
      }),
      users: collection(model<User>()),
      i_users: collection(model<User>(), {
        indices: {
          username: "primary",
          age: "secondary",
        },
      }),
      s_users: collection(model<User>(), {
        encoder: testEncoder,
      }),
      is_users: collection(model<User>(), {
        indices: {
          username: "primary",
          age: "secondary",
        },
        encoder: testEncoder,
      }),
      z_users: collection(UserSchema),
      zi_users: collection(UserSchema, {
        indices: {
          username: "primary",
          age: "secondary",
        },
      }),
      zs_users: collection(UserSchema, {
        encoder: testEncoder,
      }),
      zis_users: collection(UserSchema, {
        indices: {
          username: "primary",
          age: "secondary",
        },
        encoder: testEncoder,
      }),
      a_users: collection(TransformUserModel),
      ai_users: collection(TransformUserModel, {
        indices: {
          name: "primary",
          decadeAge: "secondary",
        },
      }),
      as_users: collection(TransformUserModel, {
        encoder: testEncoder,
      }),
      ais_users: collection(TransformUserModel, {
        indices: {
          name: "primary",
          decadeAge: "secondary",
        },
        encoder: testEncoder,
      }),
    },
  });
}

// Temporary use functions
export async function useKv(
  fn: (kv: DenoKv) => unknown,
) {
  const kvArg = Deno.args[0];

  const kv = kvArg === "map"
    ? new MapKv({ clearOnClose: true })
    : kvArg === "map-localstorage"
    ? new MapKv({ map: new StorageAdapter(localStorage), clearOnClose: true })
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
      username: `user_${i}`,
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

export function generateUsers(n: number) {
  const users: User[] = [];

  for (let i = 0; i < n; i++) {
    const r = Math.random();
    users.push({
      username: `user_${i}`,
      age: Math.floor(15 + i / 5),
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

// Sleep functions
export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function createResolver() {
  let resolve = (_?: unknown) => {};
  const promise = new Promise((r) => resolve = r);
  return {
    resolve,
    promise,
  };
}
