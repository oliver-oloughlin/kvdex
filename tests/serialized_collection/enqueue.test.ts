import {
  collection,
  kvdex,
  type KvValue,
  model,
  type QueueMessage,
} from "../../mod.ts";
import { createHandlerId } from "../../src/utils.ts";
import { assert } from "../test.deps.ts";
import type { User } from "../models.ts";
import { createResolver, testEncoder, useDb, useKv } from "../utils.ts";

Deno.test("serialized_collection - enqueue", async (t) => {
  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data";
      const undeliveredId = "undelivered";

      const db = kvdex(kv, {
        s_users: collection(model<User>(), { encoder: testEncoder }),
      });

      const sleeper = createResolver();
      const handlerId = createHandlerId(db.s_users._keys.base, undefined);
      let assertion = false;

      const listener = kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<KvValue>;
        assertion = qMsg.__handlerId__ === handlerId && qMsg.__data__ === data;
        sleeper.resolve();
      });

      await db.s_users.enqueue(data, {
        idsIfUndelivered: [undeliveredId],
      });

      await sleeper.promise;

      const undelivered = await db.s_users.findUndelivered(undeliveredId);
      assert(assertion || typeof undelivered?.value === typeof data);

      return async () => await listener;
    });
  });

  await t.step("Should enqueue message in correct topic", async () => {
    await useDb(async (db) => {
      const data = "data";
      const undeliveredId = "undelivered";
      const topic = "topic";

      const sleeper = createResolver();
      let assertion1 = false;
      let assertion2 = true;

      const l1 = db.s_users.listenQueue(() => {
        assertion1 = true;
        sleeper.resolve();
      }, { topic });

      const l2 = db.s_users.listenQueue(() => assertion2 = false);

      await db.s_users.enqueue("data", {
        idsIfUndelivered: [undeliveredId],
        topic,
      });

      await sleeper.promise;

      const undelivered = await db.s_users.findUndelivered(undeliveredId);
      assert(assertion1 || typeof undelivered?.value === typeof data);
      assert(assertion2);

      return async () => await Promise.all([l1, l2]);
    });
  });

  await t.step("Should enqueue message with undefined data", async () => {
    await useDb(async (db) => {
      const data = undefined;
      const undeliveredId = "undelivered";
      const sleeper = createResolver();

      let assertion = false;

      const listener = db.s_users.listenQueue((msg) => {
        assertion = msg === data;
        sleeper.resolve();
      });

      await db.s_users.enqueue(data, {
        idsIfUndelivered: [undeliveredId],
      });

      await sleeper.promise;

      const undelivered = await db.s_users.findUndelivered(undeliveredId);
      assert(assertion || typeof undelivered?.value === typeof data);

      return async () => await listener;
    });
  });
});
