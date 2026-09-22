import {
  type BaseKey,
  collection,
  kvdex,
  type KvValue,
  model,
  type QueueMessage,
} from "../../mod.ts";
import { DEFAULT_BASE_KEY_PREFIX } from "../../src/core/constants.ts";
import { createHandlerId } from "../../src/core/utils.ts";
import { assert, assertEquals } from "@std/assert";
import { useKv } from "../utils.ts";

Deno.test("db - enqueue", async (t) => {
  await t.step(
    "Should route database and collection queues by custom base path on one KV",
    async () => {
      const paths: BaseKey[] = [["tenant", 42n], ["tenant", "42"], []];
      await useKv(async (kv) => {
        const listenQueue = kv.listenQueue.bind(kv);
        let listenerCount = 0;
        kv.listenQueue = (handler) => {
          listenerCount++;
          return listenQueue(handler);
        };
        const received: string[] = [];
        const expected: string[] = [];
        const complete = Promise.withResolvers<void>();
        const record = (queue: string) => (value: string) => {
          received.push(`${queue}:${value}`);
          if (received.length === paths.length * 2) complete.resolve();
        };
        const listeners: Promise<void>[] = [];
        const databases = paths.map((basePath, index) => {
          const db = kvdex({
            kv,
            schema: { numbers: collection<number>() },
            basePath,
          });
          listeners.push(
            db.listenQueue(record(`${index}:database`), { topic: "topic" }),
            db.numbers.listenQueue(record(`${index}:collection`)),
          );
          expected.push(
            `${index}:database:${index}`,
            `${index}:collection:${index}`,
          );
          return db;
        });
        const timeout = setTimeout(() => complete.resolve(), 5_000);
        try {
          for (const [index, db] of databases.entries()) {
            await db.enqueue(`${index}`, { topic: "topic" });
            await db.numbers.enqueue(`${index}`);
          }
          await complete.promise;
        } finally {
          clearTimeout(timeout);
          kv.listenQueue = listenQueue;
        }
        return async () => {
          await Promise.all(listeners);
          assertEquals(listenerCount, 1);
          assertEquals(received.sort(), expected.sort());
        };
      });
    },
  );

  await t.step("Should enqueue message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data";
      const undeliveredId = "undelivered";
      const sleeper = Promise.withResolvers<void>();

      const db = kvdex({
        kv,
        schema: { numbers: collection({ model: model<number>() }) },
      });

      const handlerId = createHandlerId(
        [DEFAULT_BASE_KEY_PREFIX],
        undefined,
      );

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
      const sleeper = Promise.withResolvers<void>();

      const db = kvdex({
        kv,
        schema: { numbers: collection({ model: model<number>() }) },
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
      const sleeper = Promise.withResolvers<void>();

      const db = kvdex({
        kv,
        schema: { numbers: collection({ model: model<number>() }) },
      });

      const handlerId = createHandlerId(
        [DEFAULT_BASE_KEY_PREFIX],
        undefined,
      );

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
