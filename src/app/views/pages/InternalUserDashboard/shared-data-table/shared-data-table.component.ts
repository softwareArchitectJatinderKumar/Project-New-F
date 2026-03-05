import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  hidden?: boolean;
  pipe?: 'currency' | 'date' | 'uppercase' | 'lowercase' | 'titlecase' | 'percent' | 'number';
  pipeArgs?: any;
  action?: boolean;
  actionLabel?: string;
  actionIcon?: string;
  actionClass?: string;
  condition?: (row: any) => boolean;
  badge?: boolean;
  badgeClass?: (row: any) => string;
}

export interface DataTableConfig {
  title: string;
  columns: DataTableColumn[];
  showSearch?: boolean;
  showExport?: boolean;
  exportFileName?: string;
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
  rowAction?: boolean;
  emptyMessage?: string;
}

@Component({
  selector: 'app-shared-data-table',
  templateUrl: './shared-data-table.component.html',
  styleUrls: ['./shared-data-table.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SharedDataTableComponent implements OnInit {
  @Input() data: any[] = [];
  @Input() config: DataTableConfig = {
    title: 'Data Table',
    columns: [],
    showSearch: true,
    showExport: true,
    exportFileName: 'data_export.xlsx',
    itemsPerPageOptions: [5, 10, 15, 20, 25],
    defaultItemsPerPage: 10,
    emptyMessage: 'No records found'
  };
  @Input() loading: boolean = false;
  @Input() template!: TemplateRef<any>;

  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();

  @ViewChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  searchQuery: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  itemsPerPageOptions: number[] = [5, 10, 15, 20, 25];

  ngOnInit(): void {
    if (this.config.itemsPerPageOptions) {
      this.itemsPerPageOptions = this.config.itemsPerPageOptions;
    }
    if (this.config.defaultItemsPerPage) {
      this.itemsPerPage = this.config.defaultItemsPerPage;
    }
  }

  get filteredData(): any[] {
    if (!this.searchQuery.trim()) {
      return this.data;
    }
    const searchTerm = this.searchQuery.toLowerCase();
    return this.data.filter(item => {
      return this.config.columns.some(col => {
        if (col.hidden) return false;
        const value = item[col.key];
        return value !== undefined && value !== null && 
          String(value).toLowerCase().includes(searchTerm);
      });
    });
  }

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  get showPagination(): boolean {
    return this.filteredData.length > 0;
  }

  get startRecord(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length);
  }

  onSearch(): void {
    this.currentPage = 1;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }

  onItemsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.itemsPerPage = Number(select.value);
    this.currentPage = 1;
    this.pageChange.emit(this.currentPage);
  }

  exportToExcel(): void {
    if (this.filteredData.length === 0) return;

    const exportedData = this.filteredData.map(item => {
      const row: any = {};
      this.config.columns.forEach(col => {
        if (!col.hidden) {
          let value = item[col.key];
          if (col.pipe === 'currency') {
            value = value ? `₹${value}` : '-';
          } else if (col.pipe === 'date' && value) {
            value = new Date(value).toLocaleDateString();
          }
          row[col.label] = value ?? '-';
        }
      });
      return row;
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportedData);
    const wscols = this.config.columns
      .filter(col => !col.hidden)
      .map(() => ({ wpx: 150 }));
    ws['!cols'] = wscols;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    const blobData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([blobData], { type: 'application/octet-stream' }));
    link.download = this.config.exportFileName || 'data_export.xlsx';
    link.click();
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onActionClick(row: any, event: Event): void {
    event.stopPropagation();
    this.actionClick.emit(row);
  }

  getBadgeClass(row: any, column: DataTableColumn): string {
    if (column.badgeClass) {
      return column.badgeClass(row);
    }
    return 'bg-secondary';
  }

  getValue(row: any, column: DataTableColumn): any {
    let value = row[column.key];
    
    if (value === undefined || value === null) {
      return '-';
    }

    switch (column.pipe) {
      case 'currency':
        return `₹${value}`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'titlecase':
        return String(value).charAt(0).toUpperCase() + String(value).slice(1);
      case 'percent':
        return `${value}%`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return value;
    }
  }
}
