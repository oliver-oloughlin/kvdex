import {
  collection,
  kvdex,
  type KvValue,
  model,
  type QueueMessage,
} from "../../mod.ts";
import { KVDEX_KEY_PREFIX } from "../../src/core/constants.ts";
import { createHandlerId } from "../../src/core/utils.ts";
import { assert } from "@std/assert";
import { createResolver, sleep, useKv } from "../utils.ts";

Deno.test("db - listenQueue", async (t) => {
  await t.step("Should receive message with string data", async () => {
    await useKv(async (kv) => {
      const data = "data";
      const db = kvdex({ kv });
      const sleeper = createResolver();

      const handlerId = createHandlerId([KVDEX_KEY_PREFIX], undefined);

      let assertion = false;

      const listener = db.listenQueue((msgData) => {
        assertion = msgData === data;
        sleeper.resolve();
      });

      const msg: QueueMessage<KvValue> = {
        __is_undefined__: false,
        __handlerId__: handlerId,
        __data__: data,
      };

      await kv.enqueue(msg);

      await sleeper.promise;
      assert(assertion);

      return async () => await listener;
    });
  });

  await t.step("Should not receive collection queue message", async () => {
    await useKv(async (kv) => {
      const data = "data";

      const db = kvdex({
        kv,
        schema: { numbers: collection(model<number>()) },
      });

      let assertion = true;

      const listener = db.listenQueue(() => {
        assertion = false;
      });

      await db.numbers.enqueue(data);

      await sleep(500);

      assert(assertion);

      return async () => await listener;
    });
  });
});
