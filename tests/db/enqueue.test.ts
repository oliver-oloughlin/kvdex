import {
  collection,
  kvdex,
  type KvValue,
  model,
  type QueueMessage,
} from "../../mod.ts";
import { KVDEX_KEY_PREFIX } from "../../src/constants.ts";
import { createHandlerId } from "../../src/utils.ts";
import { assert } from "@std/assert";
import { createResolver, useKv } from "../utils.ts";

Deno.test("db - enqueue", async (t) => {
  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data";
      const undeliveredId = "undelivered";
      const sleeper = createResolver();

      const db = kvdex({
        kv,
        schema: { numbers: collection(model<number>()) },
      });

      const handlerId = createHandlerId([KVDEX_KEY_PREFIX], undefined);

      let assertion = false;

      const listener = kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<KvValue>;
        assertion = qMsg.__handlerId__ === handlerId && qMsg.__data__ === data;
        sleeper.resolve();
      });

      await db.enqueue(data, {
        idsIfUndelivered: [undeliveredId],
      });

      await sleeper.promise;

      const undelivered = await db.numbers.findUndelivered(undeliveredId);
      assert(assertion || typeof undelivered?.value === typeof data);

      return async () => await listener;
    });
  });

  await t.step("Should enqueue message in correct topic", async () => {
    await useKv(async (kv) => {
      const data = "data";
      const undeliveredId = "undelivered";
      const topic = "topic";
      const sleeper = createResolver();

      const db = kvdex({
        kv,
        schema: { numbers: collection(model<number>()) },
      });

      let assertion1 = false;
      let assertion2 = true;

      const l1 = db.listenQueue(() => {
        assertion1 = true;
        sleeper.resolve();
      }, { topic });

      const l2 = db.listenQueue(() => {
        assertion2 = false;
      });

      await db.enqueue(data, {
        idsIfUndelivered: [undeliveredId],
        topic,
      });

      await sleeper.promise;

      const undelivered = await db.numbers.findUndelivered(undeliveredId);
      assert(assertion1 || typeof undelivered?.value === typeof data);
      assert(assertion2);

      return async () => await Promise.all([l1, l2]);
    });
  });

  await t.step("Should enqueue message with undefined data", async () => {
    await useKv(async (kv) => {
      const data = undefined;
      const undeliveredId = "undelivered";
      const sleeper = createResolver();

      const db = kvdex({
        kv,
        schema: { numbers: collection(model<number>()) },
      });

      const handlerId = createHandlerId([KVDEX_KEY_PREFIX], undefined);

      let assertion = false;

      const listener = kv.listenQueue((msg) => {
        const qMsg = msg as QueueMessage<KvValue>;

        assertion = qMsg.__handlerId__ === handlerId &&
          qMsg.__data__ === data && qMsg.__is_undefined__ === true;

        sleeper.resolve();
      });

      await db.enqueue(data, {
        idsIfUndelivered: [undeliveredId],
      });

      await sleeper.promise;

      const undelivered = await db.numbers.findUndelivered(undeliveredId);
      assert(assertion || typeof undelivered?.value === typeof data);

      return async () => await listener;
    });
  });
});
