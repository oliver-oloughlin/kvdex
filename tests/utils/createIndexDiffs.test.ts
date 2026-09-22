import { assert, assertEquals } from "@std/assert";
import { Collection } from "../../src/core/collection.ts";
import { DEFAULT_BASE_KEY_PREFIX } from "../../src/core/constants.ts";
import { model } from "../../src/core/model.ts";
import {
  createIndexDiffs,
  encodeData,
  extendKey,
} from "../../src/core/utils.ts";
import { testEncoder, useKv } from "../utils.ts";
import { jsonEncoder } from "../../src/common/json.ts";
import type {
  DenoKvStrictKeyPart,
  KvKey,
  KvValue,
} from "../../src/core/types.ts";
import { equals } from "@std/bytes/equals";

type User = {
  username: string;
  email?: string;
  age: number;
  bornYear?: number;
};

const keyIncludesEncodedPart = (part: DenoKvStrictKeyPart) => {
  return (key: KvKey) =>
    key.some((keyPart) =>
      part instanceof Uint8Array
        ? keyPart instanceof Uint8Array && equals(part, keyPart)
        : Object.is(part, keyPart)
    );
};

const keyIncludesStringPart = (part: string) => {
  return (key: KvKey) => key.some((p) => p === part);
};

Deno.test("utils - createIndexDiffs", async (t) => {
  for (const encoder of [undefined, testEncoder]) {
    await t.step(
      `Should diff byte-backed indices (${encoder ? "compressed" : "plain"})`,
      async (t) => {
        await useKv(async (kv) => {
          type IndexedValue = { primary?: KvValue; secondary?: KvValue };
          const collection = new Collection(
            kv,
            ["values"],
            new Map<any, any>(),
            () => Promise.resolve(),
            [DEFAULT_BASE_KEY_PREFIX],
            {
              model: model<IndexedValue>(),
              encoder,
              indices: { primary: "primary", secondary: "secondary" },
            },
          );
          const cases = [
            { name: "object", old: { value: 1 }, next: { value: 2 } },
            { name: "array", old: [1, 2], next: [1, 3] },
            {
              name: "Map",
              old: new Map([["key", 1]]),
              next: new Map([["key", 2]]),
            },
            { name: "Set", old: new Set([1, 2]), next: new Set([1, 3]) },
            { name: "Date", old: new Date(0), next: new Date(1) },
            {
              name: "Uint8Array",
              old: new Uint8Array(),
              next: new Uint8Array([0, 1]),
            },
            {
              name: "object to matching serialized bytes",
              old: { value: 1 },
              next: await encodeData({ value: 1 }, encoder),
            },
          ];
          const expectedPart = async (value: KvValue) =>
            value instanceof Uint8Array
              ? new Uint8Array([0, ...value])
              : new Uint8Array([1, ...await encodeData(value, encoder)]);
          const id = "document";
          const idKey = extendKey(collection["keys"].id, id);

          for (const entry of cases) {
            await t.step(entry.name, async () => {
              const oldPart = await expectedPart(entry.old);
              const newPart = await expectedPart(entry.next);
              assert(!equals(oldPart, newPart));
              const primaryKey = (part: Uint8Array) =>
                extendKey(collection["keys"].primaryIndex, "primary", part);
              const secondaryKey = (part: Uint8Array) =>
                extendKey(
                  collection["keys"].secondaryIndex,
                  "secondary",
                  part,
                  id,
                );
              const oldData = { primary: entry.old, secondary: entry.old };
              const transitions = [
                {
                  name: "changed",
                  old: oldData,
                  next: { primary: entry.next, secondary: entry.next },
                  deleted: true,
                  inserted: true,
                  checked: true,
                  part: newPart,
                },
                {
                  name: "equal but distinct instances",
                  old: oldData,
                  next: structuredClone(oldData),
                  deleted: false,
                  inserted: true,
                  checked: false,
                  part: oldPart,
                },
                {
                  name: "removed",
                  old: oldData,
                  next: {},
                  deleted: true,
                  inserted: false,
                  checked: false,
                  part: oldPart,
                },
                {
                  name: "added",
                  old: {},
                  next: oldData,
                  deleted: false,
                  inserted: true,
                  checked: true,
                  part: oldPart,
                },
              ];

              for (const transition of transitions) {
                const diffs = await createIndexDiffs(
                  id,
                  idKey,
                  null,
                  transition.old,
                  transition.next,
                  collection,
                );
                assertEquals(
                  diffs.deleteKeys,
                  transition.deleted
                    ? [primaryKey(oldPart), secondaryKey(oldPart)]
                    : [],
                  transition.name,
                );
                assertEquals(
                  diffs.insertPrimaryKeys,
                  transition.inserted ? [primaryKey(transition.part)] : [],
                  transition.name,
                );
                assertEquals(
                  diffs.insertSecondaryKeys,
                  transition.inserted ? [secondaryKey(transition.part)] : [],
                  transition.name,
                );
                assertEquals(
                  diffs.checkKeys,
                  transition.checked ? [primaryKey(transition.part)] : [],
                  transition.name,
                );
              }
            });
          }
        });
      },
    );
  }

  await t.step(
    "Should delete old primary and secondary indices and set new primary and secondary indices",
    async () => {
      await useKv(async (kv) => {
        const encoder = jsonEncoder();

        const collection = new Collection(
          kv,
          ["users"],
          new Map<any, any>(),
          () => Promise.resolve(),
          [DEFAULT_BASE_KEY_PREFIX],
          {
            model: model<User>(),
            encoder,
            indices: {
              username: "primary",
              email: "primary",
              age: "secondary",
              bornYear: "secondary",
            },
          },
        );

        const user1 = {
          username: "user1",
          email: "user1@example.com",
          age: 30,
          bornYear: 1990,
        } satisfies User;

        const user2 = {
          username: "user2",
          email: "user2@example.com",
          age: 25,
          bornYear: 1995,
        } satisfies User;

        const user1Encoded = {
          username: user1.username,
          email: user1.email,
          age: user1.age,
          bornYear: user1.bornYear,
        };

        const user2Encoded = {
          username: user2.username,
          email: user2.email,
          age: user2.age,
          bornYear: user2.bornYear,
        };

        const cr = await collection.add(user1);
        assert(cr.ok);

        const idKey = extendKey(collection["keys"].id, cr.id);

        const {
          insertPrimaryKeys,
          insertSecondaryKeys,
          deleteKeys,
          checkKeys,
        } = await createIndexDiffs(
          cr.id,
          idKey,
          cr.versionstamp,
          user1,
          user2,
          collection,
        );

        assertEquals(insertPrimaryKeys.length, 2);
        assertEquals(insertSecondaryKeys.length, 2);
        assertEquals(deleteKeys.length, 4);
        assertEquals(checkKeys.length, 2);

        assert(
          insertPrimaryKeys.some(keyIncludesEncodedPart(user2Encoded.username)),
        );
        assert(
          insertPrimaryKeys.some(keyIncludesEncodedPart(user2Encoded.email)),
        );
        assert(
          insertSecondaryKeys.some(keyIncludesEncodedPart(user2Encoded.age)),
        );
        assert(
          insertSecondaryKeys.some(
            keyIncludesEncodedPart(user2Encoded.bornYear),
          ),
        );

        assert(
          !insertPrimaryKeys.some(
            keyIncludesEncodedPart(user1Encoded.username),
          ),
        );
        assert(
          !insertPrimaryKeys.some(keyIncludesEncodedPart(user1Encoded.email)),
        );
        assert(
          !insertSecondaryKeys.some(keyIncludesEncodedPart(user1Encoded.age)),
        );
        assert(
          !insertSecondaryKeys.some(
            keyIncludesEncodedPart(user1Encoded.bornYear),
          ),
        );

        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.username)));
        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.email)));
        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.age)));
        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.bornYear)));

        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.username)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.email)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.age)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.bornYear)));

        assert(checkKeys.some(keyIncludesEncodedPart(user2Encoded.username)));
        assert(checkKeys.some(keyIncludesEncodedPart(user2Encoded.email)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user2Encoded.age)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user2Encoded.bornYear)));

        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.username)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.email)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.age)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.bornYear)));
      });
    },
  );

  await t.step(
    "Should delete old primary and secondary indices and set new primary and secondary indices while ignoring unchanged indices",
    async () => {
      await useKv(async (kv) => {
        const encoder = jsonEncoder();

        const collection = new Collection(
          kv,
          ["users"],
          new Map<any, any>(),
          () => Promise.resolve(),
          [DEFAULT_BASE_KEY_PREFIX],
          {
            model: model<User>(),
            encoder,
            indices: {
              username: "primary",
              email: "primary",
              age: "secondary",
              bornYear: "secondary",
            },
          },
        );

        const user1 = {
          username: "user1",
          email: "user@example.com",
          age: 30,
          bornYear: 1995,
        } satisfies User;

        const user2 = {
          username: "user2",
          email: "user@example.com",
          age: 25,
          bornYear: 1995,
        } satisfies User;

        const user1Encoded = {
          username: user1.username,
          email: user1.email,
          age: user1.age,
          bornYear: user1.bornYear,
        };

        const user2Encoded = {
          username: user2.username,
          email: user2.email,
          age: user2.age,
          bornYear: user2.bornYear,
        };

        const cr = await collection.add(user1);
        assert(cr.ok);

        const idKey = extendKey(collection["keys"].id, cr.id);

        const {
          insertPrimaryKeys,
          insertSecondaryKeys,
          deleteKeys,
          checkKeys,
        } = await createIndexDiffs(
          cr.id,
          idKey,
          cr.versionstamp,
          user1,
          user2,
          collection,
        );

        assertEquals(insertPrimaryKeys.length, 2);
        assertEquals(insertSecondaryKeys.length, 2);
        assertEquals(deleteKeys.length, 2);
        assertEquals(checkKeys.length, 1);

        assert(
          insertPrimaryKeys.some(keyIncludesEncodedPart(user2Encoded.username)),
        );
        assert(
          insertPrimaryKeys.some(keyIncludesEncodedPart(user2Encoded.email)),
        );
        assert(
          insertSecondaryKeys.some(keyIncludesEncodedPart(user2Encoded.age)),
        );
        assert(
          insertSecondaryKeys.some(
            keyIncludesEncodedPart(user2Encoded.bornYear),
          ),
        );

        assert(
          !insertPrimaryKeys.some(
            keyIncludesEncodedPart(user1Encoded.username),
          ),
        );
        assert(
          insertPrimaryKeys.some(keyIncludesEncodedPart(user1Encoded.email)),
        );
        assert(
          !insertSecondaryKeys.some(keyIncludesEncodedPart(user1Encoded.age)),
        );
        assert(
          insertSecondaryKeys.some(
            keyIncludesEncodedPart(user1Encoded.bornYear),
          ),
        );

        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.username)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user1Encoded.email)));
        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.age)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user1Encoded.bornYear)));

        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.username)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.email)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.age)));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.bornYear)));

        assert(checkKeys.some(keyIncludesEncodedPart(user2Encoded.username)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user2Encoded.email)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user2Encoded.age)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user2Encoded.bornYear)));

        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.username)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.email)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.age)));
        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.bornYear)));
      });
    },
  );

  await t.step(
    "Should delete old primary and secondary indices and set new primary and secondary indices while ignoring missing index values",
    async () => {
      await useKv(async (kv) => {
        const encoder = jsonEncoder();

        const collection = new Collection(
          kv,
          ["users"],
          new Map<any, any>(),
          () => Promise.resolve(),
          [DEFAULT_BASE_KEY_PREFIX],
          {
            model: model<User>(),
            encoder,
            indices: {
              username: "primary",
              email: "primary",
              age: "secondary",
              bornYear: "secondary",
            },
          },
        );

        const user1 = {
          username: "user1",
          age: 30,
        } satisfies User;

        const user2 = {
          username: "user2",
          age: 25,
        } satisfies User;

        const user1Encoded = {
          username: user1.username,
          age: user1.age,
        };

        const user2Encoded = {
          username: user2.username,
          age: user2.age,
        };

        const cr = await collection.add(user1);
        assert(cr.ok);

        const idKey = extendKey(collection["keys"].id, cr.id);

        const {
          insertPrimaryKeys,
          insertSecondaryKeys,
          deleteKeys,
          checkKeys,
        } = await createIndexDiffs(
          cr.id,
          idKey,
          cr.versionstamp,
          user1,
          user2,
          collection,
        );

        assertEquals(insertPrimaryKeys.length, 1);
        assertEquals(insertSecondaryKeys.length, 1);
        assertEquals(deleteKeys.length, 2);
        assertEquals(checkKeys.length, 1);

        assert(
          insertPrimaryKeys.some(keyIncludesEncodedPart(user2Encoded.username)),
        );
        assert(!insertPrimaryKeys.some(keyIncludesStringPart("email")));
        assert(
          insertSecondaryKeys.some(keyIncludesEncodedPart(user2Encoded.age)),
        );
        assert(!insertSecondaryKeys.some(keyIncludesStringPart("bornYear")));

        assert(
          !insertPrimaryKeys.some(
            keyIncludesEncodedPart(user1Encoded.username),
          ),
        );
        assert(!insertPrimaryKeys.some(keyIncludesStringPart("email")));
        assert(
          !insertSecondaryKeys.some(keyIncludesEncodedPart(user1Encoded.age)),
        );
        assert(!insertSecondaryKeys.some(keyIncludesStringPart("bornYear")));

        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.username)));
        assert(!deleteKeys.some(keyIncludesStringPart("email")));
        assert(deleteKeys.some(keyIncludesEncodedPart(user1Encoded.age)));
        assert(!deleteKeys.some(keyIncludesStringPart("bornYear")));

        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.username)));
        assert(!deleteKeys.some(keyIncludesStringPart("email")));
        assert(!deleteKeys.some(keyIncludesEncodedPart(user2Encoded.age)));
        assert(!deleteKeys.some(keyIncludesStringPart("bornYear")));

        assert(checkKeys.some(keyIncludesEncodedPart(user2Encoded.username)));
        assert(!checkKeys.some(keyIncludesStringPart("email")));
        assert(!checkKeys.some(keyIncludesEncodedPart(user2Encoded.age)));
        assert(!checkKeys.some(keyIncludesStringPart("bornYear")));

        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.username)));
        assert(!checkKeys.some(keyIncludesStringPart("email")));
        assert(!checkKeys.some(keyIncludesEncodedPart(user1Encoded.age)));
        assert(!checkKeys.some(keyIncludesStringPart("bornYear")));
      });
    },
  );
});
