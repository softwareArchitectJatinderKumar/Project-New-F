import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedDataTableComponent } from './shared-data-table.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    SharedDataTableComponent
  ],
  exports: [
    SharedDataTableComponent
  ]
})
export class SharedDataTableModule { }
