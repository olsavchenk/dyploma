import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { debounceTime } from 'rxjs';
import { AdminService, AdminUser, UserRole } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';
import { ChangeRoleDialogComponent } from './dialogs/change-role-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly logger = inject(LoggingService);

  // State
  protected readonly loading = signal(false);
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly sortBy = signal('createdAt');
  protected readonly sortOrder = signal<'asc' | 'desc'>('desc');

  // Filters
  protected readonly searchControl = new FormControl('');
  protected readonly roleFilter = signal<string | undefined>(undefined);
  protected readonly deletedFilter = signal<boolean | undefined>(undefined);

  // Table
  protected readonly displayedColumns = [
    'displayName',
    'email',
    'role',
    'createdAt',
    'lastLoginAt',
    'stats',
    'actions',
  ];

  // Options
  protected readonly roles: UserRole[] = ['Student', 'Teacher', 'Admin'];
  protected readonly deletedOptions = [
    { value: undefined, label: 'Всі' },
    { value: false, label: 'Активні' },
    { value: true, label: 'Видалені' },
  ];

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadUsers();
  }

  private setupSearchDebounce(): void {
    this.searchControl.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.page.set(1);
      this.loadUsers();
    });
  }

  private loadUsers(): void {
    this.loading.set(true);

    const request = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchControl.value || undefined,
      role: this.roleFilter(),
      isDeleted: this.deletedFilter(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
    };

    this.adminService.getUsers(request).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.totalCount.set(response.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('UsersComponent', 'Failed to load users', {}, err);
        this.snackBar.open('Не вдалося завантажити користувачів', 'Закрити', {
          duration: 3000,
        });
        this.loading.set(false);
      },
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  protected onSortChange(sort: Sort): void {
    if (sort.direction) {
      this.sortBy.set(sort.active);
      this.sortOrder.set(sort.direction);
      this.loadUsers();
    }
  }

  protected onRoleFilterChange(): void {
    this.page.set(1);
    this.loadUsers();
  }

  protected onDeletedFilterChange(): void {
    this.page.set(1);
    this.loadUsers();
  }

  protected clearFilters(): void {
    this.searchControl.setValue('');
    this.roleFilter.set(undefined);
    this.deletedFilter.set(undefined);
    this.page.set(1);
    this.loadUsers();
  }

  protected hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value ||
      this.roleFilter() !== undefined ||
      this.deletedFilter() !== undefined
    );
  }

  protected openChangeRoleDialog(user: AdminUser): void {
    const dialogRef = this.dialog.open(ChangeRoleDialogComponent, {
      width: '500px',
      data: {
        userId: user.id,
        displayName: user.displayName,
        currentRole: user.role,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadUsers();
      }
    });
  }

  protected getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      Student: 'primary',
      Teacher: 'accent',
      Admin: 'warn',
    };
    return colors[role] || '';
  }

  protected getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      Student: 'Студент',
      Teacher: 'Вчитель',
      Admin: 'Адмін',
    };
    return labels[role] || role;
  }

  protected formatDate(dateString: string | null): string {
    if (!dateString) return 'Ніколи';
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  protected formatDateTime(dateString: string | null): string {
    if (!dateString) return 'Ніколи';
    const date = new Date(dateString);
    return date.toLocaleString('uk-UA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
