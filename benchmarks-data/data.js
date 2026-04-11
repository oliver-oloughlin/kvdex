window.BENCHMARK_DATA = {
  "lastUpdate": 1775949396295,
  "repoUrl": "https://github.com/oliver-oloughlin/kvdex",
  "entries": {
    "Benchmark": [
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
          "id": "3e266ac93bcd8ade3db808e657a9104a6118581c",
          "message": "feat: update benchmarks & and add benchmark workflow (#289)\n\n* feat: update benchamrks & add benchmark workflow\n\n* fix: use random UUID for username\n\n* fix: possible fix to benchmark format\n\n* fix: add --allow-read flag\n\n* fix: moved --allow-read flag",
          "timestamp": "2026-04-11T17:40:04+02:00",
          "tree_id": "9dd3a6392ea8c44ccb74117311fd81968d4cfb39",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/3e266ac93bcd8ade3db808e657a9104a6118581c"
        },
        "date": 1775922426514,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 189577,
            "range": "148707 … 289761",
            "unit": "ns/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 42783325,
            "range": "33900286 … 54802431",
            "unit": "ns/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 6930698,
            "range": "6140040 … 8241513",
            "unit": "ns/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 80734,
            "range": "67045 … 190085",
            "unit": "ns/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10729070,
            "range": "9755456 … 12284718",
            "unit": "ns/iter"
          },
          {
            "name": "collection - find",
            "value": 117310,
            "range": "104165 … 212096",
            "unit": "ns/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 18251062,
            "range": "14745603 … 24299302",
            "unit": "ns/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 10185978,
            "range": "8774053 … 15275445",
            "unit": "ns/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 9240144,
            "range": "8382986 … 10514583",
            "unit": "ns/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 1103927,
            "range": "837703 … 1578916",
            "unit": "ns/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 9037178,
            "range": "8232904 … 10169818",
            "unit": "ns/iter"
          },
          {
            "name": "collection - set",
            "value": 151449,
            "range": "109524 … 346797",
            "unit": "ns/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 197776,
            "range": "169867 … 439691",
            "unit": "ns/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 204387,
            "range": "179856 … 463655",
            "unit": "ns/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 208359,
            "range": "183813 … 299088",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 40119259,
            "range": "30967504 … 52548481",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 36554838,
            "range": "29829932 … 47949610",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 38134185,
            "range": "31190141 … 49056996",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1353013,
            "range": "928012 … 2221827",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1650237,
            "range": "1052584 … 2486411",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 1888076,
            "range": "1452761 … 3287295",
            "unit": "ns/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 227184,
            "range": "198971 … 606562",
            "unit": "ns/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 217513,
            "range": "190796 … 378817",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 157812,
            "range": "116528 … 437657",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 96759,
            "range": "85590 … 215192",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 74214,
            "range": "65011 … 149810",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 190999,
            "range": "156642 … 371163",
            "unit": "ns/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 26571259,
            "range": "23446366 … 29322866",
            "unit": "ns/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 102207186,
            "range": "95926357 … 114340230",
            "unit": "ns/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 27686,
            "range": "22031 … 92252",
            "unit": "ns/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 141918,
            "range": "127449 … 306201",
            "unit": "ns/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 113977685,
            "range": "107371114 … 123091810",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 190669,
            "range": "160409 … 421858",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 67104832,
            "range": "56586228 … 97599029",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 7852019,
            "range": "6960403 … 8472236",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 12543061,
            "range": "10753464 … 16873979",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 221002,
            "range": "201546 … 466571",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 320149,
            "range": "275865 … 616793",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 80360006,
            "range": "71944558 … 98091402",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 35573204,
            "range": "33486291 … 39654808",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 119595,
            "range": "105147 … 213149",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 130448,
            "range": "114244 … 247532",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 12506915,
            "range": "10600765 … 18148045",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 18589658,
            "range": "14684740 … 24056329",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 10360131,
            "range": "9067791 … 11338216",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 10195888,
            "range": "9199048 … 11607796",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 26625623,
            "range": "23571798 … 33605164",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1502993,
            "range": "875435 … 2258568",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 2294880,
            "range": "1169184 … 2878947",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2365745,
            "range": "1205031 … 3084961",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 10024810,
            "range": "8443289 … 10872465",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 183901,
            "range": "155560 … 417890",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 338121,
            "range": "279061 … 553473",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 317298,
            "range": "275103 … 749258",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 319060,
            "range": "284711 … 448026",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 345841,
            "range": "291644 … 647859",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 324048,
            "range": "281976 … 725694",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 331622,
            "range": "289661 … 540680",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 94191078,
            "range": "84127065 … 133861182",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 132667851,
            "range": "87030193 … 216527659",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 110559560,
            "range": "86390072 … 178141925",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 92496895,
            "range": "82628300 … 133071314",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 124122152,
            "range": "86441058 … 168180807",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 124503740,
            "range": "90863064 … 235252614",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 1920799,
            "range": "1181664 … 2514239",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 2095045,
            "range": "1221951 … 2899553",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 2316050,
            "range": "1828133 … 2787664",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 2679427,
            "range": "1329552 … 3434051",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 3154840,
            "range": "2812389 … 3556177",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 3117689,
            "range": "2343083 … 3880261",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 260851,
            "range": "214170 … 612473",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 333424,
            "range": "269984 … 485907",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 282845,
            "range": "220792 … 669720",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 336808,
            "range": "289852 … 522266",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 268162,
            "range": "221884 … 824569",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 74047109,
            "range": "62605011 … 107698844",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 282857,
            "range": "148016 … 844767",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 213635,
            "range": "188382 … 448517",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 21520452,
            "range": "18541522 … 22750055",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 418063,
            "range": "326800 … 1210710",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 257322073,
            "range": "227038838 … 281523504",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 256459219,
            "range": "220353161 … 284675745",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 254305993,
            "range": "215842249 … 275050190",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 1861153,
            "range": "1316478 … 2813935",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 253669837,
            "range": "223451615 … 288506694",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 269524,
            "range": "221293 … 796617",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 680839,
            "range": "545058 … 1247389",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 713758,
            "range": "608456 … 1449136",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 698807,
            "range": "610971 … 1084134",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 400122112,
            "range": "340310901 … 466653316",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 392633525,
            "range": "342653103 … 468733775",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 397328081,
            "range": "339550517 … 447442197",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 2613764,
            "range": "1878266 … 5520616",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 2426862,
            "range": "1826850 … 2905674",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 2187294,
            "range": "1610998 … 2783015",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 358002,
            "range": "293468 … 822635",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 787020,
            "range": "668207 … 1612040",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 360957,
            "range": "261428 … 867370",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 156539899,
            "range": "118508210 … 201353218",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 8122446,
            "range": "6085709 … 12473302",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 259067040,
            "range": "229940366 … 295490707",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 611923,
            "range": "490094 … 1237991",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 773324,
            "range": "634644 … 1370037",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 575019614,
            "range": "497759155 … 639665726",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 44803987,
            "range": "39916661 … 49700572",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 401872,
            "range": "339063 … 703132",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 471626,
            "range": "388626 … 1003042",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 258252168,
            "range": "234350594 … 286043687",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 251577804,
            "range": "215079142 … 272536877",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 253032301,
            "range": "222508943 … 282236840",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 254690563,
            "range": "221752635 … 296810589",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 515233143,
            "range": "468570439 … 559465261",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 3302445,
            "range": "1382320 … 7400802",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3815741,
            "range": "1795570 … 7983899",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 3671663,
            "range": "1624387 … 8116076",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 259019217,
            "range": "243906359 … 285997868",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 349031,
            "range": "255086 … 1075307",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 1095563,
            "range": "882366 … 2235331",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 942667,
            "range": "822966 … 1392588",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 921537,
            "range": "829388 … 2104838",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 1169733,
            "range": "941007 … 2601234",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 999558,
            "range": "887356 … 1656692",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 999292,
            "range": "870865 … 8730852",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 562735447,
            "range": "505481114 … 620470574",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 539213746,
            "range": "503197418 … 573260182",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 544725011,
            "range": "501049719 … 607621060",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 546307502,
            "range": "506848717 … 608587711",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 541593563,
            "range": "475353382 … 635945732",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 554481139,
            "range": "482686002 … 625009730",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 4095204,
            "range": "2179815 … 8053231",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 4381582,
            "range": "2124681 … 7935001",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 4248979,
            "range": "2080008 … 7903353",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 5570166,
            "range": "3181028 … 8909512",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 5647957,
            "range": "3576427 … 9593919",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 5534296,
            "range": "3686473 … 8356191",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 440349,
            "range": "322593 … 1291135",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 1026404,
            "range": "862032 … 1760392",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 520331,
            "range": "390831 … 1893691",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 1077745,
            "range": "903991 … 2038171",
            "unit": "ns/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 1010726018,
            "range": "967734459 … 1073285025",
            "unit": "ns/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 131822736,
            "range": "97845725 … 285012264",
            "unit": "ns/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 638722575,
            "range": "626830278 … 656534482",
            "unit": "ns/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 740959269,
            "range": "721539118 … 782369496",
            "unit": "ns/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 123012778,
            "range": "106609407 … 146857257",
            "unit": "ns/iter"
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
          "id": "4f486e2e507ac2959a27b8d2d2dad59685ebf016",
          "message": "chore: bump version (#292)",
          "timestamp": "2026-04-11T23:09:05Z",
          "url": "https://github.com/oliver-oloughlin/kvdex/commit/4f486e2e507ac2959a27b8d2d2dad59685ebf016"
        },
        "date": 1775949396056,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "collection - add",
            "value": 182400,
            "range": "140 … 287 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - addMany [1_000]",
            "value": 42003500,
            "range": "33803 … 52695 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - count [1_000]",
            "value": 6472310,
            "range": "5934 … 7966 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - delete [1]",
            "value": 77540,
            "range": "64 … 191 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - deleteMany - [1_000]",
            "value": 10103890,
            "range": "9277 … 11081 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - find",
            "value": 114490,
            "range": "100 … 228 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - findMany [1_000]",
            "value": 17327640,
            "range": "13900 … 25218 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - forEach [1_000]",
            "value": 9634640,
            "range": "8258 … 15259 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - getMany [1_000]",
            "value": 8698870,
            "range": "7900 … 9750 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - getOne [1_000]",
            "value": 997890,
            "range": "680 … 1438 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - map [1_000]",
            "value": 8683120,
            "range": "7829 … 10106 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - set",
            "value": 142660,
            "range": "106 … 309 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - update (replace)",
            "value": 191250,
            "range": "163 … 423 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - update (shallow merge)",
            "value": 196380,
            "range": "175 … 433 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - update (deep merge)",
            "value": 200690,
            "range": "180 … 329 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateMany (replace) [1_000]",
            "value": 29509370,
            "range": "27041 … 40260 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateMany (shallow merge) [1_000]",
            "value": 32170960,
            "range": "27969 … 42618 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateMany (deep merge) [1_000]",
            "value": 34930300,
            "range": "28776 … 44910 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateOne (replace) [1_000]",
            "value": 1150720,
            "range": "904 … 1468 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateOne (shallow merge) [1_000]",
            "value": 1316330,
            "range": "837 … 1533 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - updateOne (deep merge) [1_000]",
            "value": 1489500,
            "range": "1309 … 2060 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - upsert (insert)",
            "value": 219780,
            "range": "194 … 503 µs",
            "unit": "ns/iter"
          },
          {
            "name": "collection - upsert (update)",
            "value": 206110,
            "range": "187 … 283 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (add + commit)",
            "value": 149740,
            "range": "121 … 459 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (set + delete + commit)",
            "value": 93770,
            "range": "82 … 200 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (check + set + commit)",
            "value": 70650,
            "range": "61 … 119 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - atomic (add multi-collection)",
            "value": 185540,
            "range": "163 … 420 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - countAll [4_000]",
            "value": 22456230,
            "range": "19882 … 27375 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - deleteAll [4_000]",
            "value": 103583410,
            "range": "96810 … 113959 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - kvdex (10 collections)",
            "value": 26610,
            "range": "21 … 114 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - kvdex (100 collections)",
            "value": 135050,
            "range": "123 … 286 µs",
            "unit": "ns/iter"
          },
          {
            "name": "db - wipe [4_000]",
            "value": 110149840,
            "range": "103721 … 117717 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - add",
            "value": 178590,
            "range": "154 … 415 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - addMany [1_000]",
            "value": 62498530,
            "range": "56442 … 87277 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - count [1_000]",
            "value": 6703440,
            "range": "6394 … 7441 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - countBySecondaryIndex [1_000]",
            "value": 11188760,
            "range": "9950 … 12090 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - delete [1]",
            "value": 212440,
            "range": "184 … 424 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - deleteByPrimaryIndex",
            "value": 306370,
            "range": "264 … 589 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 75423610,
            "range": "67101 … 97597 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - deleteMany [1_000]",
            "value": 34019610,
            "range": "32240 … 36500 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - find",
            "value": 115660,
            "range": "101 … 221 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - findByPrimaryIndex",
            "value": 127120,
            "range": "108 … 248 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - findBySecondaryIndex [1_000]",
            "value": 11827410,
            "range": "10064 … 18165 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - findMany [1_000]",
            "value": 18848150,
            "range": "14298 … 27956 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - forEach [1_000]",
            "value": 9580220,
            "range": "8541 … 10611 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getMany [1_000]",
            "value": 9511780,
            "range": "8583 … 10424 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 23376890,
            "range": "22237 … 24466 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getOne [1_000]",
            "value": 1099270,
            "range": "801 … 1395 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 1598270,
            "range": "964 … 2035 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 1633990,
            "range": "899 … 2051 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - map [1_000]",
            "value": 9491280,
            "range": "8639 … 10773 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - set",
            "value": 176900,
            "range": "140 … 421 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - update (replace)",
            "value": 325650,
            "range": "281 … 728 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - update (shallow merge)",
            "value": 304540,
            "range": "265 … 685 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - update (deep merge)",
            "value": 318300,
            "range": "275 … 572 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (replace)",
            "value": 337920,
            "range": "286 … 674 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 312500,
            "range": "268 … 698 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 321780,
            "range": "281 … 496 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 91115200,
            "range": "77650 … 126921 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 111938210,
            "range": "82784 … 159602 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 105272170,
            "range": "87949 … 158186 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateMany (replace) [1_000]",
            "value": 96234800,
            "range": "76621 … 132710 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 99995310,
            "range": "82187 … 152881 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateMany (deep merge) [1_000]",
            "value": 106382520,
            "range": "84382 … 181669 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOne (replace) [1_000]",
            "value": 1331390,
            "range": "1071 … 1660 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 1398260,
            "range": "1093 … 1576 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOne (deep merge) [1_000]",
            "value": 1450240,
            "range": "1362 … 1570 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 2014290,
            "range": "1231 … 2392 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 2162590,
            "range": "2068 … 2278 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 2197070,
            "range": "2000 … 2352 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsert (insert)",
            "value": 249840,
            "range": "218 … 595 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsert (update)",
            "value": 316760,
            "range": "285 … 503 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 265850,
            "range": "221 … 646 µs",
            "unit": "ns/iter"
          },
          {
            "name": "indexable_collection - upsertByPrimaryIndex (update)",
            "value": 327020,
            "range": "284 … 597 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - add",
            "value": 264760,
            "range": "217 … 1263 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - addMany [1_000]",
            "value": 73912600,
            "range": "60016 … 100109 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - count [1_000]",
            "value": 223120,
            "range": "125 … 597 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - delete [1]",
            "value": 204570,
            "range": "176 … 423 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - deleteMany [1_000]",
            "value": 19455810,
            "range": "17146 … 21680 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - find",
            "value": 397990,
            "range": "333 … 1110 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - findMany [1_000]",
            "value": 243587600,
            "range": "216579 … 270898 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - forEach [1_000]",
            "value": 254822560,
            "range": "236454 … 288202 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - getMany [1_000]",
            "value": 254596130,
            "range": "227090 … 286316 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - getOne [1_000]",
            "value": 1677450,
            "range": "1252 … 3872 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - map [1_000]",
            "value": 241622330,
            "range": "222462 … 262250 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - set",
            "value": 261010,
            "range": "216 … 1287 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - update (replace)",
            "value": 652480,
            "range": "530 … 1576 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - update (shallow merge)",
            "value": 680910,
            "range": "606 … 1686 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - update (deep merge)",
            "value": 676590,
            "range": "605 … 1942 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateMany (replace) [1_000]",
            "value": 370040580,
            "range": "343966 … 397707 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateMany (shallow merge) [1_000]",
            "value": 365475930,
            "range": "328657 … 425367 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateMany (deep merge) [1_000]",
            "value": 366343260,
            "range": "328444 … 426218 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateOne (replace) [1_000]",
            "value": 2145390,
            "range": "1655 … 4505 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateOne (shallow merge) [1_000]",
            "value": 1914670,
            "range": "1556 … 2576 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - updateOne (deep merge) [1_000]",
            "value": 1992010,
            "range": "1638 … 2317 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - upsert (insert)",
            "value": 355210,
            "range": "288 … 933 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_collection - upsert (update)",
            "value": 930030,
            "range": "795 … 2241 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - add",
            "value": 362700,
            "range": "249 … 1316 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - addMany [1_000]",
            "value": 147294780,
            "range": "115043 … 171594 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - count [1_000]",
            "value": 7373780,
            "range": "5745 … 11322 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - countBySecondaryIndex [1_000]",
            "value": 249130350,
            "range": "230211 … 285093 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - delete [1]",
            "value": 581350,
            "range": "485 … 1201 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteByPrimaryIndex",
            "value": 730300,
            "range": "585 … 1290 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteBySecondaryIndex [1_000]",
            "value": 550615700,
            "range": "483232 … 608703 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - deleteMany [1_000]",
            "value": 43967850,
            "range": "38657 … 49813 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - find",
            "value": 383310,
            "range": "322 … 704 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - findByPrimaryIndex",
            "value": 454230,
            "range": "373 … 1035 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - findBySecondaryIndex [1_000]",
            "value": 250453670,
            "range": "227366 … 288916 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - findMany [1_000]",
            "value": 236753460,
            "range": "218091 … 261607 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - forEach [1_000]",
            "value": 256521350,
            "range": "232083 … 279754 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getMany [1_000]",
            "value": 250576160,
            "range": "223123 … 284119 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getManyBySecondaryOrder [2_000]",
            "value": 486249290,
            "range": "457959 … 527697 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getOne [1_000]",
            "value": 2398650,
            "range": "1337 … 7120 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryIndex [1_000]",
            "value": 3394110,
            "range": "1455 … 7262 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - getOneBySecondaryOrder [2_000]",
            "value": 2832940,
            "range": "1388 … 6467 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - map [1_000]",
            "value": 241269260,
            "range": "220251 … 276834 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - set",
            "value": 337220,
            "range": "250 … 1062 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - update (replace)",
            "value": 1041440,
            "range": "842 … 2127 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - update (shallow merge)",
            "value": 889570,
            "range": "776 … 2121 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - update (deep merge)",
            "value": 891650,
            "range": "782 … 7724 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (replace)",
            "value": 1086000,
            "range": "884 … 2193 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (shallow merge)",
            "value": 929750,
            "range": "814 … 1280 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateByPrimaryIndex (deep merge)",
            "value": 903700,
            "range": "807 … 1294 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (replace) [1_000]",
            "value": 519754480,
            "range": "481049 … 568354 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (shallow merge) [1_000]",
            "value": 513449120,
            "range": "465534 … 565180 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateBySecondaryIndex (deep merge) [1_000]",
            "value": 529354939.99999994,
            "range": "474327 … 570165 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (replace) [1_000]",
            "value": 525168540.00000006,
            "range": "487536 … 583112 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (shallow merge) [1_000]",
            "value": 527042230,
            "range": "482643 … 571457 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateMany (deep merge) [1_000]",
            "value": 512373010,
            "range": "461513 … 578065 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (replace) [1_000]",
            "value": 3095960,
            "range": "2044 … 6982 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (shallow merge) [1_000]",
            "value": 3837860,
            "range": "1931 … 7278 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOne (deep merge) [1_000]",
            "value": 3773080,
            "range": "1858 … 7201 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (replace) [1_000]",
            "value": 4051780,
            "range": "2215 … 8480 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (shallow merge) [1_000]",
            "value": 3939610,
            "range": "2021 … 7829 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - updateOneBySecondaryIndex (deep merge) [1_000]",
            "value": 3910870,
            "range": "2063 … 7377 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (insert)",
            "value": 426980,
            "range": "319 … 1266 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsert (update)",
            "value": 957220,
            "range": "819 … 1685 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (insert)",
            "value": 494060,
            "range": "373 … 2043 µs",
            "unit": "ns/iter"
          },
          {
            "name": "serialized_indexable_collection - upsertByPrimaryIndex (update)",
            "value": 1017310,
            "range": "863 … 2017 µs",
            "unit": "ns/iter"
          },
          {
            "name": "utils - jsonDeserialize (58.677141189575195 MB)",
            "value": 1002909390,
            "range": "965321 … 1074184 µs",
            "unit": "ns/iter"
          },
          {
            "name": "utils - v8Deserialize - (57.15713882446289 MS)",
            "value": 127513740,
            "range": "95438 … 285257 µs",
            "unit": "ns/iter"
          },
          {
            "name": "encoder - brotli_compress",
            "value": 633833420,
            "range": "620666 … 647686 µs",
            "unit": "ns/iter"
          },
          {
            "name": "utils - jsonSerialize",
            "value": 728014060,
            "range": "705206 … 830327 µs",
            "unit": "ns/iter"
          },
          {
            "name": "utils - v8Serialize",
            "value": 116137950,
            "range": "83789 … 133636 µs",
            "unit": "ns/iter"
          }
        ]
      }
    ]
  }
}