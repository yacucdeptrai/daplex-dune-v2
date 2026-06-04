import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HomeLayoutComponent } from './home-layout.component';
import { HomeHeaderModule } from '../../components/home-header';


@NgModule({
    imports: [
    CommonModule,
    RouterModule,
    HomeHeaderModule,
    HomeLayoutComponent
],
    exports: [HomeLayoutComponent]
})
export class HomeLayoutModule { }
