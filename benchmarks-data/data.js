window.BENCHMARK_DATA = {
  "lastUpdate": 1779555075644,
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
      },
      {
        "commit": {
          "author": {
            "email": "54100972+oliver-oloughlin@users.noreply.github.com",
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "016faa15b4762dd09c3cd7f9b95a41e7021f6bbc",
          "message": "refactor: update benchmarks workflow (#298)\n\nCo-authored-by: oliver-oloughlin <oliver.oloughlin@gmail.com>",
          "timestamp": "2026-04-16T16:35:10Z",
          "tree_id": "628dd654930c2ef8667022ba99a52725c648b8f7",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/016faa15b4762dd09c3cd7f9b95a41e7021f6bbc"
        },
        "date": 1776357735872,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 200.25,
            "range": "147 … 1850 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 35200.59,
            "range": "26937 … 57167 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 6882.49,
            "range": "6136 … 7980 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 79.66,
            "range": "68 … 186 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10599.56,
            "range": "9594 … 11841 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 119.44,
            "range": "105 … 213 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 18067.61,
            "range": "14580 … 24335 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 10476.99,
            "range": "8501 … 15890 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 9280.62,
            "range": "8326 … 12132 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1256.32,
            "range": "944 … 1760 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 9339.73,
            "range": "8140 … 10290 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 154,
            "range": "110 … 326 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 203.47,
            "range": "176 … 384 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 209.09,
            "range": "186 … 521 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 212.41,
            "range": "187 … 412 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 38067.92,
            "range": "30278 … 46794 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 39455.9,
            "range": "30311 … 52072 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 38578.31,
            "range": "31452 … 52731 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1547.13,
            "range": "1140 … 2248 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1989.03,
            "range": "1419 … 2831 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 2141.9,
            "range": "1504 … 3199 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 237.88,
            "range": "204 … 693 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 219.92,
            "range": "193 … 320 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 160.91,
            "range": "115 … 436 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 96.65,
            "range": "86 … 178 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 74.68,
            "range": "65 … 146 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 192.33,
            "range": "167 … 373 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 28022.73,
            "range": "24760 … 30881 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 107596.19,
            "range": "99136 … 127065 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 30.57,
            "range": "22 … 192 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 145.09,
            "range": "128 … 416 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 118446.54,
            "range": "113116 … 128304 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 187.16,
            "range": "144 … 455 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 69264.51,
            "range": "57340 … 96024 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 8022.11,
            "range": "7263 … 8963 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 12288.9,
            "range": "10498 … 13523 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 226.86,
            "range": "192 … 529 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 324.96,
            "range": "272 … 817 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 85549.78,
            "range": "73852 … 106274 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 36073.16,
            "range": "33937 … 38615 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 121.57,
            "range": "104 … 228 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 131.35,
            "range": "117 … 289 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 12379.7,
            "range": "10017 … 13786 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 16766.01,
            "range": "14535 … 23301 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 10598.17,
            "range": "9047 … 11718 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 10748.63,
            "range": "9402 … 11804 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 26287.25,
            "range": "24224 … 28422 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1663.1,
            "range": "814 … 2566 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 2352.71,
            "range": "1137 … 3307 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2679.59,
            "range": "1041 … 3650 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 11086.65,
            "range": "10407 … 12140 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 187.93,
            "range": "153 … 464 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 268.39,
            "range": "225 … 564 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 237.05,
            "range": "207 … 566 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 240.99,
            "range": "213 … 394 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 277.86,
            "range": "235 … 499 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 252.32,
            "range": "215 … 2556 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 252.8,
            "range": "214 … 494 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 64397.92,
            "range": "60196 … 69247 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 79803.49,
            "range": "70332 … 105910 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 78390.18,
            "range": "69777 … 107229 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 63193.4,
            "range": "58587 … 69037 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 78358.18,
            "range": "66582 … 106543 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 84750.61,
            "range": "67759 … 165859 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 2036.22,
            "range": "1172 … 2798 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 2122.45,
            "range": "1111 … 2939 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 2419.73,
            "range": "1885 … 3036 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 2790.35,
            "range": "1375 … 3476 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 3094.11,
            "range": "2624 … 3565 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 3098.08,
            "range": "2663 … 3494 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 263.98,
            "range": "225 … 609 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 265.73,
            "range": "234 … 704 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 290.1,
            "range": "232 … 619 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 271.16,
            "range": "239 … 416 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 272.36,
            "range": "223 … 859 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 78591.23,
            "range": "62898 … 91681 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 334.93,
            "range": "167 … 1069 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 212.09,
            "range": "180 … 646 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 21484.05,
            "range": "18863 … 25078 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 421.35,
            "range": "332 … 1200 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 245546.7,
            "range": "218637 … 271513 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 268975.55,
            "range": "234641 … 300809 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 259479.51,
            "range": "223404 … 287716 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 2216.58,
            "range": "1455 … 4967 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 260843.24,
            "range": "219688 … 292486 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 270.3,
            "range": "217 … 880 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 616.64,
            "range": "476 … 1368 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 653.22,
            "range": "566 … 1262 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 642.89,
            "range": "571 … 1041 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 407004.67,
            "range": "346567 … 481318 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 401861.99,
            "range": "332887 … 461430 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 418500.52,
            "range": "362291 … 482264 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 2445.71,
            "range": "1778 … 5439 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 2475.85,
            "range": "1706 … 3832 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 2300.15,
            "range": "1679 … 2926 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 361.14,
            "range": "295 … 781 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 717.95,
            "range": "592 … 1503 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 365.44,
            "range": "261 … 1195 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 150930.2,
            "range": "118649 … 204297 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 8782.28,
            "range": "6271 … 13026 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 244256.87,
            "range": "224852 … 268921 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 614.71,
            "range": "492 … 1138 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 786.51,
            "range": "636 … 1364 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 579604.06,
            "range": "519687 … 656958 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 47284.77,
            "range": "41315 … 50248 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 425.03,
            "range": "341 … 751 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 494.3,
            "range": "398 … 1104 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 256097.51,
            "range": "235763 … 286965 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 255510.61,
            "range": "230932 … 280737 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 261509.07,
            "range": "237492 … 294613 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 260760.67,
            "range": "230755 … 294532 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 505703.5,
            "range": "439787 … 740672 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 3411.75,
            "range": "1513 … 7394 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3971.79,
            "range": "1729 … 7812 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 4082.53,
            "range": "1663 … 7986 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 261862.57,
            "range": "226118 … 305915 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 352.45,
            "range": "259 … 1111 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 914.29,
            "range": "692 … 1671 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 789.89,
            "range": "680 … 1349 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 760.88,
            "range": "657 … 1341 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 983.22,
            "range": "766 … 2515 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 853.65,
            "range": "720 … 1780 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 836.2,
            "range": "718 … 1215 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 538726.58,
            "range": "465821 … 609174 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 540372.25,
            "range": "497773 … 594710 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 547162.58,
            "range": "494142 … 659680 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 516150.18,
            "range": "470102 … 568847 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 525903.51,
            "range": "489182 … 606603 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 538971.42,
            "range": "492602 … 633944 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 3561.12,
            "range": "2207 … 8477 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 4668.8,
            "range": "2052 … 9950 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 4789.36,
            "range": "2013 … 8814 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4725.55,
            "range": "2419 … 9770 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 4062.2,
            "range": "2037 … 8523 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 4498.05,
            "range": "2095 … 8727 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 542.24,
            "range": "408 … 2018 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 1068.55,
            "range": "862 … 2364 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 523.46,
            "range": "396 … 2257 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 926.4,
            "range": "751 … 1600 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 1008177.11,
            "range": "965402 … 1083362 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 136175.45,
            "range": "98278 … 242001 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 635970.22,
            "range": "629652 … 639930 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 734110.42,
            "range": "715341 … 779316 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 118240.07,
            "range": "93433 … 163288 µs",
            "unit": "µs/iter"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "54100972+oliver-oloughlin@users.noreply.github.com",
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a9785700e9c85582a99d2489ed4b6a3688a59931",
          "message": "Fix map kv key ordering (#299)\n\n* fix: use normal comparison operators\n\n* fix: catch and await dangling promise\n\n* chore: bump version\n\n* fix: remove unused promise with resolvers\n\n---------\n\nCo-authored-by: oliver-oloughlin <oliver.oloughlin@gmail.com>",
          "timestamp": "2026-04-18T02:10:34+02:00",
          "tree_id": "d2a66b574c479b9819bf353c54cdad0ebfa78cee",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/a9785700e9c85582a99d2489ed4b6a3688a59931"
        },
        "date": 1776471447462,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 184.31,
            "range": "134 … 2289 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 37923.33,
            "range": "30664 … 58699 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 7173.34,
            "range": "6091 … 8975 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 61.5,
            "range": "49 … 171 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10610.31,
            "range": "9316 … 12076 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 100.96,
            "range": "88 … 213 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 15525.63,
            "range": "13692 … 21110 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 11440.03,
            "range": "9364 … 16630 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 10094.85,
            "range": "8861 … 12821 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1581.59,
            "range": "857 … 2665 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 9978.57,
            "range": "9074 … 10874 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 138.51,
            "range": "103 … 336 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 160.76,
            "range": "140 … 413 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 167.74,
            "range": "147 … 283 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 172.2,
            "range": "155 … 317 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 36420.79,
            "range": "30607 … 48850 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 37215.44,
            "range": "31699 … 45758 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 39041.93,
            "range": "33237 … 48493 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 2090.07,
            "range": "1324 … 4023 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 2978.89,
            "range": "1633 … 5926 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 3070.77,
            "range": "1736 … 5480 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 208.38,
            "range": "177 … 621 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 180.64,
            "range": "158 … 369 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 143.95,
            "range": "117 … 476 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 76.2,
            "range": "65 … 246 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 57.16,
            "range": "49 … 141 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 178.68,
            "range": "157 … 350 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 31131.61,
            "range": "27283 … 35377 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 113444.48,
            "range": "102776 … 121769 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 28.63,
            "range": "22 … 114 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 137.44,
            "range": "123 … 471 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 115682.16,
            "range": "106556 … 131380 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 175.03,
            "range": "147 … 568 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 68125.77,
            "range": "58829 … 84789 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 8699.6,
            "range": "6997 … 10231 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 13447.22,
            "range": "11181 … 14946 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 181.84,
            "range": "156 … 540 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 250.6,
            "range": "212 … 603 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 71220.52,
            "range": "66030 … 84290 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 37374.82,
            "range": "35024 … 39660 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 102.36,
            "range": "89 … 299 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 112.5,
            "range": "97 … 318 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 15230.12,
            "range": "11620 … 21190 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 15599.57,
            "range": "13701 … 22100 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 12976.75,
            "range": "11582 … 14427 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 12801.53,
            "range": "11141 … 14775 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 30495.35,
            "range": "27505 … 45007 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 2863.38,
            "range": "1083 … 4415 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 4121.8,
            "range": "1347 … 5493 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 4291.41,
            "range": "1401 … 5842 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 13653.68,
            "range": "11506 … 15801 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 172.85,
            "range": "140 … 472 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 229.47,
            "range": "193 … 467 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 200.14,
            "range": "176 … 519 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 210.21,
            "range": "182 … 449 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 238.22,
            "range": "202 … 519 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 206.87,
            "range": "180 … 532 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 213.46,
            "range": "189 … 493 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 66749.9,
            "range": "65172 … 71755 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 78529.67,
            "range": "74678 … 84032 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 80383.04,
            "range": "75080 … 94661 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 67335.05,
            "range": "63708 … 73776 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 78875.49,
            "range": "72421 … 92288 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 89642,
            "range": "72673 … 215020 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 3191.36,
            "range": "1363 … 5386 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 3868.99,
            "range": "1497 … 5073 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 4405.72,
            "range": "3259 … 5322 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4420.22,
            "range": "1887 … 5979 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 5302.9,
            "range": "4671 … 5718 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 5161.07,
            "range": "3443 … 5748 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 245.54,
            "range": "206 … 572 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 229.87,
            "range": "201 … 477 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 260.47,
            "range": "212 … 975 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 234.51,
            "range": "201 … 498 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 279.55,
            "range": "200 … 1569 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 83264.27,
            "range": "70765 … 103510 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 409.89,
            "range": "201 … 1266 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 176.04,
            "range": "149 … 440 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 21963.86,
            "range": "15562 … 27634 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 411.82,
            "range": "314 … 2828 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 221301.48,
            "range": "195710 … 254274 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 230454.32,
            "range": "197261 … 280721 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 229782.05,
            "range": "195797 … 276836 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 2741.17,
            "range": "1604 … 7353 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 220630.14,
            "range": "196830 … 264375 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 273.39,
            "range": "199 … 1332 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 541.15,
            "range": "408 … 1477 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 572.93,
            "range": "484 … 1222 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 577.8,
            "range": "485 … 1061 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 340197.46,
            "range": "288754 … 393472 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 333292.08,
            "range": "303043 … 419089 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 337562.87,
            "range": "299742 … 392161 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 2988.71,
            "range": "1895 … 6471 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 2977.72,
            "range": "1854 … 4050 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 2706.15,
            "range": "1839 … 3703 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 331.82,
            "range": "273 … 692 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 652.82,
            "range": "510 … 1351 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 334.12,
            "range": "247 … 1135 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 158515.14,
            "range": "138210 … 182784 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 9139.31,
            "range": "6135 … 14076 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 223270.78,
            "range": "201247 … 255147 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 542.36,
            "range": "431 … 1410 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 670.02,
            "range": "531 … 1255 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 532342.19,
            "range": "487438 … 570545 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 47345.1,
            "range": "42526 … 53288 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 359.63,
            "range": "289 … 683 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 428.28,
            "range": "336 … 1099 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 247799.2,
            "range": "198501 … 378097 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 215430.95,
            "range": "192123 … 252106 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 236514.8,
            "range": "199362 … 256320 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 226018,
            "range": "203523 … 253490 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 449229.65,
            "range": "408824 … 500818 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 4294,
            "range": "1589 … 10414 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 4789.14,
            "range": "1786 … 10367 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 4543.79,
            "range": "2991 … 7623 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 233345.46,
            "range": "212595 … 288998 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 333.55,
            "range": "246 … 1024 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 807.14,
            "range": "612 … 1633 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 675.46,
            "range": "565 … 1461 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 654.01,
            "range": "551 … 1072 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 847.99,
            "range": "649 … 1965 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 744.54,
            "range": "624 … 1696 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 715.91,
            "range": "606 … 1038 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 469575.41,
            "range": "447315 … 506586 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 481106.17,
            "range": "446805 … 535928 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 476477.32,
            "range": "440701 … 513268 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 461145.44,
            "range": "414654 … 514023 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 444624.85,
            "range": "420520 … 487564 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 452910.93,
            "range": "422749 … 510012 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 5088.16,
            "range": "2088 … 12121 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 5770.97,
            "range": "2129 … 11207 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 6260.49,
            "range": "2125 … 11226 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 5837.05,
            "range": "2345 … 11488 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 7078.86,
            "range": "2358 … 11131 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 6923.09,
            "range": "2260 … 13753 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 416.74,
            "range": "306 … 1310 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 790.4,
            "range": "632 … 1553 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 473.93,
            "range": "360 … 1842 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 796.57,
            "range": "635 … 1632 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 941485.85,
            "range": "903483 … 1019112 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 135981.1,
            "range": "102405 … 256577 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 596570.29,
            "range": "589189 … 604510 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 711229.63,
            "range": "688613 … 814636 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 115019.6,
            "range": "94700 … 135567 µs",
            "unit": "µs/iter"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "54100972+oliver-oloughlin@users.noreply.github.com",
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "387f5f5d5ed0cffa94011cd86e92c19ba79226c7",
          "message": "Optimize `keyEq` util (#300)\n\n* refactor: optimze keyEq util\n\n* chore: add tests for keyEq util\n\n* chore: bump version\n\n---------\n\nCo-authored-by: oliver-oloughlin <oliver.oloughlin@gmail.com>",
          "timestamp": "2026-04-19T17:37:15+02:00",
          "tree_id": "3168e85fa1b7e0d3bf3b0d511b0127da930a253e",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/387f5f5d5ed0cffa94011cd86e92c19ba79226c7"
        },
        "date": 1776613458271,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 135.82,
            "range": "110 … 319 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 38727.17,
            "range": "33522 … 59390 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 8854.09,
            "range": "6930 … 15283 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 55.33,
            "range": "46 … 161 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10777.12,
            "range": "9618 … 12486 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 91.95,
            "range": "78 … 202 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 16887.07,
            "range": "13804 … 22243 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 10995.13,
            "range": "9421 … 14755 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 10163.5,
            "range": "9145 … 12493 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1566.1,
            "range": "1176 … 2147 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 9808.93,
            "range": "8600 … 12588 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 124.03,
            "range": "97 … 360 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 145.54,
            "range": "125 … 302 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 150.82,
            "range": "133 … 523 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 155.87,
            "range": "140 … 353 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 35272.07,
            "range": "30006 … 49266 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 36100.77,
            "range": "30297 … 42299 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 36542.26,
            "range": "31920 … 42181 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1673.55,
            "range": "949 … 2650 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 2064.67,
            "range": "1555 … 2677 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 2088.64,
            "range": "1549 … 2967 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 206.72,
            "range": "158 … 1267 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 163.19,
            "range": "143 … 341 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 127.06,
            "range": "103 … 394 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 67.26,
            "range": "58 … 239 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 52.84,
            "range": "46 … 245 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 159.44,
            "range": "139 … 334 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 30139.33,
            "range": "26999 … 35068 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 109516.48,
            "range": "103000 … 118163 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 30.41,
            "range": "23 … 98 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 151.99,
            "range": "135 … 327 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 117797.91,
            "range": "110694 … 127689 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 157.99,
            "range": "130 … 378 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 61777.86,
            "range": "56378 … 74151 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 8201.07,
            "range": "7203 … 9033 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 13290.54,
            "range": "11614 … 16827 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 166.73,
            "range": "143 … 1133 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 226,
            "range": "201 … 503 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 70502.42,
            "range": "65159 … 81990 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 35356.14,
            "range": "33505 … 38716 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 92.59,
            "range": "79 … 258 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 99.78,
            "range": "88 … 230 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 13276.51,
            "range": "10618 … 16853 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 14993.53,
            "range": "13726 … 19636 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 11091.54,
            "range": "9808 … 12115 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 11447.05,
            "range": "10122 … 12644 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 27341.34,
            "range": "24758 … 28502 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1755.42,
            "range": "924 … 2342 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 2664.62,
            "range": "1112 … 3575 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2547.99,
            "range": "1120 … 3349 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 11464.33,
            "range": "10459 … 12701 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 154.28,
            "range": "122 … 442 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 200.16,
            "range": "172 … 556 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 192.59,
            "range": "155 … 1551 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 183.41,
            "range": "163 … 393 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 209.82,
            "range": "179 … 411 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 184.97,
            "range": "162 … 729 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 188.97,
            "range": "168 … 349 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 55230.55,
            "range": "51337 … 63823 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 71820.31,
            "range": "66310 … 85463 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 73594.83,
            "range": "69340 … 85274 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 54357.46,
            "range": "50628 … 57661 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 69374.61,
            "range": "64983 … 81268 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 75020.05,
            "range": "67030 … 134778 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 1938.98,
            "range": "1150 … 2427 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 2282.36,
            "range": "1215 … 3243 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 2542.43,
            "range": "2027 … 3044 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 3017.41,
            "range": "1379 … 3966 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 3634.16,
            "range": "3300 … 4011 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 3487.41,
            "range": "2613 … 3881 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 226.58,
            "range": "189 … 520 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 200.88,
            "range": "179 … 430 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 234.52,
            "range": "201 … 576 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 208.39,
            "range": "183 … 368 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 243.92,
            "range": "178 … 1147 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 78239.06,
            "range": "65025 … 96161 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 350.8,
            "range": "167 … 1079 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 156.19,
            "range": "137 … 360 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 20405.35,
            "range": "17264 … 24141 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 420.07,
            "range": "359 … 910 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 298691.64,
            "range": "279861 … 324140 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 306572.52,
            "range": "277510 … 341885 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 303469.75,
            "range": "282901 … 332521 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 2341.85,
            "range": "1508 … 5552 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 304737.89,
            "range": "279755 … 346761 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 240.27,
            "range": "173 … 1043 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 468.27,
            "range": "372 … 1181 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 606.01,
            "range": "547 … 1253 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 615.16,
            "range": "546 … 1508 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 414819.79,
            "range": "379610 … 458742 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 408247.26,
            "range": "379354 … 454359 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 419657.66,
            "range": "382017 … 490060 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 4317.28,
            "range": "1903 … 7027 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 6150.06,
            "range": "4786 … 7484 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 6858.06,
            "range": "4565 … 7912 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 319.74,
            "range": "264 … 1196 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 680.6,
            "range": "605 … 1133 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 312.19,
            "range": "231 … 1102 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 141257.3,
            "range": "126921 … 164833 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 9464.9,
            "range": "6535 … 13697 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 337343.24,
            "range": "291695 … 519973 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 615.09,
            "range": "527 … 1083 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 726.65,
            "range": "591 … 2518 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 721487.18,
            "range": "692221 … 750921 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 46401.9,
            "range": "40364 … 51374 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 428.61,
            "range": "368 … 870 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 478.64,
            "range": "399 … 871 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 309345.21,
            "range": "297554 … 337075 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 299549.42,
            "range": "285774 … 313762 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 315476.06,
            "range": "289616 … 351702 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 311773.78,
            "range": "289890 … 347155 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 618230.14,
            "range": "577535 … 652607 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 3875.12,
            "range": "1589 … 8435 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 4238.49,
            "range": "1869 … 8638 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 4774.13,
            "range": "2786 … 8012 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 309678.44,
            "range": "291372 … 333205 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 307.98,
            "range": "230 … 1046 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 821.36,
            "range": "671 … 1531 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 722,
            "range": "635 … 1513 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 724.48,
            "range": "635 … 1333 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 851.29,
            "range": "698 … 1955 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 762.85,
            "range": "669 … 1811 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 750.42,
            "range": "668 … 1163 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 507277.94,
            "range": "490223 … 534486 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 531803.83,
            "range": "498229 … 562896 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 532091.19,
            "range": "494730 … 567411 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 532154.57,
            "range": "506402 … 571748 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 537180.61,
            "range": "510717 … 582970 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 550451.61,
            "range": "517422 … 603045 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 4204.47,
            "range": "2002 … 8603 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 4144.41,
            "range": "1903 … 8516 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 3856.31,
            "range": "2003 … 8888 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4839.59,
            "range": "2342 … 8914 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 4587.3,
            "range": "2131 … 9264 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 4467.33,
            "range": "2573 … 8794 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 387.13,
            "range": "297 … 1187 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 787.54,
            "range": "667 … 1410 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 437.42,
            "range": "335 … 1830 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 833.38,
            "range": "702 … 1900 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 963130.33,
            "range": "935122 … 1011562 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 132259.78,
            "range": "102525 … 243597 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 512000.09,
            "range": "507482 … 522525 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 679597.63,
            "range": "659726 … 744774 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 143323,
            "range": "104738 … 188768 µs",
            "unit": "µs/iter"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "54100972+oliver-oloughlin@users.noreply.github.com",
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "99631fa8d80a9d76d00da43d6f0c69183aced0de",
          "message": "fix: overwrite indioces with new documetn value (#302)\n\nCo-authored-by: oliver-oloughlin <oliver.oloughlin@gmail.com>\nCo-authored-by: Copilot <copilot@github.com>",
          "timestamp": "2026-05-02T18:29:05Z",
          "tree_id": "4bdee24a7dabf949038c233d6924b456a64e366d",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/99631fa8d80a9d76d00da43d6f0c69183aced0de"
        },
        "date": 1777746965658,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 150.05,
            "range": "113 … 347 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 37395.19,
            "range": "27264 … 55013 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 7800.12,
            "range": "6601 … 11041 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 94.65,
            "range": "75 … 374 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10668.47,
            "range": "9534 … 13513 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 116.65,
            "range": "105 … 263 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 16824.82,
            "range": "14095 … 23630 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 11142.18,
            "range": "9263 … 16017 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 9180.74,
            "range": "8356 … 10725 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1070.35,
            "range": "710 … 1556 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 9292.97,
            "range": "8344 … 11570 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 150.24,
            "range": "112 … 291 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 202.39,
            "range": "170 … 744 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 202.04,
            "range": "180 … 474 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 208.31,
            "range": "187 … 356 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 35316.55,
            "range": "30000 … 46924 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 34808.24,
            "range": "30587 … 47945 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 38109.22,
            "range": "31386 … 48716 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1521.82,
            "range": "966 … 2474 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1839.77,
            "range": "988 … 3356 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 1796.67,
            "range": "1401 … 3017 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 225.07,
            "range": "196 … 645 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 213.06,
            "range": "187 … 298 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 151.6,
            "range": "115 … 469 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 95.84,
            "range": "85 … 221 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 71.04,
            "range": "60 … 126 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 187.93,
            "range": "165 … 333 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 26990.63,
            "range": "22182 … 29865 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 106507.59,
            "range": "99863 … 116411 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 28.12,
            "range": "22 … 135 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 142.18,
            "range": "126 … 301 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 116045.36,
            "range": "106462 … 122873 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 184.07,
            "range": "143 … 449 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 65930.11,
            "range": "57695 … 97558 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 7070.25,
            "range": "6506 … 7622 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 11617.58,
            "range": "10394 … 12498 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 221.29,
            "range": "191 … 515 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 315.34,
            "range": "269 … 605 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 80957.55,
            "range": "71974 … 104570 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 35480.47,
            "range": "33221 … 39935 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 118.41,
            "range": "104 … 226 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 130.44,
            "range": "115 … 230 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 11528.97,
            "range": "9429 … 12657 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 18044.3,
            "range": "14324 … 25268 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 10730.97,
            "range": "9485 … 13282 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 10818.54,
            "range": "9126 … 12032 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 25467.44,
            "range": "24194 … 27134 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1254.29,
            "range": "806 … 1807 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 2274.11,
            "range": "979 … 3352 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2221,
            "range": "937 … 3333 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 10550.96,
            "range": "8949 … 12178 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 178.41,
            "range": "148 … 454 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 264.21,
            "range": "225 … 482 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 233.65,
            "range": "208 … 548 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 237.21,
            "range": "214 … 349 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 271.91,
            "range": "234 … 514 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 241.45,
            "range": "209 … 1530 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 243.89,
            "range": "216 … 408 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 64570.36,
            "range": "60556 … 67818 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 77284.19,
            "range": "69502 … 107846 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 85374.55,
            "range": "69642 … 108633 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 62175.66,
            "range": "56252 … 68541 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 75801.58,
            "range": "67725 … 101270 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 78934.24,
            "range": "67538 … 123772 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 1553.98,
            "range": "1125 … 2080 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 1627.78,
            "range": "1173 … 2124 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 2194.81,
            "range": "1573 … 2957 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 2393.65,
            "range": "1261 … 3135 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 2399.44,
            "range": "2143 … 2808 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 2625.63,
            "range": "2047 … 3751 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 260.5,
            "range": "225 … 633 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 260.45,
            "range": "228 … 396 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 278.1,
            "range": "230 … 600 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 268.49,
            "range": "236 … 384 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 270.16,
            "range": "221 … 771 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 76050.02,
            "range": "63626 … 92803 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 268.82,
            "range": "154 … 707 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 210.65,
            "range": "180 … 466 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 20557.29,
            "range": "18263 … 24336 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 411.31,
            "range": "341 … 1240 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 243984.2,
            "range": "218636 … 261238 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 256064.78,
            "range": "234431 … 274969 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 241384.05,
            "range": "220103 … 278703 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 1893.97,
            "range": "1369 … 5320 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 258718.67,
            "range": "235701 … 278781 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 267.87,
            "range": "221 … 1267 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 613.03,
            "range": "490 … 1382 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 652.82,
            "range": "566 … 1277 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 649.27,
            "range": "580 … 914 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 405514.14,
            "range": "370934 … 452558 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 402332.46,
            "range": "351828 … 516646 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 405576.86,
            "range": "353797 … 552845 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 2245.62,
            "range": "1689 … 5252 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 1963.86,
            "range": "1572 … 2317 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 2079.16,
            "range": "1614 … 2569 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 351.34,
            "range": "284 … 921 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 728,
            "range": "584 … 2768 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 426.59,
            "range": "311 … 1447 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 141452.37,
            "range": "119598 … 167817 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 8299.52,
            "range": "5902 … 12721 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 252371.2,
            "range": "239891 … 292662 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 598.85,
            "range": "493 … 1221 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 764.05,
            "range": "630 … 1353 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 553952.37,
            "range": "509626 … 599566 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 47495.42,
            "range": "42873 … 52517 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 411.69,
            "range": "337 … 721 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 489.34,
            "range": "394 … 1191 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 251695.92,
            "range": "223391 … 284478 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 252569.63,
            "range": "218177 … 269765 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 274146.74,
            "range": "239060 … 308542 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 258342.85,
            "range": "229541 … 300708 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 510490.34,
            "range": "474362 … 540464 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 3461.28,
            "range": "1474 … 8191 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3305.38,
            "range": "1627 … 8241 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 3242.14,
            "range": "1547 … 7361 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 247720.85,
            "range": "218914 … 289967 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 354.9,
            "range": "253 … 1174 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 887.38,
            "range": "718 … 1798 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 779.37,
            "range": "676 … 1767 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 761.93,
            "range": "674 … 1108 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 958.18,
            "range": "761 … 2151 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 839.84,
            "range": "725 … 1713 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 835.43,
            "range": "718 … 1203 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 534537.31,
            "range": "488739 … 574677 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 542420.73,
            "range": "489149 … 620468 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 542364.13,
            "range": "503219 … 582905 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 510254.49,
            "range": "466168 … 565706 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 537309.36,
            "range": "484220 … 610406 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 540016.66,
            "range": "485459 … 598911 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 3278.37,
            "range": "1860 … 8284 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 3342.01,
            "range": "1840 … 7677 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 4203.55,
            "range": "1768 … 8428 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4274.19,
            "range": "2873 … 6986 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 6132.38,
            "range": "3809 … 10807 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 5182.58,
            "range": "3666 … 7027 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 454.28,
            "range": "337 … 1331 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 878.2,
            "range": "719 … 2220 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 518.11,
            "range": "391 … 1636 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 917.45,
            "range": "754 … 2909 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 1006505.43,
            "range": "976678 … 1068322 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 130364,
            "range": "99677 … 314217 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 642604.92,
            "range": "632272 … 660951 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 741890.41,
            "range": "724314 … 788708 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 125926.12,
            "range": "96146 … 139635 µs",
            "unit": "µs/iter"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "54100972+oliver-oloughlin@users.noreply.github.com",
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b271b8dcae097e96ef39aa750a2201ef8bf77bdd",
          "message": "Fix timeout id type mismatch (#306)\n\n* fix: use return type of setTimeout for ID type\n\n* chore: update jsdoc",
          "timestamp": "2026-05-23T18:33:43+02:00",
          "tree_id": "545c74c5ad40590ca3e2c89689e9b1ce0a2527dd",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/b271b8dcae097e96ef39aa750a2201ef8bf77bdd"
        },
        "date": 1779554372682,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 103.27,
            "range": "84 … 298 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 22960.37,
            "range": "19753 … 29625 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 5420.83,
            "range": "4802 … 7443 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 48,
            "range": "38 … 151 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 9215.33,
            "range": "7619 … 11934 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 92.91,
            "range": "73 … 165 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 13246.08,
            "range": "10394 … 15647 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 8085.53,
            "range": "7052 … 13502 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 7605.46,
            "range": "6819 … 8641 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1210.7,
            "range": "691 … 1876 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 7729.58,
            "range": "6902 … 8984 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 102.07,
            "range": "83 … 421 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 123.13,
            "range": "100 … 443 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 126.23,
            "range": "111 … 263 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 133.91,
            "range": "116 … 330 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 26297.65,
            "range": "22179 … 30735 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 25640.09,
            "range": "21458 … 31676 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 25586.14,
            "range": "22272 … 31784 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1392.95,
            "range": "801 … 1934 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1430.58,
            "range": "1121 … 1900 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 1566.84,
            "range": "1175 … 2704 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 153.81,
            "range": "125 … 526 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 138.67,
            "range": "118 … 304 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 104.8,
            "range": "82 … 284 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 57.36,
            "range": "48 … 153 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 42.81,
            "range": "36 … 105 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 132.98,
            "range": "115 … 269 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 19813.73,
            "range": "15998 … 23069 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 78243.13,
            "range": "72829 … 84180 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 20.96,
            "range": "17 … 83 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 103.9,
            "range": "97 … 214 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 84327.14,
            "range": "77536 … 101612 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 131.22,
            "range": "106 … 368 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 53684.39,
            "range": "45382 … 67113 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 7918.13,
            "range": "5478 … 9482 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 10322.94,
            "range": "8699 … 11568 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 141.32,
            "range": "114 … 497 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 191.36,
            "range": "163 … 510 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 54523.69,
            "range": "50320 … 64853 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 29341.97,
            "range": "26185 … 34222 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 78.12,
            "range": "67 … 253 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 83.1,
            "range": "70 … 225 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 10491.11,
            "range": "9541 … 11765 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 12247.64,
            "range": "10600 … 17641 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 9248.94,
            "range": "8241 … 10830 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 9418.34,
            "range": "7681 … 13707 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 22408.28,
            "range": "19953 … 25269 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 2015.69,
            "range": "824 … 3179 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 2659.5,
            "range": "1003 … 4064 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2870.87,
            "range": "1011 … 4733 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 9255.58,
            "range": "7376 … 12963 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 124.94,
            "range": "102 … 323 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 170.23,
            "range": "138 … 512 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 150.23,
            "range": "132 … 296 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 156.52,
            "range": "137 … 310 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 173.7,
            "range": "145 … 536 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 156.9,
            "range": "135 … 384 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 160.09,
            "range": "140 … 304 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 50124.5,
            "range": "47543 … 56304 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 62088.42,
            "range": "56691 … 70613 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 63176.11,
            "range": "55922 … 105077 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 48444.59,
            "range": "45785 … 50960 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 57265.94,
            "range": "53110 … 70088 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 63717.96,
            "range": "53118 … 157270 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 2042.52,
            "range": "1011 … 2989 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 2640.67,
            "range": "1005 … 3402 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 2611.45,
            "range": "2139 … 3214 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 2828.28,
            "range": "1203 … 3766 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 3462.43,
            "range": "3228 … 3839 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 3460.08,
            "range": "3173 … 4001 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 177.49,
            "range": "146 … 417 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 171.95,
            "range": "145 … 408 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 189.58,
            "range": "153 … 470 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 177.33,
            "range": "149 … 337 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 187.49,
            "range": "135 … 978 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 57979.46,
            "range": "47652 … 66029 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 238.19,
            "range": "139 … 793 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 135.73,
            "range": "111 … 364 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 17187.17,
            "range": "13998 … 20152 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 263.01,
            "range": "219 … 883 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 163885.1,
            "range": "150405 … 182378 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 159240.42,
            "range": "148315 … 186260 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 161722.02,
            "range": "147308 … 194363 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 2948.1,
            "range": "1123 … 5286 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 169337.92,
            "range": "144422 … 201853 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 197.01,
            "range": "133 … 1056 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 384.98,
            "range": "310 … 1021 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 415.38,
            "range": "355 … 974 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 411.7,
            "range": "364 … 1337 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 260811.41,
            "range": "230349 … 293143 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 254598.66,
            "range": "227652 … 287412 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 271126.43,
            "range": "225320 … 533670 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 3672.84,
            "range": "1655 … 4539 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 4288.52,
            "range": "3513 … 4889 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 4902.7,
            "range": "4124 … 5959 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 245.19,
            "range": "177 … 1192 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 481.88,
            "range": "394 … 1110 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 247.82,
            "range": "178 … 1088 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 120795.12,
            "range": "106766 … 146033 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 7805.79,
            "range": "6656 … 9237 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 161765.08,
            "range": "151750 … 170652 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 414.54,
            "range": "327 … 784 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 503.48,
            "range": "388 … 1061 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 366736.15,
            "range": "332080 … 414714 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 34830.68,
            "range": "27554 … 40122 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 268.5,
            "range": "224 … 772 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 317.6,
            "range": "254 … 777 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 165859.87,
            "range": "155743 … 188106 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 170653.81,
            "range": "149277 … 202419 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 164521.52,
            "range": "148965 … 181800 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 170016.56,
            "range": "153636 … 194227 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 335540.74,
            "range": "307323 … 360448 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 3783.99,
            "range": "1777 … 5932 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3157.04,
            "range": "2343 … 3807 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 3268.72,
            "range": "2292 … 4708 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 164318.81,
            "range": "148767 … 196498 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 241.39,
            "range": "175 … 898 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 585.19,
            "range": "455 … 1253 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 512.14,
            "range": "431 … 990 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 505.24,
            "range": "426 … 861 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 629.84,
            "range": "478 … 1437 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 549.38,
            "range": "460 … 988 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 553.44,
            "range": "452 … 844 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 352371.66,
            "range": "296659 … 495623 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 361798.64,
            "range": "317551 … 469922 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 329560.18,
            "range": "318956 … 369926 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 336122.33,
            "range": "301149 … 408393 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 354802.06,
            "range": "314007 … 411373 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 369992.13,
            "range": "332820 … 438875 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 3218.93,
            "range": "1759 … 4510 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 3190.06,
            "range": "1694 … 4346 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 4699.83,
            "range": "2589 … 9897 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 3150.24,
            "range": "1970 … 3777 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 4628.64,
            "range": "2822 … 9423 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 5979.62,
            "range": "4600 … 10535 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 310.17,
            "range": "222 … 1185 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 582.3,
            "range": "461 … 1173 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 358.59,
            "range": "263 … 949 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 616.05,
            "range": "489 … 1138 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 745876.35,
            "range": "703443 … 811982 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 108351.06,
            "range": "83166 … 209544 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 462207.67,
            "range": "448907 … 481915 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 584368.94,
            "range": "561471 … 631035 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 68900.84,
            "range": "64505 … 71575 µs",
            "unit": "µs/iter"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "54100972+oliver-oloughlin@users.noreply.github.com",
            "name": "Oliver O'Loughlin",
            "username": "oliver-oloughlin"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9207d28d32cff07b5b4a3fa16291dea3aaec42f0",
          "message": "chore: bump version (#307)",
          "timestamp": "2026-05-23T16:44:20Z",
          "tree_id": "c86218560516326eb5e4f7db841f9e008424f45a",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/9207d28d32cff07b5b4a3fa16291dea3aaec42f0"
        },
        "date": 1779555075432,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 190.68,
            "range": "143 … 449 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 37204.58,
            "range": "26738 … 47286 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 6854.15,
            "range": "6126 … 8589 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 84.29,
            "range": "65 … 669 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10864.93,
            "range": "9615 … 14860 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - find",
            "value": 116.5,
            "range": "103 … 408 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 16281.69,
            "range": "14436 … 23171 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 10627.13,
            "range": "9076 … 15684 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 9472.59,
            "range": "8372 … 12672 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1191,
            "range": "820 … 1621 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 9296.1,
            "range": "8578 … 10680 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - set",
            "value": 154.92,
            "range": "115 … 433 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 202.15,
            "range": "172 … 503 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 201.75,
            "range": "176 … 415 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 209.97,
            "range": "186 … 773 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 34519.28,
            "range": "28313 … 44526 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 34290.67,
            "range": "28274 … 44416 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 34990.02,
            "range": "29578 … 46634 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1322.57,
            "range": "916 … 1897 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1415.48,
            "range": "1144 … 2108 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 1457.83,
            "range": "1168 … 1820 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 226.82,
            "range": "193 … 506 µs",
            "unit": "µs/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 214.59,
            "range": "190 … 382 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 157.91,
            "range": "115 … 556 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 99.13,
            "range": "85 … 198 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 73.22,
            "range": "61 … 135 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 191.24,
            "range": "166 … 418 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 25385.38,
            "range": "21118 … 30540 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 109247.57,
            "range": "94650 … 156661 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 28.56,
            "range": "22 … 100 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 140.94,
            "range": "128 … 340 µs",
            "unit": "µs/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 110984.15,
            "range": "99839 … 130410 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 185.7,
            "range": "151 … 460 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 72472.18,
            "range": "60602 … 94539 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 9811.17,
            "range": "7034 … 12041 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 13193.81,
            "range": "11077 … 14153 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 224.28,
            "range": "193 … 619 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 322.4,
            "range": "274 … 721 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 81620.66,
            "range": "72694 … 91311 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 36158,
            "range": "33396 … 39182 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 122.73,
            "range": "105 … 299 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 125.88,
            "range": "111 … 239 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 13144.29,
            "range": "10396 … 17235 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 16772.47,
            "range": "14839 … 24938 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 11624.8,
            "range": "10221 … 15397 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 11125.54,
            "range": "9645 … 15034 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 27496.96,
            "range": "24904 … 34812 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1730.42,
            "range": "887 … 2715 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3321.54,
            "range": "1123 … 5781 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 3377.28,
            "range": "1117 … 5262 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 10985.37,
            "range": "9575 … 12877 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 182.01,
            "range": "152 … 515 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 268.53,
            "range": "231 … 875 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 236.93,
            "range": "201 … 792 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 237.38,
            "range": "209 … 396 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 276.12,
            "range": "239 … 562 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 246.73,
            "range": "213 … 569 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 276.57,
            "range": "220 … 988 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 63324.42,
            "range": "58184 … 71638 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 80026.33,
            "range": "72979 … 111636 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 81649.21,
            "range": "73402 … 105970 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 63864.45,
            "range": "57196 … 69244 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 79088.19,
            "range": "69895 … 103906 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 84575.58,
            "range": "68547 … 208406 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 1966.98,
            "range": "1181 … 3498 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 2462.38,
            "range": "1316 … 3374 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 2372.53,
            "range": "1572 … 3612 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4062.36,
            "range": "1450 … 5923 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 5305.37,
            "range": "4721 … 5920 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 5602.72,
            "range": "4765 … 6517 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 260.15,
            "range": "218 … 627 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 264.8,
            "range": "231 … 503 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 282.69,
            "range": "243 … 683 µs",
            "unit": "µs/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 274.67,
            "range": "241 … 439 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 278.91,
            "range": "220 … 850 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 80511.39,
            "range": "63808 … 101088 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 284.52,
            "range": "167 … 1110 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 215.13,
            "range": "183 … 371 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 21182.42,
            "range": "18081 … 25424 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 458.39,
            "range": "360 … 1208 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 257456.03,
            "range": "232371 … 281726 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 263658.25,
            "range": "240990 … 286741 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 255505.79,
            "range": "237398 … 278946 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 4139.48,
            "range": "1558 … 6169 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 251835.69,
            "range": "223228 … 291365 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 269.08,
            "range": "214 … 842 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 605.14,
            "range": "466 … 1256 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 653.93,
            "range": "573 … 1426 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 642.08,
            "range": "567 … 1098 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 391111.97,
            "range": "341037 … 439297 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 385748.55,
            "range": "342065 … 470426 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 398775.15,
            "range": "359607 … 450201 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 4484.34,
            "range": "2049 … 8216 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 2781.9,
            "range": "1579 … 4745 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 2702.48,
            "range": "1612 … 4935 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 362.31,
            "range": "285 … 5819 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 721.32,
            "range": "597 … 1345 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 366.93,
            "range": "257 … 1150 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 143665.36,
            "range": "119199 … 188747 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 7965.93,
            "range": "6001 … 11162 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 255673.5,
            "range": "234614 … 287053 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 619.35,
            "range": "499 … 1236 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 781.08,
            "range": "630 … 1353 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 530334.95,
            "range": "486907 … 567416 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 42767.94,
            "range": "40106 … 48396 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 411.09,
            "range": "334 … 827 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 484.78,
            "range": "390 … 1105 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 257582.04,
            "range": "227519 … 292010 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 263614.25,
            "range": "234391 … 286451 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 237046.34,
            "range": "219010 … 275313 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 253447.53,
            "range": "231520 … 277592 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 492065.25,
            "range": "446640 … 556062 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 2884.17,
            "range": "1570 … 4870 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3483.65,
            "range": "1605 … 5692 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 3606.86,
            "range": "2611 … 6130 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 257934.14,
            "range": "224900 … 287509 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 363,
            "range": "256 … 1148 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 931.74,
            "range": "718 … 1998 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 800.15,
            "range": "675 … 1276 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 817.45,
            "range": "666 … 2014 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 961.84,
            "range": "764 … 1730 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 851.76,
            "range": "719 … 1470 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 839.25,
            "range": "713 … 1280 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 473964.42,
            "range": "438540 … 509129 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 504791.26,
            "range": "458893 … 577920 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 505205.02,
            "range": "476602 … 592078 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 507046.28,
            "range": "468299 … 537635 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 528406.1,
            "range": "492490 … 597730 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 521076.84,
            "range": "463376 … 613774 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 4676.91,
            "range": "2215 … 8525 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 4746.78,
            "range": "2364 … 7899 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 4998.52,
            "range": "2181 … 8395 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4314.99,
            "range": "2657 … 6959 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 5069.52,
            "range": "2160 … 7206 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 4631.14,
            "range": "2037 … 6545 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 449.13,
            "range": "321 … 1536 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 874.05,
            "range": "719 … 1672 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 521.4,
            "range": "391 … 1786 µs",
            "unit": "µs/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 927.45,
            "range": "755 … 1683 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 1012364.4,
            "range": "970167 … 1102926 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 129887.76,
            "range": "95204 … 242423 µs",
            "unit": "µs/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 635674.59,
            "range": "619521 … 656200 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 743718.08,
            "range": "723381 … 806988 µs",
            "unit": "µs/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 88276.11,
            "range": "77871 … 126643 µs",
            "unit": "µs/iter"
          }
        ]
      }
    ]
  }
}