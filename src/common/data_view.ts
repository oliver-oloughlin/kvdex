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

/**
 * Replacer function for data view.
 * Stores data safely for JSON and V8 parse/serialize.
 *
 * @param dataView
 * @returns A ReplacedDataViewEntry object.
 */
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

/**
 * Reviver function for replaced data view.
 * Reconstructs DataView object from safely stored data.
 *
 * @param entry
 * @returns - A reconstructed DataView.
 */
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
