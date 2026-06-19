// Live transcode-progress snapshot polled from GET media/:id/progress.
// bigint ids serialize as strings on the wire. Consumed by the W2.3 detail chip,
// the W3.1 activity drawer and the W3.2 dashboard.
export interface MediaProgress {
  mediaId: string;
  episodeId?: string;
  status: 'PROCESSING';
  percent: number;
  eta?: number;
}
