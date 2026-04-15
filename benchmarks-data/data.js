window.BENCHMARK_DATA = {
  "lastUpdate": 1776293891998,
  "repoUrl": "https://github.com/oliver-oloughlin/kvdex",
  "entries": {
    "Benchmark": [
      {
        "commit": {
          "author": {
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin",
            "email": "54100972+oliver-oloughlin@users.noreply.github.com"
          },
          "committer": {
            "name": "GitHub",
            "username": "web-flow",
            "email": "noreply@github.com"
          },
          "id": "cf1136b1dab4dbea1ff84426a06962d7ba3b8add",
          "message": "fix: broken update tests & race condition bug for index updates (#294)",
          "timestamp": "2026-04-13T07:16:57Z",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/cf1136b1dab4dbea1ff84426a06962d7ba3b8add"
        },
        "date": 1776065153477,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 141.42,
            "range": "113 … 299 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 37419.51,
            "range": "31222 … 56964 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 7500.43,
            "range": "6325 … 9308 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 67.92,
            "range": "51 … 375 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10212.05,
            "range": "8881 … 12517 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 100.88,
            "range": "87 … 228 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 14629.16,
            "range": "13124 … 18912 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 10229.8,
            "range": "8729 … 15796 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 9178.97,
            "range": "8356 … 11722 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1152.81,
            "range": "751 … 1660 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 9118.11,
            "range": "7998 … 11646 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 133.16,
            "range": "99 … 277 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 162.83,
            "range": "138 … 394 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 166.07,
            "range": "147 … 309 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 171.46,
            "range": "157 … 263 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 32599.19,
            "range": "27619 … 45625 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 32741.24,
            "range": "29021 … 40483 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 34882.39,
            "range": "30308 … 43078 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1425,
            "range": "871 … 2161 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1807.42,
            "range": "1032 … 3821 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 1918.13,
            "range": "1383 … 2864 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 203.77,
            "range": "175 … 466 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 181.61,
            "range": "156 … 363 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 140.12,
            "range": "104 … 489 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 74.27,
            "range": "63 … 179 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 56.63,
            "range": "47 … 134 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 173.55,
            "range": "144 … 325 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 26891.38,
            "range": "23335 … 30428 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 98927.52,
            "range": "89103 … 113949 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 27.72,
            "range": "22 … 103 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 134.77,
            "range": "123 … 249 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 108341.52,
            "range": "102406 … 114460 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 172.2,
            "range": "146 … 396 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 63143.17,
            "range": "55045 … 81718 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 7446.69,
            "range": "6310 … 8308 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 11474.87,
            "range": "9674 … 12603 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 182.56,
            "range": "157 … 475 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 245.22,
            "range": "208 … 581 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 67839.96,
            "range": "60972 … 79243 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 34172.29,
            "range": "32095 … 40747 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 99.93,
            "range": "89 … 279 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 109.62,
            "range": "96 … 325 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 11836.46,
            "range": "9425 … 13315 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 16177.08,
            "range": "13279 … 19524 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 10150.83,
            "range": "9171 … 11173 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 10086.17,
            "range": "8928 … 11563 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 24631.86,
            "range": "22985 … 26913 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1476.82,
            "range": "837 … 2190 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 2334.57,
            "range": "1099 … 3012 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2268.31,
            "range": "1063 … 2859 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 10201.44,
            "range": "9315 … 11126 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 164.97,
            "range": "132 … 391 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 226.79,
            "range": "194 … 470 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 194.08,
            "range": "173 … 540 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 199.52,
            "range": "179 … 383 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 227.39,
            "range": "193 … 461 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 201.21,
            "range": "176 … 581 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 206.43,
            "range": "182 … 988 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 59187.87,
            "range": "55003 … 63789 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 72987.24,
            "range": "64823 … 96285 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 70410,
            "range": "67821 … 87183 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 58594.39,
            "range": "55250 … 62968 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 66929.51,
            "range": "64429 … 73411 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 75997.25,
            "range": "64776 … 135718 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 1779.87,
            "range": "1062 … 3012 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 1894.85,
            "range": "1100 … 2652 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 2132.47,
            "range": "1665 … 2755 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 2605.39,
            "range": "1221 … 3166 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 3214.63,
            "range": "2711 … 4542 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 2939.59,
            "range": "2094 … 3665 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 237.75,
            "range": "201 … 635 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 223.6,
            "range": "198 … 388 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 253.55,
            "range": "210 … 582 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 227.73,
            "range": "198 … 371 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 260.25,
            "range": "189 … 1307 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 73663.09,
            "range": "63945 … 84760 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 259.4,
            "range": "136 … 777 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 172.4,
            "range": "145 … 434 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 18540.93,
            "range": "15761 … 21742 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 345.54,
            "range": "283 … 1074 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 213691.51,
            "range": "198255 … 251099 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 218370.73,
            "range": "186219 … 248625 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 220838.99,
            "range": "189391 … 264452 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 1878.68,
            "range": "1317 … 5045 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 230226.17,
            "range": "192198 … 249680 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 256.11,
            "range": "184 … 1312 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 515.98,
            "range": "406 … 1296 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 537,
            "range": "460 … 1532 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 535.52,
            "range": "468 … 912 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 320426.16,
            "range": "286225 … 365409 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 327706.71,
            "range": "296843 … 380203 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 326169.74,
            "range": "282429 … 379471 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 2206.1,
            "range": "1685 … 4724 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 2005.28,
            "range": "1507 … 2766 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 2120.99,
            "range": "1540 … 2941 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 326.8,
            "range": "272 … 809 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 608.64,
            "range": "500 … 1133 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 321.58,
            "range": "238 … 1039 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 148432.86,
            "range": "128880 … 184292 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 8345.43,
            "range": "5923 … 12882 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 222761.98,
            "range": "197147 … 247643 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 518.01,
            "range": "417 … 957 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 635.96,
            "range": "502 … 1192 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 482717.26,
            "range": "465277 … 510456 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 46977.37,
            "range": "43864 … 52531 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 345.65,
            "range": "287 … 1660 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 403.21,
            "range": "321 … 798 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 211753.1,
            "range": "194055 … 246855 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 217025.48,
            "range": "190918 … 251270 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 220340.54,
            "range": "202369 … 253451 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 225094.41,
            "range": "200514 … 246733 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 458779.5,
            "range": "417022 … 520951 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 3553.2,
            "range": "1272 … 8949 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 4181.81,
            "range": "1591 … 8808 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 3928,
            "range": "1498 … 7788 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 223795.51,
            "range": "198357 … 262508 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 320.73,
            "range": "241 … 996 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 758.97,
            "range": "591 … 1547 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 644.5,
            "range": "549 … 1223 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 640.35,
            "range": "551 … 961 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 809.41,
            "range": "623 … 1861 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 708.35,
            "range": "599 … 1735 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 687.03,
            "range": "588 … 1026 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 449915.65,
            "range": "409863 … 493567 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 465018.87,
            "range": "432643 … 531562 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 472028.52,
            "range": "435704 … 514153 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 434782.56,
            "range": "389653 … 515610 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 427764.5,
            "range": "405493 … 454902 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 436878.54,
            "range": "405429 … 486176 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 4139,
            "range": "1831 … 8959 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 4266.55,
            "range": "1786 … 8421 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 4677.02,
            "range": "1868 … 9168 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4713.19,
            "range": "2120 … 9778 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 4558.08,
            "range": "1999 … 9082 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 4904.06,
            "range": "1914 … 9959 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 405.25,
            "range": "304 … 1671 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 732.03,
            "range": "595 … 1563 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 469.23,
            "range": "356 … 1653 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 794.28,
            "range": "620 … 1626 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 938764.67,
            "range": "903479 … 1006622 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 130465.56,
            "range": "102912 … 271975 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 596284.7,
            "range": "590101 … 612200 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 707104.23,
            "range": "690846 … 748801 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 123316.16,
            "range": "94803 … 194557 µs",
            "unit": "µs/iter"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin",
            "email": "54100972+oliver-oloughlin@users.noreply.github.com"
          },
          "committer": {
            "name": "GitHub",
            "username": "web-flow",
            "email": "noreply@github.com"
          },
          "id": "37a2810c26867a52ea72fcf01a3a6981c6def2dc",
          "message": "Ensure MapKv initializers finish before operations run (#297)\n\n* feat: implement ready promise to halt operations until intializers are complete\n\n* chore: add tests for MapKv readiness\n\n* chore: bump version\n\n---------\n\nCo-authored-by: oliver-oloughlin <oliver.oloughlin@gmail.com>",
          "timestamp": "2026-04-15T22:51:06Z",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/37a2810c26867a52ea72fcf01a3a6981c6def2dc"
        },
        "date": 1776293891596,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 140.71,
            "range": "102 … 2330 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 28047.63,
            "range": "23805 … 50400 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 6646.02,
            "range": "5851 … 8120 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 60.86,
            "range": "50 … 172 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 9754.15,
            "range": "8886 … 10874 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 121.59,
            "range": "90 … 194 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 18213.06,
            "range": "14424 … 19962 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 10663.36,
            "range": "8635 … 15832 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 8990.62,
            "range": "8232 … 10239 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1166.8,
            "range": "971 … 1543 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 8984.83,
            "range": "8154 … 10015 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 136.29,
            "range": "100 … 437 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 160.32,
            "range": "136 … 328 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 166.53,
            "range": "149 … 347 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 172.84,
            "range": "155 … 348 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 33978.23,
            "range": "27324 … 44047 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 31502.61,
            "range": "27728 … 39037 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 32334.78,
            "range": "29009 … 43667 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1435.51,
            "range": "1047 … 2113 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1795.81,
            "range": "1317 … 2884 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 1835.29,
            "range": "1353 … 2554 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 202.86,
            "range": "174 … 624 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 179.69,
            "range": "155 … 292 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 137.79,
            "range": "103 … 279 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 74.6,
            "range": "64 … 174 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 56.64,
            "range": "49 … 112 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 178.83,
            "range": "156 … 510 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 23193.33,
            "range": "20057 … 26423 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 99102.63,
            "range": "93742 … 106456 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 27.98,
            "range": "22 … 125 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 134.75,
            "range": "123 … 246 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 105832.82,
            "range": "103184 … 112320 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 171.38,
            "range": "141 … 415 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 57431.72,
            "range": "53384 … 67612 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 7154.85,
            "range": "6235 … 8016 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 11343.3,
            "range": "9634 … 12436 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 195.46,
            "range": "156 … 3313 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 247.78,
            "range": "213 … 588 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 66007.38,
            "range": "57774 … 80703 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 34097.61,
            "range": "31022 … 38359 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 100.36,
            "range": "89 … 306 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 109.98,
            "range": "95 … 303 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 11390.74,
            "range": "10130 … 12175 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 15255.78,
            "range": "13293 … 19561 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 10118.76,
            "range": "8926 … 11389 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 10046.18,
            "range": "9054 … 10648 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 24188.22,
            "range": "22462 … 25290 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1403.03,
            "range": "861 … 2013 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 2358.36,
            "range": "1071 … 3133 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2275.43,
            "range": "996 … 3626 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 9998.54,
            "range": "9150 … 11292 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 165.57,
            "range": "134 … 385 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 222.49,
            "range": "191 … 397 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 198.31,
            "range": "172 … 529 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 199.21,
            "range": "179 … 411 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 227.9,
            "range": "195 … 403 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 200.43,
            "range": "176 … 563 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 209.78,
            "range": "186 … 356 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 57286.25,
            "range": "53887 … 60626 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 70986.72,
            "range": "64064 … 87953 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 68955.12,
            "range": "65128 … 79839 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 56792.87,
            "range": "54291 … 62480 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 65580.17,
            "range": "61829 … 80065 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 67630.83,
            "range": "62354 … 89088 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 1762.18,
            "range": "1047 … 2751 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 1848.41,
            "range": "1139 … 2510 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 1977.88,
            "range": "1564 … 2359 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 2463.26,
            "range": "1216 … 3200 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 2813.15,
            "range": "2606 … 3150 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 2791.8,
            "range": "1984 … 3717 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 238.15,
            "range": "204 … 570 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 221.01,
            "range": "197 … 416 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 251.49,
            "range": "208 … 605 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 228.1,
            "range": "203 … 400 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 261.91,
            "range": "188 … 1228 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 69740.21,
            "range": "60984 … 84886 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 250.16,
            "range": "134 … 723 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 172.48,
            "range": "148 … 380 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 18880.63,
            "range": "15718 … 23177 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 344.72,
            "range": "279 … 1114 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 209772.84,
            "range": "192231 … 251089 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 211060.96,
            "range": "185817 … 271566 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 218329.03,
            "range": "188019 … 242300 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 1964.96,
            "range": "1229 … 5345 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 211705.66,
            "range": "186213 … 261761 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 259.38,
            "range": "186 … 1303 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 513.34,
            "range": "407 … 1263 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 538.84,
            "range": "462 … 1346 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 522.27,
            "range": "464 … 720 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 314176.02,
            "range": "280292 … 351326 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 304692.92,
            "range": "284144 … 322430 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 314105.95,
            "range": "290894 … 352049 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 2090.65,
            "range": "1609 … 4666 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 1933.93,
            "range": "1414 … 2772 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 2074.85,
            "range": "1495 … 2760 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 327.18,
            "range": "274 … 856 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 601.75,
            "range": "499 … 1268 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 331.96,
            "range": "244 … 970 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 144924.27,
            "range": "123975 … 178713 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 8156.03,
            "range": "5757 … 12761 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 216043.25,
            "range": "193725 … 250839 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 507.29,
            "range": "413 … 1148 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 635.97,
            "range": "504 … 1228 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 487970.86,
            "range": "447913 … 531840 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 45402.25,
            "range": "42667 … 49258 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 342.74,
            "range": "286 … 651 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 408.93,
            "range": "328 … 1397 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 206235.93,
            "range": "192997 … 246843 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 202352.49,
            "range": "183827 … 219988 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 221893.69,
            "range": "202636 … 249203 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 211494.91,
            "range": "186801 … 246008 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 453919.62,
            "range": "403813 … 515276 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 3284.14,
            "range": "1306 … 7191 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3601.01,
            "range": "1486 … 7460 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 3874.64,
            "range": "1448 … 8002 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 209758.14,
            "range": "197609 … 232947 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 321.19,
            "range": "240 … 989 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 756.59,
            "range": "593 … 1389 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 643.34,
            "range": "543 … 1204 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 633.23,
            "range": "543 … 1218 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 807.94,
            "range": "633 … 2120 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 691.69,
            "range": "586 … 1501 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 681.19,
            "range": "584 … 1132 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 440939.36,
            "range": "395457 … 479971 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 453005.85,
            "range": "425897 … 483289 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 453379.1,
            "range": "421610 … 496832 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 417005.3,
            "range": "389791 … 449807 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 431570.71,
            "range": "399996 … 477614 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 415195.95,
            "range": "396540 … 445420 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 3690.79,
            "range": "1761 … 7736 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 3478.87,
            "range": "1740 … 7512 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 3670.1,
            "range": "1736 … 7894 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4209.27,
            "range": "1952 … 8434 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 4173.83,
            "range": "1911 … 8352 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 4390.35,
            "range": "1854 … 9244 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 400.94,
            "range": "303 … 1384 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 718.43,
            "range": "589 … 1766 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 465.51,
            "range": "350 … 2192 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 770.16,
            "range": "618 … 1364 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 935526.34,
            "range": "888395 … 1012423 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 126335.71,
            "range": "99176 … 192591 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 585498.15,
            "range": "581395 … 598990 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 695089.53,
            "range": "676904 … 732351 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 111890.99,
            "range": "89042 … 129712 µs",
            "unit": "µs/iter"
          }
        ]
      }
    ]
  }
}