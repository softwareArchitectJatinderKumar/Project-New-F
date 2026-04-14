import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { NewUserMouComponent } from './new-Mou.component';
import { CifMenuBarModule } from '../cif-menu-bar/cif-menu-bar.module';

const routes: Routes = [
  { path: '', component: NewUserMouComponent }
];

 
@NgModule({
  declarations: [
    NewUserMouComponent,   
  ],
  imports: [
    CommonModule,          
    FormsModule,           
    NgbModalModule,        
    CifMenuBarModule,      
    RouterModule.forChild(routes),   
  ],
})
export class NewMouModule { }
