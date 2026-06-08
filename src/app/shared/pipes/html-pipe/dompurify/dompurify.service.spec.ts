import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { DompurifyService } from './dompurify.service';

describe('DompurifyService', () => {
  let service: DompurifyService;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DompurifyService] });
    service = TestBed.inject(DompurifyService);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sanitizes HTML through DOMPurify and returns trusted markup', () => {
    // Regression guard for the dompurify default-import fix:
    // a missing/undefined DOMPurify binding would throw on this call.
    const result = service.sanitize('<b>safe</b><script>alert(1)</script>');
    const html = sanitizer.sanitize(SecurityContext.HTML, result) ?? '';

    expect(html).toContain('safe');
    expect(html).not.toContain('<script');
  });
});
