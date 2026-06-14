import { Component, ChangeDetectionStrategy, ContentChildren, QueryList, AfterContentInit, Input, Renderer2, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { MenuItem } from 'primeng/api';
import { Menu, MenuModule } from 'primeng/menu';
import { TabsModule } from 'primeng/tabs';

import { PanelToastDirective } from './panel-toast.directive';
import { TabPanelDirective } from './tab-panel.directive';
import { VerticalTabChange } from '../../../core/interfaces/events';
import { trackId, trackTabId } from '../../../core/utils';
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'app-vertical-tab',
    templateUrl: './vertical-tab.component.html',
    styleUrls: ['./vertical-tab.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('tabPanelToast', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate('200ms ease-in-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                style({ transform: 'translateY(0)', opacity: 1 }),
                animate('200ms ease-in-out', style({ transform: 'translateY(100%)', opacity: 0 }))
            ])
        ])
    ],
    imports: [TabsModule, MenuModule, NgClass, NgTemplateOutlet]
})
export class VerticalTabComponent implements AfterViewInit, AfterContentInit {
  trackId = trackId;
  trackTabId = trackTabId;
  @Input() contentStyleClass: string = '';
  @Input() panelStyleClass: string = '';
  @Input() width: string = '100vw';
  @Input() height: string = '100vh';
  @Input() menuWidth: string = '15rem';
  @Input() menuSpacingX: string = '4rem';
  @Input() menuSpacingY: string = '2rem';
  @Input() fullContentWidth: boolean = false;
  @Output() tabChange = new EventEmitter<VerticalTabChange>();
  @ContentChildren(TabPanelDirective) tabs!: QueryList<TabPanelDirective>;
  @ContentChildren(PanelToastDirective) toasts!: QueryList<PanelToastDirective>;
  @ViewChild(Menu) menu?: Menu;

  menuItems: MenuItem[] = [];
  tabMenuItems: MenuItem[] = [];
  selectedTabId?: number | string;
  selectedTabIndex?: number;
  selectedMenu?: HTMLAnchorElement;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit(): void {
    if (this.menu) {
      const firstMenuItem = this.menu.el.nativeElement.querySelector('.p-menu-item-link');
      if (firstMenuItem) {
        this.renderer.addClass(firstMenuItem, 'p-menuitem-link-active');
        firstMenuItem.focus();
        this.selectedMenu = firstMenuItem;
      }
    }
  }

  ngAfterContentInit(): void {
    this.initTabs();
  }

  initTabs(): void {
    this.tabs.forEach((tab, index) => {
      !tab.id && (tab.id = `idx-${index}`);
      this.menuItems.push({
        label: tab.label,
        command: (event) => {
          this.selectedMenu = this.activeMenuItem(event.originalEvent);
          this.selectTab(index, tab.id);
        }
      });
      this.tabMenuItems.push({
        label: tab.label,
        command: () => {
          this.selectTab(index, tab.id);
        }
      });
      if (tab.separator) {
        this.menuItems.push({
          separator: true
        });
      }
    });
    this.selectTab(0, this.tabs.first.id);
  }

  selectTab(index: number, id?: number | string) {
    if (id)
      this.tabChange.emit({ previous: this.selectedTabId, current: id });
    this.selectedTabIndex = index;
    this.selectedTabId = id;
  }

  onMobileTabChange(value: string | number | undefined) {
    const index = Number(value);
    const tab = this.tabs.get(index);
    this.selectTab(index, tab?.id);
  }

  activeMenuItem(event: any): HTMLAnchorElement {
    const node = event.target.tagName === 'A' ? event.target : event.target.parentNode;
    if (this.selectedMenu)
      this.renderer.removeClass(this.selectedMenu, 'p-menuitem-link-active');
    this.renderer.addClass(node, 'p-menuitem-link-active');
    return node;
  }
}
