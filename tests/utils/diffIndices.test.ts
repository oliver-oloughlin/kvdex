import { assert, assertEquals } from "@std/assert";
import { Collection } from "../../src/core/collection.ts";
import { model } from "../../src/core/model.ts";
import { createIndexDiffs } from "../../src/core/utils.ts";
import { useKv } from "../utils.ts";
import { jsonEncoder } from "../../src/common/json.ts";
import type { KvKey } from "../../src/core/types.ts";
import { equals } from "@std/bytes/equals";

type User = {
  username: string;
  email?: string;
  age: number;
  bornYear?: number;
};

const keyIncludesEncodedPart = (part: Uint8Array) => {
  return (key: KvKey) =>
    key.some((p) => p instanceof Uint8Array && equals(part, p));
};

const keyIncludesStringPart = (part: string) => {
  return (key: KvKey) => key.some((p) => p === part);
};

Deno.test("utils - diffIndices", async (t) => {
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
          model<User>(),
          {
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
          username: await encoder.serializer.serialize(user1.username),
          email: await encoder.serializer.serialize(user1.email),
          age: await encoder.serializer.serialize(user1.age),
          bornYear: await encoder.serializer.serialize(user1.bornYear),
        };

        const user2Encoded = {
          username: await encoder.serializer.serialize(user2.username),
          email: await encoder.serializer.serialize(user2.email),
          age: await encoder.serializer.serialize(user2.age),
          bornYear: await encoder.serializer.serialize(user2.bornYear),
        };

        const cr = await collection.add(user1);
        assert(cr.ok);

        const {
          insertPrimaryKeys,
          insertSecondaryKeys,
          deleteKeys,
          checkKeys,
        } = await createIndexDiffs(
          cr.id,
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
          model<User>(),
          {
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
          username: await encoder.serializer.serialize(user1.username),
          email: await encoder.serializer.serialize(user1.email),
          age: await encoder.serializer.serialize(user1.age),
          bornYear: await encoder.serializer.serialize(user1.bornYear),
        };

        const user2Encoded = {
          username: await encoder.serializer.serialize(user2.username),
          email: await encoder.serializer.serialize(user2.email),
          age: await encoder.serializer.serialize(user2.age),
          bornYear: await encoder.serializer.serialize(user2.bornYear),
        };

        const cr = await collection.add(user1);
        assert(cr.ok);

        const {
          insertPrimaryKeys,
          insertSecondaryKeys,
          deleteKeys,
          checkKeys,
        } = await createIndexDiffs(
          cr.id,
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
        assert(
          !insertPrimaryKeys.some(keyIncludesEncodedPart(user2Encoded.email)),
        );
        assert(
          insertSecondaryKeys.some(keyIncludesEncodedPart(user2Encoded.age)),
        );
        assert(
          !insertSecondaryKeys.some(
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
          model<User>(),
          {
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
          username: await encoder.serializer.serialize(user1.username),
          age: await encoder.serializer.serialize(user1.age),
        };

        const user2Encoded = {
          username: await encoder.serializer.serialize(user2.username),
          age: await encoder.serializer.serialize(user2.age),
        };

        const cr = await collection.add(user1);
        assert(cr.ok);

        const {
          insertPrimaryKeys,
          insertSecondaryKeys,
          deleteKeys,
          checkKeys,
        } = await createIndexDiffs(
          cr.id,
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
