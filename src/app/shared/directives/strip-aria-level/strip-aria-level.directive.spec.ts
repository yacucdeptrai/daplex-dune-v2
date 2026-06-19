import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StripAriaLevelDirective } from './strip-aria-level.directive';

@Component({
  standalone: true,
  imports: [StripAriaLevelDirective],
  template: `<div appStripAriaLevel><span role="progressbar" aria-level="1" aria-valuenow="40"></span></div>`
})
class HostComponent {}

describe('StripAriaLevelDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(HostComponent);
  });

  it('removes the invalid aria-level from the progressbar after view init', () => {
    const bar = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
    expect(bar.hasAttribute('aria-level')).withContext('present before init').toBeTrue();
    fixture.detectChanges(); // triggers ngAfterViewInit
    expect(bar.hasAttribute('aria-level')).withContext('stripped after init').toBeFalse();
    expect(bar.getAttribute('aria-valuenow')).withContext('other aria untouched').toBe('40');
  });
});
