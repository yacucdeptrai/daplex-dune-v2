import { Directionality } from '@angular/cdk/bidi';
import { CdkStepper } from '@angular/cdk/stepper';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'app-stepper',
    templateUrl: './stepper.component.html',
    styleUrls: ['./stepper.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [{ provide: CdkStepper, useExisting: StepperComponent }],
    imports: [NgClass, NgTemplateOutlet]
})
export class StepperComponent extends CdkStepper implements OnInit {
  @Input() activeClass = 'tw-bg-black tw-text-white';
  @Input() headerStyleClass = 'tw-mb-2';

  constructor(dir: Directionality, ref: ChangeDetectorRef, elementRef: ElementRef<HTMLElement>) {
    super(dir, ref, elementRef);
  }

  ngOnInit(): void {
  }

  selectTab(index: number) {
    if (this.selected && !this.selected.completed && !this.selected.optional && this.linear) return;
    this.selectedIndex = index;
  }

}
