import { mapValue } from "./map_value.ts";
import { TypeKey } from "./type_key.ts";

type ReplacedDataView = {
  data: Array<number>;
  byteOffset: number;
  byteLength: number;
};

type ReplacedDataViewEntry = {
  [TypeKey.DataView]: ReplacedDataView;
};

export function replaceDataView(dataView: DataView): ReplacedDataViewEntry {
  const { buffer, byteOffset, byteLength } = dataView;

  return {
    [TypeKey.DataView]: {
      data: Array.from(new Uint8Array(buffer)),
      byteOffset,
      byteLength,
    },
  };
}

export function reviveDataView(
  entry: unknown,
): DataView {
  const { data, byteOffset, byteLength } = mapValue<ReplacedDataView>(
    TypeKey.DataView,
    entry,
  );

  const uint8Array = Uint8Array.from(data);

  return new DataView(uint8Array.buffer, byteOffset, byteLength);
}
