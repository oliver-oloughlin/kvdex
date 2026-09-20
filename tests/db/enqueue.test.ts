import {
  collection,
  kvdex,
  type KvValue,
  model,
  type QueueMessage,
} from "../../mod.ts";
import { KVDEX_KEY_PREFIX } from "../../src/core/constants.ts";
import { createHandlerId } from "../../src/core/utils.ts";
import { assert, assertEquals } from "@std/assert";
import { useKv } from "../utils.ts";

Deno.test("db - enqueue", async (t) => {
  await t.step(
    "Should route database and collection queues by custom base path",
    async () => {
      await useKv(async (kv) => {
        const schema = { numbers: collection<number>() };
        const custom = kvdex({ kv, schema, basePath: ["tenant", 42n] });
        const other = kvdex({ kv, schema, basePath: ["tenant", "42"] });
        const received: string[] = [];
        const complete = Promise.withResolvers<void>();
        const record = (queue: string) => (value: string) => {
          received.push(`${queue}:${value}`);
          if (received.length === 4) complete.resolve();
        };
        const listeners = [
          custom.listenQueue(record("custom"), { topic: "topic" }),
          other.listenQueue(record("other"), { topic: "topic" }),
          custom.numbers.listenQueue(record("custom collection")),
          other.numbers.listenQueue(record("other collection")),
        ];
        const timeout = setTimeout(
          () => complete.reject(new Error("Queue delivery timed out")),
          5_000,
        );
        try {
          await custom.enqueue("one", { topic: "topic" });
          await other.enqueue("two", { topic: "topic" });
          await custom.numbers.enqueue("three");
          await other.numbers.enqueue("four");
          await complete.promise;
          assertEquals(
            received.sort(),
            [
              "custom:one",
              "other:two",
              "custom collection:three",
              "other collection:four",
            ].sort(),
          );
        } finally {
          clearTimeout(timeout);
        }
        return async () => await Promise.all(listeners);
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
