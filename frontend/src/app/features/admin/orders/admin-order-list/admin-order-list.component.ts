import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // RouterLink kaldırıldı, Router inject edilecek
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subscription, of, throwError, merge } from 'rxjs';
import { catchError, map, startWith, switchMap, debounceTime, distinctUntilChanged, tap } from 'rxjs/operators'; // tap import edildi
import { environment } from '../../../../../environment';
import { DatePipe } from '@angular/common'; // DatePipe'ı inject edebilmek için import et

type OrderStatusType = 'PENDING' | 'PROCESSING' | 'PAYMENT_FAILED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface AdminOrder {
  id: number;
  orderDate: string;
  status: OrderStatusType;
  totalAmount: number;
  customerId?: number;
  customerUsername?: string;
  itemCount: number;
}

export interface OrderPage {
  content: AdminOrder[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

@Component({
  selector: 'app-admin-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatTooltipModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule
  ],
  providers: [DatePipe],
  templateUrl: './admin-order-list.component.html',
  styles: [`
    .order-list-container { padding: 20px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 16px; }
    .list-header h2 { margin: 0; font-size: 1.8em; font-weight: 500; flex-grow: 1; }
    .filter-form { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; padding: 16px; background-color: #f9f9f9; border-radius: 4px; margin-bottom: 20px; }
    .filter-form mat-form-field { margin-bottom: 0 !important; }
    .filter-field, .filter-field-small { width: 100%; }
    @media (min-width: 600px) { .filter-field { max-width: 250px; } .filter-field-small { max-width: 150px; } }
    table.mat-mdc-table { width: 100%; min-width: 800px; box-shadow: 0 2px 1px -1px rgba(0,0,0,.2), 0 1px 1px 0 rgba(0,0,0,.14), 0 1px 3px 0 rgba(0,0,0,.12); border-radius: 4px; overflow-x: auto; margin-bottom: 16px; }
    .mat-column-id { flex: 0 0 90px !important; }
    .mat-column-orderDate { flex: 0 0 160px !important; }
    .mat-column-customerUsername { flex: 1 1 150px !important; }
    .mat-column-itemCount { flex: 0 0 100px !important; text-align: center; }
    .mat-column-totalAmount { flex: 0 0 130px !important; text-align: right; }
    .mat-column-status { flex: 0 0 150px !important; text-align: center;}
    .mat-column-actions { flex: 0 0 80px !important; text-align: center; }
    .loading-spinner-container, .no-orders-message { text-align: center; padding: 40px; }
    .no-orders-message { color: rgba(0,0,0,0.54); }
    ::ng-deep .mat-sort-header-container { display: flex !important; justify-content: center; }
    ::ng-deep th[style*="text-align: right"] .mat-sort-header-container { justify-content: flex-end !important; }
    ::ng-deep th[style*="text-align: left"] .mat-sort-header-container { justify-content: flex-start !important; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 0.75em; font-weight: 500; display: inline-block; }
    .status-PENDING { background-color: #FFF9C4; color: #F57F17; border: 1px solid #FFF59D;}
    .status-PROCESSING { background-color: #E1F5FE; color: #0277BD; border: 1px solid #B3E5FC;}
    .status-PAYMENT_FAILED { background-color: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2;}
    .status-PREPARING { background-color: #FFE0B2; color: #E65100; border: 1px solid #FFCC80;}
    .status-SHIPPED { background-color: #E0F2F1; color: #00695C; border: 1px solid #B2DFDB;}
    .status-DELIVERED { background-color: #C8E6C9; color: #2E7D32; border: 1px solid #A5D6A7;}
    .status-CANCELLED { background-color: #F5F5F5; color: #757575; border: 1px solid #EEEEEE;}
    .mat-mdc-row:hover { background-color: rgba(0, 0, 0, 0.04); cursor: pointer; }
  `]
})
export class AdminOrderListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'orderDate', 'customerUsername', 'itemCount', 'totalAmount', 'status', 'actions'];
  dataSourceMat = new MatTableDataSource<AdminOrder>([]);
  isLoading = true;
  resultsLength = 0;

  filterForm: FormGroup;
  orderStatusOptions: OrderStatusType[] = ['PENDING', 'PROCESSING', 'PAYMENT_FAILED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  private _paginator!: MatPaginator;
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this._paginator = paginator;
      this.subscribeToPaginatorChanges();
    }
  }
  get paginator(): MatPaginator {
    return this._paginator;
  }

  private _sort!: MatSort;
  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) {
      this._sort = sort;
      this.subscribeToSortChanges();
    }
  }
  get sort(): MatSort {
    return this._sort;
  }

  private sortSubscription?: Subscription;
  private paginatorSubscription?: Subscription;
  private combinedEventsSubscription?: Subscription;
  private viewInitialized = false;

  constructor() {
    this.filterForm = this.fb.group({
      customerUsername: [''],
      status: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      tap(() => {
        if (this._paginator) this._paginator.pageIndex = 0;
      })
    ).subscribe(() => {
      this.loadOrders();
    });
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    console.log("AdminOrderListComponent: ngAfterViewInit called. Triggering initial loadOrders().");
    this.loadOrders();
  }

  subscribeToSortChanges() {
    if (this._sort && !this.sortSubscription) {
      this.sortSubscription = this._sort.sortChange.subscribe(() => {
        if (this._paginator) this._paginator.pageIndex = 0;
      });
      this.subscribeToCombinedEvents();
    }
  }

  subscribeToPaginatorChanges() {
    if (this._paginator && !this.paginatorSubscription) {
      this.subscribeToCombinedEvents();
    }
  }

  subscribeToCombinedEvents() {
    if (this.combinedEventsSubscription) {
      this.combinedEventsSubscription.unsubscribe();
    }
    if (this._sort && this._paginator) {
      this.combinedEventsSubscription = merge(this._sort.sortChange, this._paginator.page)
        .pipe(
          tap(() => {
            console.log("AdminOrderListComponent: Merged sort/page event. Calling loadOrders().");
            this.loadOrders();
          })
        )
        .subscribe();
    } else {
      console.warn("AdminOrderListComponent: Sort or Paginator not ready for merged event subscription.");
    }
  }

  loadOrders(): void {
    console.log("AdminOrderListComponent: loadOrders() called.");

    this.isLoading = true;
    const formValue = this.filterForm.value;

    let params = new HttpParams()
      .set('page', this._paginator ? this._paginator.pageIndex.toString() : '0')
      .set('size', this._paginator ? this._paginator.pageSize.toString() : '10')
      .set('sort', this._sort && this._sort.active && this._sort.direction ? `${this.sort.active},${this.sort.direction}` : 'orderDate,desc');

    if (formValue.customerUsername) {
      params = params.set('customerUsername', formValue.customerUsername);
    }
    if (formValue.status) {
      params = params.set('status', formValue.status);
    }
    if (formValue.startDate) {
      params = params.set('startDate', this.datePipe.transform(formValue.startDate, 'yyyy-MM-dd') || '');
    }
    if (formValue.endDate) {
      params = params.set('endDate', this.datePipe.transform(formValue.endDate, 'yyyy-MM-dd') || '');
    }

    const apiEndpoint = `${environment.apiUrl}/admin/orders`;
    console.log(`AdminOrderListComponent: Attempting to fetch orders from ${apiEndpoint} with params:`, params.toString());

    this.httpClient.get<OrderPage>(apiEndpoint, { params }).pipe(
      map(page => {
        console.log("AdminOrderListComponent: Orders fetched successfully.", page);
        this.isLoading = false;
        this.resultsLength = page.totalElements;
        return page.content.map(order => ({
          ...order,
          itemCount: (order as any).items ? (order as any).items.length : (order.itemCount || 0)
        }));
      }),
      catchError((error: HttpErrorResponse) => {
        console.error("AdminOrderListComponent: Error loading admin orders:", error);
        this.isLoading = false;
        this.snackBar.open('Siparişler yüklenirken bir hata oluştu.', 'Kapat', { duration: 3000 });
        return of([]);
      })
    ).subscribe(data => {
      console.log("AdminOrderListComponent: Data subscribed and assigned to dataSourceMat.", data);
      this.dataSourceMat.data = data;
      if (data.length === 0 && this.resultsLength > 0) {
        if(this._paginator) this._paginator.pageIndex = 0;
        console.warn("AdminOrderListComponent: Data is empty but resultsLength is positive. Possible non-existent page.");
      }
    });
  }

  applyApiFilter(event?: Event): void {
    if (event) {
        const filterValue = (event.target as HTMLInputElement).value;
    }
    if(this.paginator) this.paginator.pageIndex = 0;
    this.loadOrders();
  }


  clearFilters(): void {
    this.filterForm.reset({
      customerUsername: '',
      status: '',
      startDate: null,
      endDate: null
    });
    this.applyApiFilter();
  }

  viewOrderDetails(order: AdminOrder): void {
    this.router.navigate(['/admin/orders', order.id]);
  }

  getStatusClass(status: OrderStatusType | undefined): string {
    if (!status) return '';
    return `status-chip status-${status}`;
  }

  ngOnDestroy() {
    this.sortSubscription?.unsubscribe();
    this.paginatorSubscription?.unsubscribe();
    this.combinedEventsSubscription?.unsubscribe();
  }
}
