import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, forwardRef, NgModule, Signal, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SharedModule } from 'primeng/api';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayModule } from 'primeng/overlay';
import { RippleModule } from 'primeng/ripple';
import { ScrollerModule } from 'primeng/scroller';
import { AutoComplete } from 'primeng/autocomplete';
import { ChevronDownIcon } from 'primeng/icons/chevrondown';
import { SpinnerIcon } from 'primeng/icons/spinner';
import { TimesIcon } from 'primeng/icons/times';
import { TimesCircleIcon } from 'primeng/icons/timescircle';

export const AUTOCOMPLETE_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => AltAutoComplete),
  multi: true
};

@Component({
    selector: 'p-altAutoComplete',
    template: `
        <div #container [ngClass]="containerClass" [ngStyle]="style" [class]="styleClass!" (click)="onContainerClick($event)">
          @if (!multiple) {
            <input
              #focusInput
              pAutoFocus
              [autofocus]="autofocus"
              [ngClass]="inputClass"
              [ngStyle]="inputStyle"
              [class]="inputStyleClass!"
              [type]="type"
              [attr.value]="inputValue()"
              [attr.id]="inputId"
              [autocomplete]="autocomplete"
              [required]="required"
              [name]="name"
              aria-autocomplete="list"
              role="combobox"
              [attr.placeholder]="placeholder"
              [attr.size]="size"
              [attr.maxlength]="maxlength"
              [tabindex]="!disabled ? tabindex : -1"
              [readonly]="readonly"
              [disabled]="disabled"
              [attr.aria-label]="ariaLabel"
              [attr.aria-labelledby]="ariaLabelledBy"
              [attr.aria-required]="required"
              [attr.aria-expanded]="overlayVisible"
              [attr.aria-controls]="id + '_list'"
              [attr.aria-aria-activedescendant]="focused ? focusedOptionId : undefined"
              (input)="onInput($event)"
              (keydown)="onKeyDown($event)"
              (change)="onInputChange($event)"
              (focus)="onInputFocus($event)"
              (blur)="onInputBlur($event)"
              (paste)="onInputPaste($event)"
              (keyup)="onInputKeyUp($event)"
              />
          }
          @if (filled && !disabled && showClear && !loading) {
            @if (!clearIconTemplate) {
              <TimesIcon [styleClass]="'p-autocomplete-clear-icon'" (click)="clear()" [attr.aria-hidden]="true" />
            }
            @if (clearIconTemplate) {
              <span class="p-autocomplete-clear-icon" (click)="clear()" [attr.aria-hidden]="true">
                <ng-template *ngTemplateOutlet="clearIconTemplate"></ng-template>
              </span>
            }
          }
        
          @if (multiple) {
            <ul
              #multiContainer
              class="p-autocomplete-multiple-container p-component p-inputtext !tw-flex-nowrap"
              [tabindex]="-1"
              role="listbox"
              [attr.aria-orientation]="'horizontal'"
              [attr.aria-activedescendant]="focused ? focusedMultipleOptionId : undefined"
              (focus)="onMultipleContainerFocus($event); focusInput.focus()"
              (blur)="onMultipleContainerBlur($event)"
              (keydown)="onMultipleContainerKeyDown($event)"
              >
              @if (!focused && modelLength()) {
                <li
                  #token
                  [ngClass]="{ 'p-autocomplete-token': true }"
                  role="option"
                  [attr.aria-label]="modelLength() + ' items'"
                  [attr.aria-setsize]="modelLength()"
                  [attr.aria-posinset]="0"
                  [attr.aria-selected]="true"
                  >
                  <ng-container *ngTemplateOutlet="selectedItemTemplate!; context: { $implicit: modelValue() }"></ng-container>
                  @if (!selectedItemTemplate) {
                    <span class="p-autocomplete-token-label">+{{ modelLength() }}</span>
                  }
                </li>
              }
              <li class="p-autocomplete-input-token" role="option">
                <input
                  #focusInput
                  pAutoFocus
                  [autofocus]="autofocus"
                  [ngClass]="inputClass"
                  [ngStyle]="inputStyle"
                  [class]="inputStyleClass!"
                  [attr.type]="type"
                  [attr.id]="inputId"
                  [autocomplete]="autocomplete"
                  [required]="required"
                  [attr.name]="name"
                  role="combobox"
                  [attr.placeholder]="placeholder"
                  [attr.size]="size"
                  aria-autocomplete="list"
                  [attr.maxlength]="maxlength"
                  [tabindex]="!disabled ? tabindex : -1"
                  [readonly]="readonly"
                  [disabled]="disabled"
                  [attr.aria-label]="ariaLabel"
                  [attr.aria-labelledby]="ariaLabelledBy"
                  [attr.aria-required]="required"
                  [attr.aria-expanded]="overlayVisible"
                  [attr.aria-controls]="id + '_list'"
                  [attr.aria-aria-activedescendant]="focused ? focusedOptionId : undefined"
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
            }
            @if (loading) {
              @if (!loadingIconTemplate) {
                <SpinnerIcon [styleClass]="'p-autocomplete-loader'" [spin]="true" [attr.aria-hidden]="true" />
              }
              @if (loadingIconTemplate) {
                <span class="p-autocomplete-loader pi-spin " [attr.aria-hidden]="true">
                  <ng-template *ngTemplateOutlet="loadingIconTemplate"></ng-template>
                </span>
              }
            }
            @if (dropdown) {
              <button #ddBtn type="button" pButton [attr.aria-label]="dropdownAriaLabel" class="p-autocomplete-dropdown p-button-icon-only" [disabled]="disabled" pRipple (click)="handleDropdownClick($event)" [attr.tabindex]="tabindex">
                @if (dropdownIcon) {
                  <span [ngClass]="dropdownIcon" [attr.aria-hidden]="true"></span>
                }
                @if (!dropdownIcon) {
                  @if (!dropdownIconTemplate) {
                    <ChevronDownIcon />
                  }
                  <ng-template *ngTemplateOutlet="dropdownIconTemplate!"></ng-template>
                }
              </button>
            }
            <p-overlay
              #overlay
              [visible]="!!overlayVisible" (visibleChange)="overlayVisible = $event"
              [options]="overlayOptions"
              [target]="'@parent'"
              [appendTo]="appendTo"
              [showTransitionOptions]="showTransitionOptions"
              [hideTransitionOptions]="hideTransitionOptions"
              (onAnimationStart)="onOverlayAnimationStart($event)"
              (onHide)="hide()"
              >
              <div [ngClass]="panelClass" [style.max-height]="virtualScroll ? 'auto' : scrollHeight" [ngStyle]="panelStyle" [class]="panelStyleClass!">
                <ng-container *ngTemplateOutlet="headerTemplate!"></ng-container>
                @if (virtualScroll) {
                  <p-scroller
                    #scroller
                    [items]="visibleOptions()"
                    [style]="{ height: scrollHeight }"
                    [itemSize]="virtualScrollItemSize || _itemSize!"
                    [autoSize]="true"
                    [lazy]="lazy"
                    (onLazyLoad)="onLazyLoad.emit($event)"
                    [options]="virtualScrollOptions"
                    >
                    <ng-template pTemplate="content" let-items let-scrollerOptions="options">
                      <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: items, options: scrollerOptions }"></ng-container>
                    </ng-template>
                    @if (loaderTemplate) {
                      <ng-template pTemplate="loader" let-scrollerOptions="options">
                        <ng-container *ngTemplateOutlet="loaderTemplate; context: { options: scrollerOptions }"></ng-container>
                      </ng-template>
                    }
                  </p-scroller>
                }
                @if (!virtualScroll) {
                  <ng-container *ngTemplateOutlet="buildInItems; context: { $implicit: visibleOptions(), options: {} }"></ng-container>
                }
        
                <ng-template #buildInItems let-items let-scrollerOptions="options">
                  <ul #items class="p-autocomplete-items" [ngClass]="scrollerOptions.contentStyleClass" [style]="scrollerOptions.contentStyle" role="listbox" [attr.id]="id + '_list'">
                    @for (option of items; track option; let i = $index) {
                      @if (isOptionGroup(option)) {
                        <li [attr.id]="id + '_' + getOptionIndex(i, scrollerOptions)" class="p-autocomplete-item-group" [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }" role="option">
                          @if (!groupTemplate) {
                            <span>{{ getOptionGroupLabel(option.optionGroup) }}</span>
                          }
                          <ng-container *ngTemplateOutlet="groupTemplate!; context: { $implicit: option.optionGroup }"></ng-container>
                        </li>
                      }
                      @if (!isOptionGroup(option)) {
                        <li
                          class="p-autocomplete-item tw-flex tw-items-center"
                          pRipple
                          [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }"
                          [ngClass]="{ 'p-highlight': isSelected(option), 'p-focus': focusedOptionIndex() === getOptionIndex(i, scrollerOptions), 'p-disabled': isOptionDisabled(option) }"
                          [attr.id]="id + '_' + getOptionIndex(i, scrollerOptions)"
                          role="option"
                          [attr.aria-label]="getOptionLabel(option)"
                          [attr.aria-selected]="isSelectedMulti(option)"
                          [attr.aria-disabled]="isOptionDisabled(option)"
                          [attr.data-p-focused]="focusedOptionIndex() === getOptionIndex(i, scrollerOptions)"
                          [attr.aria-setsize]="ariaSetSize"
                          [attr.aria-posinset]="getAriaPosInset(getOptionIndex(i, scrollerOptions))"
                          (click)="isSelectedMulti(option) ? removeOptionByObject(option) : onOptionSelect($event, option, hideOnSelect)"
                          (mouseenter)="onOptionMouseEnter($event, getOptionIndex(i, scrollerOptions))"
                          >
                          @if (!itemTemplate) {
                            <span>{{ getOptionLabel(option) }}</span>
                          } @else {
                            <ng-container *ngTemplateOutlet="itemTemplate!; context: { $implicit: option, index: scrollerOptions.getOptions ? scrollerOptions.getOptions(i) : i }"></ng-container>
                          }
                          @if (isSelectedMulti(option)) {
                            <i class="ms ms-check ms-icon-md tw-ml-auto"></i>
                          }
                        </li>
                      }
                    }
                    @if (!items || (items && items.length === 0 && showEmptyMessage)) {
                      <li class="p-autocomplete-empty-message" [ngStyle]="{ height: scrollerOptions.itemSize + 'px' }" role="option">
                        @if (!emptyTemplate) {
                          {{ searchResultMessageText }}
                        } @else {
                          <ng-container *ngTemplateOutlet="emptyTemplate!"></ng-container>
                        }
                      </li>
                    }
                  </ul>
                  <ng-container *ngTemplateOutlet="footerTemplate!; context: { $implicit: items }"></ng-container>
                  <span role="status" aria-live="polite" class="p-hidden-accessible">
                    {{ selectedMessageText }}
                  </span>
                </ng-template>
              </div>
            </p-overlay>
          </div>
        `,
    animations: [trigger('overlayAnimation', [transition(':enter', [style({ opacity: 0, transform: 'scaleY(0.8)' }), animate('{{showTransitionParams}}')]), transition(':leave', [animate('{{hideTransitionParams}}', style({ opacity: 0 }))])])],
    host: {
        class: 'p-element p-inputwrapper',
        '[class.p-inputwrapper-filled]': 'filled',
        '[class.p-inputwrapper-focus]': '((focus && !disabled) || autofocus) || overlayVisible',
        '[class.p-autocomplete-clearable]': 'showClear && !disabled'
    },
    providers: [AUTOCOMPLETE_VALUE_ACCESSOR],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['../../../../../node_modules/primeng/resources/components/autocomplete/autocomplete.css'],
    standalone: false
})
export class AltAutoComplete extends AutoComplete {
  modelLength: Signal<number> = computed(() => this.modelValue()?.length || 0);
}

@NgModule({
  imports: [CommonModule, OverlayModule, InputTextModule, ButtonModule, SharedModule, RippleModule, ScrollerModule, AutoFocusModule, TimesCircleIcon, SpinnerIcon, TimesIcon, ChevronDownIcon],
  exports: [AltAutoComplete, OverlayModule, SharedModule, ScrollerModule, AutoFocusModule],
  declarations: [AltAutoComplete]
})
export class AltAutoCompleteModule { }
