import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ImageEditorComponent } from './image-editor.component';
import { mockDynamicDialogConfig, mockDynamicDialogRef } from '../../../../testing/test-helpers';

describe('ImageEditorComponent', () => {
  let component: ImageEditorComponent;
  let fixture: ComponentFixture<ImageEditorComponent>;

  beforeEach(async () => {
    // Constructor eagerly reads config.data, including imageFile.type/.size.
    const imageFile = new File([''], 'test.png', { type: 'image/png' });
    await TestBed.configureTestingModule({
    imports: [ImageEditorComponent],
    providers: [
        { provide: DynamicDialogRef, useValue: mockDynamicDialogRef() },
        {
            provide: DynamicDialogConfig,
            useValue: mockDynamicDialogConfig({
                aspectRatioWidth: 16,
                aspectRatioHeight: 9,
                minWidth: 100,
                minHeight: 100,
                imageFile,
                maxSize: 5242880
            })
        }
    ]
})
      .overrideComponent(ImageEditorComponent, { set: { template: '' } })
      .compileComponents();
    fixture = TestBed.createComponent(ImageEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
