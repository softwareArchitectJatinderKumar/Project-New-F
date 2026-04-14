import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { AdminMouComponent } from './admin-mou.component';
import { AdminDashboardModule } from '../AdminDashboard/AdminDashboard.module';

const routes: Routes = [
  {
    path: '',
    component: AdminMouComponent,
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1 (BLANK PAGE ROOT CAUSE): RouterModule.forChild(routes) was missing.
// The routes array was declared but never registered with the Angular router,
// so navigating to this path loaded nothing — producing the blank page.
//
// FIX 2: ReactiveFormsModule, NgSelectModule, NgbModule, NgbNavModule,
// PerfectScrollbarModule were imported but this component uses only template-
// driven forms ([(ngModel)]). Removed unused imports to reduce bundle size
// and avoid potential peer-dependency conflicts.
// ─────────────────────────────────────────────────────────────────────────────

@NgModule({
  declarations: [
    AdminMouComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,         // required for [(ngModel)] on search/filter/textarea
    NgbModalModule,      // required for NgbModal service used in confirmAction
    AdminDashboardModule, // provides <app-AdminDashboard> menu bar

    // ✅ FIX 1 — register the lazy child route so the component renders
    RouterModule.forChild(routes),
  ],
})
export class AdminMouModule { }
