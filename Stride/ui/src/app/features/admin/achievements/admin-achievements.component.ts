import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminAchievementsService } from '@app/core/services/admin-achievements.service';
import { Achievement } from '@app/core/models/admin-content.models';
import { AchievementDialogComponent } from './dialogs/achievement-dialog.component';

@Component({
  selector: 'app-admin-achievements',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-achievements.component.html',
  styleUrl: './admin-achievements.component.scss',
})
export class AdminAchievementsComponent implements OnInit {
  private readonly svc = inject(AdminAchievementsService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  achievements = signal<Achievement[]>([]);
  loading = signal(false);
  total = signal(0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (res) => {
        this.achievements.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.snack.open('Помилка завантаження досягнень', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(AchievementDialogComponent, { data: null, width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.svc.create(result).subscribe({
          next: () => { this.snack.open('Досягнення створено', 'OK', { duration: 2000 }); this.load(); },
          error: () => this.snack.open('Помилка створення', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  openEdit(achievement: Achievement): void {
    const ref = this.dialog.open(AchievementDialogComponent, { data: achievement, width: '520px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.svc.update(achievement.id, result).subscribe({
          next: () => { this.snack.open('Досягнення оновлено', 'OK', { duration: 2000 }); this.load(); },
          error: () => this.snack.open('Помилка оновлення', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  delete(achievement: Achievement): void {
    if (!confirm(`Видалити досягнення "${achievement.name}"?`)) return;
    this.svc.delete(achievement.id).subscribe({
      next: () => { this.snack.open('Досягнення видалено', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Помилка видалення', 'OK', { duration: 3000 }),
    });
  }
}
