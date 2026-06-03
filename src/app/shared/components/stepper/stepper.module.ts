import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkStepperModule } from '@angular/cdk/stepper';

import { StepperComponent } from './stepper.component';

@NgModule({
    imports: [
        CommonModule,
        CdkStepperModule,
        StepperComponent
    ],
    exports: [
        StepperComponent,
        CdkStepperModule
    ]
})
export class StepperModule { }
