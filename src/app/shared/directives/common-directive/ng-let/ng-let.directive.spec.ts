//https://github.com/nigrosimone/ng-let/blob/main/projects/ng-let/src/lib/ng-let.spec.ts
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { NgLetDirective } from './ng-let.directive';

@Component({
    template: '<div><ng-container *ngLet="value as data">{{data}}</ng-container><ng-container *ngLet="value; let data">{{data}}</ng-container></div>',
    imports: [NgLetDirective]
})
class TestSimpleComponent {
    value = 'test';
}
describe('NgLet: simple', () => {

    let fixture: ComponentFixture<TestSimpleComponent>;
    let debugElement: DebugElement;
    let element: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [NgLetDirective, TestSimpleComponent]
});
        fixture = TestBed.createComponent(TestSimpleComponent);
        debugElement = fixture.debugElement;
        element = debugElement.nativeElement;
    });

    afterEach(() => {
        document.body.removeChild(element);
    });

    it('test', () => {
        fixture.detectChanges();
        expect(element.textContent).toBe('testtest');
    });
});

@Component({
    template: '<div *ngLet="value | async as data">{{data}}</div>',
    imports: [NgLetDirective, AsyncPipe]
})
class TestAsyncComponent {
    value: Observable<string> = of('test');
}
describe('NgLet: async', () => {

    let fixture: ComponentFixture<TestAsyncComponent>;
    let debugElement: DebugElement;
    let element: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [NgLetDirective, TestAsyncComponent]
});
        fixture = TestBed.createComponent(TestAsyncComponent);
        debugElement = fixture.debugElement;
        element = debugElement.nativeElement;
    });

    afterEach(() => {
        document.body.removeChild(element);
    });

    it('test', () => {
        fixture.detectChanges();
        expect(element.textContent).toBe('test');
    });
});

// tslint:disable-next-line: max-line-length
@Component({
    template: '<div *ngLet="value as data"><ng-container *ngLet="nestedValue as nestedData">{{data}}-{{nestedData}}</ng-container></div>',
    imports: [NgLetDirective]
})
class TestNestedComponent {
    value = 'test';
    nestedValue = 'testNested';
}
describe('NgLet: nested', () => {

    let fixture: ComponentFixture<TestNestedComponent>;
    let debugElement: DebugElement;
    let element: HTMLElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [NgLetDirective, TestNestedComponent]
});
        fixture = TestBed.createComponent(TestNestedComponent);
        debugElement = fixture.debugElement;
        element = debugElement.nativeElement;
    });

    afterEach(() => {
        document.body.removeChild(element);
    });

    it('test', () => {
        fixture.detectChanges();
        expect(element.textContent).toBe('test-testNested');
    });
});
