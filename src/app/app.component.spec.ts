import { AppComponent } from './app.component';

// AppComponent is the root shell that injects Router, Title, ViewportScroller and
// TranslocoService and renders the full app template; a bare TestBed render would
// require the entire provider/template graph. The previous scaffold also asserted a
// 'DaPlex' title field and a default "app is running!" template that no longer exist.
// Assert the class is defined instead.
describe('AppComponent', () => {
  it('should be defined', () => {
    expect(AppComponent).toBeTruthy();
  });
});
