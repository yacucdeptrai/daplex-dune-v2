import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { MediaMetaService } from './media-meta.service';
import { MediaDetails } from '../models';
import { SITE_NAME, SITE_THEME_COLOR } from '../../../environments/config';

function media(partial: Partial<MediaDetails>): MediaDetails {
  return partial as MediaDetails;
}

describe('MediaMetaService', () => {
  let service: MediaMetaService;
  let title: jasmine.SpyObj<Title>;
  let meta: jasmine.SpyObj<Meta>;

  const updateTags = (): Array<{ name?: string; property?: string; content?: string }> =>
    meta.updateTag.calls.allArgs().map(args => args[0]);
  const hasProperty = (property: string): boolean => updateTags().some(tag => tag.property === property);
  const hasName = (name: string): boolean => updateTags().some(tag => tag.name === name);

  beforeEach(() => {
    title = jasmine.createSpyObj<Title>('Title', ['setTitle']);
    meta = jasmine.createSpyObj<Meta>('Meta', ['updateTag', 'removeTag']);
    TestBed.configureTestingModule({
      providers: [
        MediaMetaService,
        { provide: Title, useValue: title },
        { provide: Meta, useValue: meta }
      ]
    });
    service = TestBed.inject(MediaMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setMediaMeta sets description + og tags and the og:image block when a poster is present', () => {
    service.setMediaMeta(media({ title: 'Foo', overview: 'Bar', posterColor: 0xffffff, posterUrl: 'http://x/p.jpg' }));

    expect(meta.updateTag).toHaveBeenCalledWith({ name: 'description', content: 'Bar' });
    expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:site_name', content: SITE_NAME });
    expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:title', content: 'Foo' });
    expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image', content: 'http://x/p.jpg' });
    expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image:width', content: '500' });
    expect(meta.updateTag).toHaveBeenCalledWith({ property: 'og:image:alt', content: 'Foo' });
    expect(hasName('theme-color')).toBeTrue();
  });

  it('setMediaMeta omits og:image tags without a poster and theme-color without a poster color', () => {
    service.setMediaMeta(media({ title: 'Foo', overview: 'Bar' }));

    expect(hasProperty('og:image')).toBeFalse();
    expect(hasName('theme-color')).toBeFalse();
  });

  it('resetMediaMeta restores the default title + theme color and removes the 11 media tags', () => {
    service.resetMediaMeta();

    expect(title.setTitle).toHaveBeenCalledWith(SITE_NAME);
    expect(meta.removeTag).toHaveBeenCalledTimes(11);
    expect(meta.removeTag).toHaveBeenCalledWith('name="description"');
    expect(meta.removeTag).toHaveBeenCalledWith('property="og:image:alt"');
    expect(meta.updateTag).toHaveBeenCalledWith({ name: 'theme-color', content: SITE_THEME_COLOR });
  });
});
