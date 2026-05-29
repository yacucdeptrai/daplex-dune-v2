// trackBy helpers. The item is typed `unknown` (not a constrained generic) so these
// stay assignable to Angular's TrackByFunction<T> for any list item type, then narrowed
// via a cast to read the identity property.
export function track_Id(_: number, item: unknown): unknown {
  return (item as { _id?: unknown } | null)?._id;
}

export function trackId(_: number, item: unknown): unknown {
  return (item as { id?: unknown } | null)?.id;
}

export function trackTabId(_: number, item: unknown): unknown {
  return (item as { tabId?: unknown } | null)?.tabId;
}

export function trackLabel(_: number, item: unknown): unknown {
  return (item as { label?: unknown } | null)?.label;
}

export function trackCreateUrl(_: number, item: unknown): unknown {
  return (item as { createUrl?: unknown } | null)?.createUrl;
}

export function trackHistoryGroup(_: number, item: unknown): unknown {
  const group = item as { groupByDate?: unknown; historyList?: ArrayLike<unknown> } | null;
  return group ? `${String(group.groupByDate)}${group.historyList?.length ?? 0}` : undefined;
}
