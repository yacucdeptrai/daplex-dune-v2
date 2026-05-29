export function track_Id<T extends { _id?: unknown }>(_: number, item: T): unknown {
  return item?._id;
}

export function trackId<T extends { id?: unknown }>(_: number, item: T): unknown {
  return item?.id;
}

export function trackTabId<T extends { tabId?: unknown }>(_: number, item: T): unknown {
  return item?.tabId;
}

export function trackLabel<T extends { label?: unknown }>(_: number, item: T): unknown {
  return item?.label;
}

export function trackCreateUrl<T extends { createUrl?: unknown }>(_: number, item: T): unknown {
  return item?.createUrl;
}

export function trackHistoryGroup<T extends { groupByDate?: unknown; historyList?: ArrayLike<unknown> }>(_: number, item: T): unknown {
  return item ? `${String(item.groupByDate)}${item.historyList?.length ?? 0}` : undefined;
}
