import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, forwardRef, Input, Signal, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SharedModule } from 'primeng/api';
import { AutoComplete, AutoCompleteStyle } from 'primeng/autocomplete';
import { AutoFocus } from 'primeng/autofocus';
import { PARENT_INSTANCE } from 'primeng/basecomponent';
import { BindModule } from 'primeng/bind';
import { ChevronDownIcon, SpinnerIcon, TimesIcon } from 'primeng/icons';
import { InputText } from 'primeng/inputtext';
import { Overlay } from 'primeng/overlay';
import { Ripple } from 'primeng/ripple';
import { Scroller } from 'primeng/scroller';

export const ALT_AUTOCOMPLETE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => AltAutoComplete),
  multi: true
};

/**
 * AutoComplete variant that collapses multiple-mode selections into a single
 * "N items selected" summary token instead of one chip per item, and restores
 * the hideOnSelect keep-panel-open option. Template mirrors the v21 base with
 * only the multiple container and the option-click handler changed.
 * Inherits hostDirectives from the base (omitted here to avoid NG0309).
 */
@Component({
  selector: 'p-altAutoComplete',
  standalone: true,
  imports: [CommonModule, Overlay, InputText, Ripple, Scroller, AutoFocus, SpinnerIcon, ChevronDownIcon, SharedModule, TimesIcon, BindModule],
  template: `
        <input
            *ngIf="!multiple"
            #focusInput
            [pAutoFocus]="autofocus ?? false"
            pInputText
            [pt]="ptm('pcInputText')"
            [class]="cn(cx('pcInputText'), inputStyleClass)"
            [ngStyle]="inputStyle"
            [attr.type]="type"
            [attr.value]="inputValue()"
            [variant]="$variant() ?? undefined"
            [invalid]="invalid()"
            [attr.id]="inputId"
            [attr.autocomplete]="autocomplete"
            aria-autocomplete="list"
            role="combobox"
            [attr.placeholder]="placeholder"
            [attr.name]="name()"
            [attr.minlength]="minlength()"
            [pSize]="size()"
            [attr.min]="min()"
            [attr.max]="max()"
            [attr.pattern]="pattern()"
            [attr.size]="inputSize()"
            [attr.maxlength]="maxlength()"
            [attr.tabindex]="!$disabled() ? tabindex : -1"
            [attr.required]="required() ? '' : undefined"
            [attr.readonly]="readonly ? '' : undefined"
            [attr.disabled]="$disabled() ? '' : undefined"
            [attr.aria-label]="ariaLabel"
            [attr.aria-labelledby]="ariaLabelledBy"
            [attr.aria-required]="required()"
            [attr.aria-expanded]="overlayVisible ?? false"
            [attr.aria-controls]="overlayVisible ? id + '_list' : null"
            [attr.aria-activedescendant]="focused ? focusedOptionId : undefined"
            (input)="onInput($event)"
            (keydown)="onKeyDown($event)"
            (change)="onInputChange($event)"
            (focus)="onInputFocus($event)"
            (blur)="onInputBlur($event)"
            (paste)="onInputPaste($event)"
            (keyup)="onInputKeyUp($event)"
            [fluid]="hasFluid"
            [pInputTextUnstyled]="unstyled()"
        />
        <ng-container *ngIf="$filled() && !$disabled() && showClear && !loading">
            <svg data-p-icon="times" *ngIf="!clearIconTemplate && !_clearIconTemplate" [pBind]="ptm('clearIcon')" [class]="cx('clearIcon')" (click)="clear()" [attr.aria-hidden]="true" />
            <span *ngIf="clearIconTemplate || _clearIconTemplate" [pBind]="ptm('clearIcon')" [class]="cx('clearIcon')" (click)="clear()" [attr.aria-hidden]="true">
                <ng-template *ngTemplateOutlet="clearIconTemplate || _clearIconTemplate"></ng-template>
            </span>
        </ng-container>

        <ul
            *ngIf="multiple"
            #multiContainer
            [pBind]="ptm('inputMultiple')"
            [class]="cx('inputMultiple')"
            [attr.data-p]="inputMultipleDataP"
            [tabindex]="-1"
            role="listbox"
            [attr.aria-orientation]="'horizontal'"
            [attr.aria-activedescendant]="focused ? focusedMultipleOptionId : undefined"
            (focus)="onMultipleContainerFocus($event)"
            (blur)="onMultipleContainerBlur($event)"
            (keydown)="onMultipleContainerKeyDown($event)"
        >
            <li
                #token
                *ngIf="!focused && modelLength()"
                class="p-autocomplete-token"
                role="option"
                [attr.aria-label]="modelLength() + ' items'"
                [attr.aria-setsize]="modelLength()"
                [attr.aria-posinset]="0"
                [attr.aria-selected]="true"
            >
                <ng-container *ngTemplateOutlet="selectedItemTemplate || _selectedItemTemplate; context: { $implicit: modelValue() }"></ng-container>
                <span *ngIf="!selectedItemTemplate && !_selectedItemTemplate" class="p-autocomplete-token-label">+{{ modelLength() }}</span>
            </li>
            <li [pBind]="ptm('inputChip')" [class]="cx('inputChip')" role="option">
                <input
                    #focusInput
                    #multiIn
                    [pAutoFocus]="autofocus ?? false"
                    [pBind]="ptm('input')"
                    [class]="cx('pcInputText')"
                    [ngStyle]="inputStyle"
                    [attr.type]="type"
                    [attr.id]="inputId"
                    [attr.autocomplete]="autocomplete"
                    [attr.name]="name()"
                    [attr.minlength]="minlength()"
                    [attr.maxlength]="maxlength()"
                    [attr.size]="size()"
                    [attr.min]="min()"
                    [attr.max]="max()"
                    [attr.pattern]="pattern()"
                    role="combobox"
                    [attr.placeholder]="!$filled() ? placeholder : null"
                    aria-autocomplete="list"
                    [attr.tabindex]="!$disabled() ? tabindex : -1"
                    [attr.required]="required() ? '' : undefined"
                    [attr.readonly]="readonly ? '' : undefined"
                    [attr.disabled]="$disabled() ? '' : undefined"
                    [attr.aria-label]="ariaLabel"
                    [attr.aria-labelledby]="ariaLabelledBy"
                    [attr.aria-required]="required()"
                    [attr.aria-expanded]="overlayVisible ?? false"
                    [attr.aria-controls]="overlayVisible ? id + '_list' : null"
                    [attr.aria-activedescendant]="focused ? focusedOptionId : undefined"
                    (input)="onInput($event)"
                    (keydown)="onKeyDown($event)"
                    (change)="onInputChange($event)"
                    (focus)="onInputFocus($event)"
                    (blur)="onInputBlur($event)"
                    (paste)="onInputPaste($event)"
                    (keyup)="onInputKeyUp($event)"
                />
            </li>
        </ul>
        <ng-container *ngIf="loading">
            <svg data-p-icon="spinner" *ngIf="!loadingIconTemplate && !_loadingIconTemplate" [pBind]="ptm('loader')" [class]="cx('loader')" [spin]="true" [attr.aria-hidden]="true" />
            <span *ngIf="loadingIconTemplate || _loadingIconTemplate" [pBind]="ptm('loader')" [class]="cx('loader')" [attr.aria-hidden]="true">
                <ng-template *ngTemplateOutlet="loadingIconTemplate || _loadingIconTemplate"></ng-template>
            </span>
        </ng-container>
        <button #ddBtn type="button" [pBind]="ptm('dropdown')" [attr.aria-label]="dropdownAriaLabel" [class]="cx('dropdown')" [disabled]="$disabled()" pRipple (click)="handleDropdownClick($event)" *ngIf="dropdown" [attr.tabindex]="tabindex">
            <span *ngIf="dropdownIcon" [ngClass]="dropdownIcon" [attr.aria-hidden]="true"></span>
            <ng-container *ngIf="!dropdownIcon">
                <svg data-p-icon="chevron-down" [pBind]="ptm('dropdown')" *ngIf="!dropdownIconTemplate && !_dropdownIconTemplate" />
                <ng-template *ngTemplateOutlet="dropdownIconTemplate || _dropdownIconTemplate"></ng-template>
            </ng-container>
        </button>
        <p-overlay
            #overlay
            [hostAttrSelector]="$attrSelector"
            [visible]="overlayVisible ?? false" (visibleChange)="overlayVisible = $event"
            [options]="overlayOptions"
            [target]="'@parent'"
            [appendTo]="$appendTo()"
            [unstyled]="unstyled()"
            [pt]="ptm('pcOverlay')"
            [motionOptions]="motionOptions()"
            (onBeforeEnter)="onOverlayBeforeEnter()"
            (onHide)="hide()"
            [attr.data-p]="overlayDataP"
        >
            <ng-template #content>
                <div [pBind]="ptm('overlay')" [class]="cn(cx('overlay'), panelStyleClass)" [ngStyle]="panelStyle">
                    <ng-container *ngTemplateOutlet="headerTemplate || _headerTemplate"></ng-container>
                    <div [pBind]="ptm('listContainer')" [class]="cx('listContainer')" [style.max-height]="virtualScroll ? 'auto' : scrollHeight" [tabindex]="-1">
                        <p-scroller
                            *ngIf="virtualScroll"
                            #scroller
                            [tabindex]="-1"
                            [pt]="ptm('virtualScroller')"
                            [items]="visibleOptions()"
                            [style]="{ height: scrollHeight }"
                            [itemSize]="virtualScrollItemSize ?? 0"
                            [autoSize]="true"
                            [lazy]="lazy"
                            (onLazyLoad)="onLazyLoad.emit($event)"
                            [options]="virtualScrollOptions"
                        >
                            <ng-template #content let-items let-scrollerOptions="options">
                                <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: items, options: scrollerOptions }"></ng-container>
                            </ng-template>
                            <ng-container *ngIf="loaderTemplate || _loaderTemplate">
                                <ng-template #loader let-scrollerOptions="options">
                                    <ng-container *ngTemplateOutlet="loaderTemplate || _loaderTemplate; context: { options: scrollerOptions }"></ng-container>
                                </ng-template>
                            </ng-container>
                        </p-scroller>
                        <ng-container *ngIf="!virtualScroll">
                            <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: visibleOptions(), options: {} }"></ng-container>
                        </ng-container>
                    </div>

                    <ng-template #buildInItems let-items let-scrollerOptions="options">
                        <ul #items [pBind]="ptm('list')" [class]="cn(cx('list'), scrollerOptions.contentStyleClass)" [style]="scrollerOptions.contentStyle" role="listbox" [attr.id]="id + '_list'" [attr.aria-label]="listLabel">
                            <ng-template ngFor let-option [ngForOf]="items" let-i="index">
                                <ng-container *ngIf="isOptionGroup(option)">
                                    <li [pBind]="ptm('optionGroup')" [attr.id]="id + '_' + getOptionIndex(i, scrollerOptions)" [class]="cx('optionGroup')" [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }" role="option">
                                        <span *ngIf="!groupTemplate">{{ getOptionGroupLabel(option.optionGroup) }}</span>
                                        <ng-container *ngTemplateOutlet="groupTemplate; context: { $implicit: option.optionGroup }"></ng-container>
                                    </li>
                                </ng-container>
                                <ng-container *ngIf="!isOptionGroup(option)">
                                    <li
                                        pRipple
                                        [pBind]="getPTOptions(option, scrollerOptions, i, 'option')"
                                        [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }"
                                        [class]="cx('option', { option, i, scrollerOptions })"
                                        [attr.id]="id + '_' + getOptionIndex(i, scrollerOptions)"
                                        role="option"
                                        [attr.aria-label]="getOptionLabel(option)"
                                        [attr.aria-selected]="isSelected(option)"
                                        [attr.data-p-selected]="isSelected(option)"
                                        [attr.aria-disabled]="isOptionDisabled(option)"
                                        [attr.data-p-focused]="focusedOptionIndex() === getOptionIndex(i, scrollerOptions)"
                                        [attr.aria-setsize]="ariaSetSize"
                                        [attr.aria-posinset]="getAriaPosInset(getOptionIndex(i, scrollerOptions))"
                                        (click)="onOptionSelect($event, option, hideOnSelect)"
                                        (mouseenter)="onOptionMouseEnter($event, getOptionIndex(i, scrollerOptions))"
                                    >
                                        <span *ngIf="!itemTemplate && !_itemTemplate">{{ getOptionLabel(option) }}</span>
                                        <ng-container
                                            *ngTemplateOutlet="
                                                itemTemplate || _itemTemplate;
                                                context: {
                                                    $implicit: option,
                                                    index: scrollerOptions.getOptions ? scrollerOptions.getOptions(i) : i
                                                }
                                            "
                                        ></ng-container>
                                    </li>
                                </ng-container>
                            </ng-template>
                            <li *ngIf="!items || (items && items.length === 0 && showEmptyMessage)" [pBind]="ptm('emptyMessage')" [class]="cx('emptyMessage')" [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }" role="option">
                                <ng-container *ngIf="!emptyTemplate && !_emptyTemplate; else empty">
                                    {{ searchResultMessageText }}
                                </ng-container>
                                <ng-template #empty><ng-container *ngTemplateOutlet="emptyTemplate || _emptyTemplate"></ng-container></ng-template>
                            </li>
                        </ul>
                    </ng-template>
                    <ng-container *ngTemplateOutlet="footerTemplate || _footerTemplate"></ng-container>
                </div>
                <span role="status" aria-live="polite" class="p-hidden-accessible">
                    {{ selectedMessageText }}
                </span>
            </ng-template>
        </p-overlay>
    `,
  providers: [ALT_AUTOCOMPLETE_VALUE_ACCESSOR, AutoCompleteStyle, { provide: PARENT_INSTANCE, useExisting: AltAutoComplete }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': "cn(cx('root'), styleClass)",
    '[style]': "sx('root')",
    '[attr.data-p]': 'containerDataP'
  }
})
export class AltAutoComplete extends AutoComplete {
  /** Keep the suggestions panel open after a multiple-mode pick (v21 dropped this input). */
  @Input() hideOnSelect = true;

  modelLength: Signal<number> = computed(() => this.modelValue()?.length || 0);
}
