import {
  collection,
  type Document,
  kvdex,
  type KvValue,
  model,
} from "../../mod.ts";
import {
  ID_KEY_PREFIX,
  KVDEX_KEY_PREFIX,
  PRIMARY_INDEX_KEY_PREFIX,
  SECONDARY_INDEX_KEY_PREFIX,
} from "../../src/constants.ts";
import { extendKey, keyEq } from "../../src/utils.ts";
import { assert } from "@std/assert";
import { mockUser1 } from "../mocks.ts";
import type { User } from "../models.ts";
import { generateUsers, sleep, useDb, useKv } from "../utils.ts";
import { mockUser2 } from "../mocks.ts";
import { mockUser3 } from "../mocks.ts";

Deno.test("indexable_collection - properties", async (t) => {
  await t.step("Keys should have the correct prefixes", async () => {
    await useDb((db) => {
      const baseKey = db.i_users.一internal.keys.base;
      const idKey = db.i_users.一internal.keys.id;
      const primaryIndexKey = db.i_users.一internal.keys.primaryIndex;
      const secondaryIndexKey = db.i_users.一internal.keys.secondaryIndex;
      const prefix = extendKey([KVDEX_KEY_PREFIX], "i_users");

      assert(keyEq(baseKey, prefix));
      assert(keyEq(idKey, extendKey(prefix, ID_KEY_PREFIX)));
      assert(
        keyEq(primaryIndexKey, extendKey(prefix, PRIMARY_INDEX_KEY_PREFIX)),
      );
      assert(
        keyEq(secondaryIndexKey, extendKey(prefix, SECONDARY_INDEX_KEY_PREFIX)),
      );
    });
  });

  await t.step("Should generate ids with custom id generator", async () => {
    await useKv((kv) => {
      const db = kvdex({
        kv,
        schema: {
          users1: collection(model<User>(), {
            idGenerator: () => Math.random(),
            indices: {},
          }),
          users2: collection(model<User>(), {
            idGenerator: (data) => data.username,
            indices: {},
          }),
        },
      });

      const id1 = db.users1.一internal.idGenerator(mockUser1);
      const id2 = db.users2.一internal.idGenerator(mockUser1);

      assert(typeof id1 === "number");
      assert(id2 === mockUser1.username);
    });
  });

  await t.step("Should select using cursor pagination", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      const cr = await db.i_users.addMany(users);
      assert(cr.ok);

      const selected: Document<User, string>[] = [];
      let cursor: string | undefined = undefined;
      do {
        const query = await db.i_users.getMany({
          cursor,
          limit: users.length / 10,
        });

        selected.push(...query.result);
        cursor = query.cursor;
      } while (cursor);

      assert(
        users.every((user) =>
          selected.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });

  await t.step("Should select using offset pagination", async () => {
    await useDb(async (db) => {
      const users = generateUsers(1_000);
      const cr = await db.i_users.addMany(users);
      assert(cr.ok);

      const selected: Document<User, string>[] = [];
      const limit = 50;
      for (let offset = 0; offset < users.length; offset += limit) {
        const { result } = await db.i_users.getMany({ offset, limit });
        selected.push(...result);
        assert(result.length === 50);
      }

      assert(
        users.every((user) =>
          selected.some((doc) => doc.value.username === user.username)
        ),
      );
    });
  });

  await t.step("Should select filtered", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10);
      const cr = await db.i_users.addMany(users);
      const count1 = await db.i_users.count();
      assert(cr.ok);
      assert(count1 === users.length);

      const sliced = users.slice(5, 7);

      const { result } = await db.i_users.getMany({
        filter: (doc) =>
          sliced.map((user) => user.username).includes(
            doc.value.username,
          ),
      });

      assert(result.length === sliced.length);
      assert(
        result.every((doc) =>
          sliced.some((user) => user.username === doc.value.username)
        ),
      );
    });
  });

  await t.step("Should select in reverse", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10);
      const cr = await db.i_users.addMany(users);
      const count1 = await db.i_users.count();
      assert(cr.ok);
      assert(count1 === users.length);

      const query1 = await db.i_users.getMany();
      const query2 = await db.i_users.getMany({ reverse: true });

      assert(
        JSON.stringify(query1.result) ===
          JSON.stringify(query2.result.reverse()),
      );
    });
  });

  await t.step("Should select from start id", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10);
      const cr = await db.i_users.addMany(users);
      const count1 = await db.i_users.count();
      assert(cr.ok);
      assert(count1 === users.length);

      const index = 5;

      const query1 = await db.i_users.getMany();
      const query2 = await db.i_users.getMany({
        startId: query1.result.at(index)?.id,
      });

      assert(query2.result.length === query1.result.slice(index).length);
      assert(
        query2.result.every((doc1) =>
          query1.result.slice(index).some((doc2) => doc1.id === doc2.id)
        ),
      );
    });
  });

  await t.step("Should select until end id", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10);
      const cr = await db.i_users.addMany(users);
      const count1 = await db.i_users.count();
      assert(cr.ok);
      assert(count1 === users.length);

      const index = 5;

      const query1 = await db.i_users.getMany();
      const query2 = await db.i_users.getMany({
        endId: query1.result.at(index)?.id,
      });

      assert(query2.result.length === query1.result.slice(0, index).length);
      assert(
        query2.result.every((doc1) =>
          query1.result.slice(0, index).some((doc2) => doc1.id === doc2.id)
        ),
      );
    });
  });

  await t.step("Should select from start id to end id", async () => {
    await useDb(async (db) => {
      const users = generateUsers(10);
      const cr = await db.i_users.addMany(users);
      const count1 = await db.i_users.count();
      assert(cr.ok);
      assert(count1 === users.length);

      const index1 = 5;
      const index2 = 7;

      const query1 = await db.i_users.getMany();
      const query2 = await db.i_users.getMany({
        startId: query1.result.at(index1)?.id,
        endId: query1.result.at(index2)?.id,
      });

      assert(
        query2.result.length === query1.result.slice(index1, index2).length,
      );
      assert(
        query2.result.every((doc1) =>
          query1.result.slice(index1, index2).some((doc2) =>
            doc1.id === doc2.id
          )
        ),
      );
    });
  });

  await t.step("Should allow optional indices", async () => {
    await useKv(async (kv) => {
      const db = kvdex({
        kv,
        schema: {
          i: collection(
            model<{
              oblPrimary: string;
              oblSecondary: number;
              optPrimary?: string;
              optSecondary?: number;
              check?: Date;
            }>(),
            {
              indices: {
                oblPrimary: "primary",
                oblSecondary: "secondary",
                optPrimary: "primary",
                optSecondary: "secondary",
              },
            },
          ),
        },
      });

      const cr1 = await db.i.add({
        oblPrimary: "oblPrimary1",
        oblSecondary: 10,
      });

      const cr2 = await db.i.add({
        oblPrimary: "oblPrimary2",
        oblSecondary: 10,
        optPrimary: "optPrimary2",
        optSecondary: 20,
      });

      assert(cr1.ok);
      assert(cr2.ok);

      const byOptPrimary2 = await db.i.findByPrimaryIndex(
        "optPrimary",
        "optPrimary2",
      );
      const byOptSecondary2 = await db.i.findBySecondaryIndex(
        "optSecondary",
        20,
      );

      assert(byOptPrimary2?.id === cr2.id);
      assert(byOptSecondary2.result.length === 1);
      assert(byOptSecondary2.result.some((i) => i.id === cr2.id));

      const cr3 = await db.i.add({
        oblPrimary: "oblPrimary3",
        oblSecondary: 10,
        optPrimary: "optPrimary2",
        optSecondary: 20,
      });

      assert(!cr3.ok);

      const cr4 = await db.i.add({
        oblPrimary: "oblPrimary4",
        oblSecondary: 10,
        optPrimary: "optPrimary4",
        optSecondary: 20,
      });

      assert(cr4.ok);

      const byOptPrimary4 = await db.i.findByPrimaryIndex(
        "optPrimary",
        "optPrimary4",
      );
      const byOptSecondary4 = await db.i.findBySecondaryIndex(
        "optSecondary",
        20,
      );

      assert(byOptPrimary4?.id === cr4.id);
      assert(byOptSecondary4.result.length === 2);
      assert(byOptSecondary4.result.some((i) => i.id === cr2.id));
      assert(byOptSecondary4.result.some((i) => i.id === cr4.id));
    });
  });

  await t.step("Should select limited by database reads", async () => {
    await useDb(async (db) => {
      const cr1 = await db.i_users.add(mockUser1);
      await sleep(10);
      const cr2 = await db.i_users.add(mockUser2);
      await sleep(10);
      const cr3 = await db.i_users.add(mockUser3);

      assert(cr1.ok);
      assert(cr2.ok);
      assert(cr3.ok);

      const { result } = await db.i_users.getMany({
        limit: 2,
        filter: (doc) => doc.value.username !== mockUser1.username,
      });

      assert(result.every((doc) => doc.value.username === mockUser2.username));
    });
  });

  await t.step("Should select limited by result count", async () => {
    await useDb(async (db) => {
      const cr1 = await db.i_users.add(mockUser1);
      await sleep(10);
      const cr2 = await db.i_users.add(mockUser2);
      await sleep(10);
      const cr3 = await db.i_users.add(mockUser3);

      assert(cr1.ok);
      assert(cr2.ok);
      assert(cr3.ok);

      const { result } = await db.i_users.getMany({
        take: 2,
        filter: (doc) => doc.value.username !== mockUser1.username,
      });

      assert(result.length === 2);
      assert(result.some((doc) => doc.value.username === mockUser2.username));
      assert(result.some((doc) => doc.value.username === mockUser3.username));
    });
  });

  await t.step("Should correctly infer type of document", async () => {
    await useDb(async (db) => {
      const doc = await db.i_users.find("");
      if (doc) {
        doc.value.age.valueOf();
      }
    });
  });

  await t.step(
    "Should correctly infer insert and output of asymmetric model",
    async () => {
      await useDb(async (db) => {
        const cr = await db.ai_users.add(mockUser1);
        assert(cr.ok);

        const doc = await db.ai_users.find(cr.id);
        assert(doc !== null);
        assert(typeof doc.value.addressStr === "string");
        assert(typeof doc.value.decadeAge === "number");
        assert(typeof doc.value.name === "string");
      });
    },
  );

  await t.step("Should enable indexing using all available types", async () => {
    type Data = {
      p: KvValue;
      s: KvValue;
    };

    await useKv(async (kv) => {
      const val1 = undefined;
      const val2 = null;
      const val3 = 10;
      const val4 = "string";
      const val5 = 10n;
      const val6 = true;
      const val7 = new Int8Array([10, 20, 30]);
      const val8 = new Int16Array([10, 20, 30]);
      const val9 = new Int32Array([10, 20, 30]);
      const val10 = new BigInt64Array([10n, 20n, 30n]);
      const val11 = new Uint8Array([10, 20, 30]);
      const val12 = new Uint16Array([10, 20, 30]);
      const val13 = new Uint32Array([10, 20, 30]);
      const val14 = new BigUint64Array([10n, 20n, 30n]);
      const val15 = new Uint8ClampedArray([10, 20, 30]);
      const val16 = new Float32Array([10.203423878293472837429384]);
      const val17 = new Float64Array([10.203423878293472837429384]);
      const val18 = new Uint8Array([10, 20, 30]).buffer;
      const val19 = new Date();
      const val20 = new RegExp("[0-9]");
      const val21 = new DataView(new Uint8Array([10, 20, 30]).buffer);
      const val22 = new Error("error");
      const val23 = [
        val1,
        val2,
        val3,
        val4,
        val5,
        val6,
        val7,
        val8,
        val9,
        val10,
        val11,
        val12,
        val13,
        val14,
        val15,
        val16,
        val17,
        val18,
        val19,
        val20,
        val21,
        val22,
      ];
      const val24 = {
        val1,
        val2,
        val3,
        val4,
        val5,
        val6,
        val7,
        val8,
        val9,
        val10,
        val11,
        val12,
        val13,
        val14,
        val15,
        val16,
        val17,
        val18,
        val19,
        val20,
        val21,
        val22,
      };
      const val25 = new Set<KvValue>(val23);
      const val26 = new Map<KvValue, KvValue>([
        ["val1", val1],
        ["val2", val2],
        ["val3", val3],
        ["val4", val4],
        ["val5", val5],
        ["val6", val6],
        ["val7", val7],
        ["val8", val8],
        ["val9", val9],
        ["val10", val10],
        ["val11", val11],
        ["val12", val12],
        ["val13", val13],
        ["val14", val14],
        ["val15", val15],
        ["val16", val16],
        ["val17", val17],
        ["val18", val18],
        ["val19", val19],
        ["val20", val20],
        ["val21", val21],
        ["val22", val22],
      ]);

      const db = kvdex({
        kv,
        schema: {
          val1: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val2: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val3: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val4: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val5: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val6: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val7: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val8: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val9: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val10: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val11: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val12: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val13: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val14: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val15: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val16: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val17: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val18: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val19: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val20: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val21: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val22: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val23: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val24: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val25: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
          val26: collection(model<Data>(), {
            indices: {
              p: "primary",
              s: "secondary",
            },
          }),
        },
      });

      const cr1 = await db.val1.add({ p: val1, s: val1 });
      const cr2 = await db.val2.add({ p: val2, s: val2 });
      const cr3 = await db.val3.add({ p: val3, s: val3 });
      const cr4 = await db.val4.add({ p: val4, s: val4 });
      const cr5 = await db.val5.add({ p: val5, s: val5 });
      const cr6 = await db.val6.add({ p: val6, s: val6 });
      const cr7 = await db.val7.add({ p: val7, s: val7 });
      const cr8 = await db.val8.add({ p: val8, s: val8 });
      const cr9 = await db.val9.add({ p: val9, s: val9 });
      const cr10 = await db.val10.add({ p: val10, s: val10 });
      const cr11 = await db.val11.add({ p: val11, s: val11 });
      const cr12 = await db.val12.add({ p: val12, s: val12 });
      const cr13 = await db.val13.add({ p: val13, s: val13 });
      const cr14 = await db.val14.add({ p: val14, s: val14 });
      const cr15 = await db.val15.add({ p: val15, s: val15 });
      const cr16 = await db.val16.add({ p: val16, s: val16 });
      const cr17 = await db.val17.add({ p: val17, s: val17 });
      const cr18 = await db.val18.add({ p: val18, s: val18 });
      const cr19 = await db.val19.add({ p: val19, s: val19 });
      const cr20 = await db.val20.add({ p: val20, s: val20 });
      const cr21 = await db.val21.add({ p: val21, s: val21 });
      const cr22 = await db.val22.add({ p: val22, s: val22 });
      const cr23 = await db.val23.add({ p: val23, s: val23 });
      const cr24 = await db.val24.add({ p: val24, s: val24 });
      const cr25 = await db.val25.add({ p: val25, s: val25 });
      const cr26 = await db.val26.add({ p: val26, s: val26 });

      assert(cr1.ok);
      assert(cr2.ok);
      assert(cr3.ok);
      assert(cr4.ok);
      assert(cr5.ok);
      assert(cr6.ok);
      assert(cr7.ok);
      assert(cr8.ok);
      assert(cr9.ok);
      assert(cr10.ok);
      assert(cr11.ok);
      assert(cr12.ok);
      assert(cr13.ok);
      assert(cr14.ok);
      assert(cr15.ok);
      assert(cr16.ok);
      assert(cr17.ok);
      assert(cr18.ok);
      assert(cr19.ok);
      assert(cr20.ok);
      assert(cr21.ok);
      assert(cr22.ok);
      assert(cr23.ok);
      assert(cr24.ok);
      assert(cr25.ok);
      assert(cr26.ok);

      //const byPrimary1 = await db.val1.findByPrimaryIndex("p", val1)
      const byPrimary2 = await db.val2.findByPrimaryIndex("p", val2);
      const byPrimary3 = await db.val3.findByPrimaryIndex("p", val3);
      const byPrimary4 = await db.val4.findByPrimaryIndex("p", val4);
      const byPrimary5 = await db.val5.findByPrimaryIndex("p", val5);
      const byPrimary6 = await db.val6.findByPrimaryIndex("p", val6);
      const byPrimary7 = await db.val7.findByPrimaryIndex("p", val7);
      const byPrimary8 = await db.val8.findByPrimaryIndex("p", val8);
      const byPrimary9 = await db.val9.findByPrimaryIndex("p", val9);
      const byPrimary10 = await db.val10.findByPrimaryIndex("p", val10);
      const byPrimary11 = await db.val11.findByPrimaryIndex("p", val11);
      const byPrimary12 = await db.val12.findByPrimaryIndex("p", val12);
      const byPrimary13 = await db.val13.findByPrimaryIndex("p", val13);
      const byPrimary14 = await db.val14.findByPrimaryIndex("p", val14);
      const byPrimary15 = await db.val15.findByPrimaryIndex("p", val15);
      const byPrimary16 = await db.val16.findByPrimaryIndex("p", val16);
      const byPrimary17 = await db.val17.findByPrimaryIndex("p", val17);
      const byPrimary18 = await db.val18.findByPrimaryIndex("p", val18);
      const byPrimary19 = await db.val19.findByPrimaryIndex("p", val19);
      const byPrimary20 = await db.val20.findByPrimaryIndex("p", val20);
      const byPrimary21 = await db.val21.findByPrimaryIndex("p", val21);
      const byPrimary22 = await db.val22.findByPrimaryIndex("p", val22);
      const byPrimary23 = await db.val23.findByPrimaryIndex("p", val23);
      const byPrimary24 = await db.val24.findByPrimaryIndex("p", val24);
      const byPrimary25 = await db.val25.findByPrimaryIndex("p", val25);
      const byPrimary26 = await db.val26.findByPrimaryIndex("p", val26);

      //assert(byPrimary1 !== null)
      assert(byPrimary2 !== null);
      assert(byPrimary3 !== null);
      assert(byPrimary4 !== null);
      assert(byPrimary5 !== null);
      assert(byPrimary6 !== null);
      assert(byPrimary7 !== null);
      assert(byPrimary8 !== null);
      assert(byPrimary9 !== null);
      assert(byPrimary10 !== null);
      assert(byPrimary11 !== null);
      assert(byPrimary12 !== null);
      assert(byPrimary13 !== null);
      assert(byPrimary14 !== null);
      assert(byPrimary15 !== null);
      assert(byPrimary16 !== null);
      assert(byPrimary17 !== null);
      assert(byPrimary18 !== null);
      assert(byPrimary19 !== null);
      assert(byPrimary20 !== null);
      assert(byPrimary21 !== null);
      assert(byPrimary22 !== null);
      assert(byPrimary23 !== null);
      assert(byPrimary24 !== null);
      assert(byPrimary25 !== null);
      assert(byPrimary26 !== null);

      /*const { result: bySecondary1 } = await db.val1.findBySecondaryIndex(
        "s",
        val1,
      )*/

      const { result: bySecondary2 } = await db.val2.findBySecondaryIndex(
        "s",
        val2,
      );
      const { result: bySecondary3 } = await db.val3.findBySecondaryIndex(
        "s",
        val3,
      );
      const { result: bySecondary4 } = await db.val4.findBySecondaryIndex(
        "s",
        val4,
      );
      const { result: bySecondary5 } = await db.val5.findBySecondaryIndex(
        "s",
        val5,
      );
      const { result: bySecondary6 } = await db.val6.findBySecondaryIndex(
        "s",
        val6,
      );
      const { result: bySecondary7 } = await db.val7.findBySecondaryIndex(
        "s",
        val7,
      );
      const { result: bySecondary8 } = await db.val8.findBySecondaryIndex(
        "s",
        val8,
      );
      const { result: bySecondary9 } = await db.val9.findBySecondaryIndex(
        "s",
        val9,
      );
      const { result: bySecondary10 } = await db.val10.findBySecondaryIndex(
        "s",
        val10,
      );
      const { result: bySecondary11 } = await db.val11.findBySecondaryIndex(
        "s",
        val11,
      );
      const { result: bySecondary12 } = await db.val12.findBySecondaryIndex(
        "s",
        val12,
      );
      const { result: bySecondary13 } = await db.val13.findBySecondaryIndex(
        "s",
        val13,
      );
      const { result: bySecondary14 } = await db.val14.findBySecondaryIndex(
        "s",
        val14,
      );
      const { result: bySecondary15 } = await db.val15.findBySecondaryIndex(
        "s",
        val15,
      );
      const { result: bySecondary16 } = await db.val16.findBySecondaryIndex(
        "s",
        val16,
      );
      const { result: bySecondary17 } = await db.val17.findBySecondaryIndex(
        "s",
        val17,
      );
      const { result: bySecondary18 } = await db.val18.findBySecondaryIndex(
        "s",
        val18,
      );
      const { result: bySecondary19 } = await db.val19.findBySecondaryIndex(
        "s",
        val19,
      );
      const { result: bySecondary20 } = await db.val20.findBySecondaryIndex(
        "s",
        val20,
      );
      const { result: bySecondary21 } = await db.val21.findBySecondaryIndex(
        "s",
        val21,
      );
      const { result: bySecondary22 } = await db.val22.findBySecondaryIndex(
        "s",
        val22,
      );
      const { result: bySecondary23 } = await db.val23.findBySecondaryIndex(
        "s",
        val23,
      );
      const { result: bySecondary24 } = await db.val24.findBySecondaryIndex(
        "s",
        val24,
      );
      const { result: bySecondary25 } = await db.val25.findBySecondaryIndex(
        "s",
        val25,
      );
      const { result: bySecondary26 } = await db.val26.findBySecondaryIndex(
        "s",
        val26,
      );

      //assert(bySecondary1.length === 1)
      assert(bySecondary2.length === 1);
      assert(bySecondary3.length === 1);
      assert(bySecondary4.length === 1);
      assert(bySecondary5.length === 1);
      assert(bySecondary6.length === 1);
      assert(bySecondary7.length === 1);
      assert(bySecondary8.length === 1);
      assert(bySecondary9.length === 1);
      assert(bySecondary10.length === 1);
      assert(bySecondary11.length === 1);
      assert(bySecondary12.length === 1);
      assert(bySecondary13.length === 1);
      assert(bySecondary14.length === 1);
      assert(bySecondary15.length === 1);
      assert(bySecondary16.length === 1);
      assert(bySecondary17.length === 1);
      assert(bySecondary18.length === 1);
      assert(bySecondary19.length === 1);
      assert(bySecondary20.length === 1);
      assert(bySecondary21.length === 1);
      assert(bySecondary22.length === 1);
      assert(bySecondary23.length === 1);
      assert(bySecondary24.length === 1);
      assert(bySecondary25.length === 1);
      assert(bySecondary26.length === 1);
    });
  });

  await t.step("Should successfully generate id asynchronously", async () => {
    await useKv(async (kv) => {
      const db = kvdex({
        kv,
        schema: {
          test: collection(model<User>(), {
            indices: {
              username: "primary",
              age: "secondary",
            },
            idGenerator: async (user) => {
              const buffer = await crypto.subtle.digest(
                "SHA-256",
                new ArrayBuffer(user.age),
              );
              return Math.random() * buffer.byteLength;
            },
          }),
        },
      });

      const cr1 = await db.test.add(mockUser1);
      const cr2 = await db.atomic((s) => s.test).add(mockUser2).commit();
      const doc2 = await db.test.getOne({
        filter: (doc) => doc.value.username === mockUser2.username,
      });

      assert(cr1.ok);
      assert(typeof cr1.id === "number");
      assert(cr2.ok);
      assert(doc2 !== null);
      assert(typeof doc2.id === "number");
    });
  });
});
