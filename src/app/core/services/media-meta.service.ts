import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { MediaDetails } from '../models';
import { toHexColor } from '../utils';
import { SITE_NAME, SITE_THEME_COLOR } from '../../../environments/config';

/**
 * Centralizes the document title + Open Graph / description / theme-color meta-tag
 * handling for a media item, shared between the details and watch pages. Both pages
 * previously inlined byte-identical apply/reset blocks.
 */
@Injectable({ providedIn: 'root' })
export class MediaMetaService {
  constructor(private readonly title: Title, private readonly meta: Meta) {}

  /** Applies the description, Open Graph and theme-color meta tags for a media item. */
  setMediaMeta(media: MediaDetails): void {
    this.meta.updateTag({ name: 'description', content: media.overview });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:title', content: media.title });
    this.meta.updateTag({ property: 'og:description', content: media.overview });
    media.posterColor && this.meta.updateTag({ name: 'theme-color', content: toHexColor(media.posterColor) });
    if (media.posterUrl) {
      this.meta.updateTag({ property: 'og:image', content: media.posterUrl });
      this.meta.updateTag({ property: 'og:image:url', content: media.posterUrl });
      this.meta.updateTag({ property: 'og:image:secure_url', content: media.posterUrl });
      this.meta.updateTag({ property: 'og:image:width', content: '500' });
      this.meta.updateTag({ property: 'og:image:height', content: '750' });
      this.meta.updateTag({ property: 'og:image:type', content: 'image/jpeg' });
      this.meta.updateTag({ property: 'og:image:alt', content: media.title });
    }
  }

  /** Restores the default title + theme color and removes the media meta tags. */
  resetMediaMeta(): void {
    this.title.setTitle(SITE_NAME);
    this.meta.removeTag('name="description"');
    this.meta.removeTag('property="og:site_name"');
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:image:url"');
    this.meta.removeTag('property="og:image:secure_url"');
    this.meta.removeTag('property="og:image:width"');
    this.meta.removeTag('property="og:image:height"');
    this.meta.removeTag('property="og:image:type"');
    this.meta.removeTag('property="og:image:alt"');
    this.meta.updateTag({ name: 'theme-color', content: SITE_THEME_COLOR });
  }
}
