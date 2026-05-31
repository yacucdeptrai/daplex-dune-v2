// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { installConsoleErrorGuard } from './testing/console-error-guard';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Fail any spec that emits console.error (e.g. Angular runtime/template errors).
// See src/testing/console-error-guard.ts (Phase 6.12a).
installConsoleErrorGuard();
