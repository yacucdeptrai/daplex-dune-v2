import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TRANSLOCO_SCOPE } from '@ngneat/transloco';
import { LazyLoadImageModule } from 'ng-lazyload-image';

import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';

import { HomeRoutingModule } from './home-routing.module';



import { HomeComponent } from './pages/home/home.component';
import { MediaListModule } from '../../shared/components/media-list';


import { FeaturedMediaComponent } from './components/featured-media';

@NgModule({
    imports: [
    CommonModule,
    HomeRoutingModule,
    TranslocoModule,
    LazyLoadImageModule,
    MediaListModule,
    ButtonModule,
    BadgeModule,
    HomeComponent,
    FeaturedMediaComponent
],
    providers: [
        {
            provide: TRANSLOCO_SCOPE,
            useValue: ['home', 'media']
        }
    ]
})
export class HomeModule { }
