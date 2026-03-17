import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@app/core';

interface RoleOption {
  value: 'Student' | 'Teacher';
  title: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-select-role',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './select-role.component.html',
  styleUrl: './select-role.component.scss',
})
export class SelectRoleComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly selectedRole = signal<'Student' | 'Teacher' | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly roleOptions: RoleOption[] = [
    {
      value: 'Student',
      title: 'Учень',
      description: 'Я хочу вчитися і розвивати свої навички',
      icon: 'school',
      color: '#667eea',
    },
    {
      value: 'Teacher',
      title: 'Вчитель',
      description: 'Я хочу навчати та керувати класами',
      icon: 'person',
      color: '#f093fb',
    },
  ];

  protected selectRole(role: 'Student' | 'Teacher'): void {
    this.selectedRole.set(role);
  }

  protected confirmSelection(): void {
    const role = this.selectedRole();
    if (!role) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService.selectRole({ role }).subscribe({
      next: () => {
        // Navigate based on selected role
        if (role === 'Student') {
          this.router.navigate(['/dashboard']);
        } else if (role === 'Teacher') {
          this.router.navigate(['/teacher']);
        }
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set('Виникла помилка. Спробуйте ще раз');
        }
      },
    });
  }
}
