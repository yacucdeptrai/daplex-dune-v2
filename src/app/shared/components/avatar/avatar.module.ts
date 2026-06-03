import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AvatarComponent } from './avatar.component';
import { StringPipeModule } from '../../pipes/string-pipe';

@NgModule({
    imports: [
        CommonModule,
        StringPipeModule,
        AvatarComponent
    ],
    exports: [AvatarComponent]
})
export class AvatarModule { }
