export const distinct = <TItem>(
  items: Array<TItem>,
  mapper?: (item: TItem) => void) => {
  if (!mapper) mapper = it => it
  const distinctKeys = new Set(items.map(mapper))
  const distinctItems = Array.from(distinctKeys).reduce((arr, curr) => {
    const distinctItem = items.find(it => mapper!(it) === curr) as TItem
    arr.push(distinctItem)
    return arr
  }, new Array<TItem>())
  return distinctItems
}
