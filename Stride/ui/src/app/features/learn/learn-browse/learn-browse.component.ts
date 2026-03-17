import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { LearningService, StudentClass, StudentClassSubject } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';

@Component({
  selector: 'app-learn-browse',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatProgressBarModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './learn-browse.component.html',
  styleUrl: './learn-browse.component.scss',
})
export class LearnBrowseComponent implements OnInit {
  private readonly learningService = inject(LearningService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);

  // State signals
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly classes = signal<StudentClass[]>([]);
  protected readonly filteredClasses = signal<StudentClass[]>([]);

  // Join class state
  protected readonly joinDialogOpen = signal<boolean>(false);
  protected readonly joining = signal<boolean>(false);
  protected readonly joinError = signal<string | null>(null);
  protected readonly joinSuccess = signal<string | null>(null);

  // Controls
  protected readonly searchControl = new FormControl('');
  protected readonly joinCodeControl = new FormControl('', [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(6),
    Validators.pattern(/^[A-Za-z0-9]{6}$/),
  ]);

  protected get showJoinForm(): boolean {
    return this.joinDialogOpen() || (!this.loading() && !this.error() && this.classes().length === 0);
  }

  ngOnInit(): void {
    this.loadClasses();
    this.setupSearch();
  }

  private loadClasses(): void {
    this.loading.set(true);
    this.error.set(null);

    this.learningService
      .getMyClasses()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (classes) => {
          this.classes.set(classes);
          this.filteredClasses.set(classes);
        },
        error: (err) => {
          this.logger.error('LearnBrowseComponent', 'Failed to load classes', {}, err);
          this.error.set('Не вдалося завантажити класи. Спробуйте оновити сторінку.');
        },
      });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.filterClasses(term || ''));
  }

  private filterClasses(searchTerm: string): void {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredClasses.set(this.classes());
      return;
    }

    const filtered = this.classes()
      .map((cls) => ({
        ...cls,
        subjects: cls.subjects.filter((s) => s.name.toLowerCase().includes(term)),
      }))
      .filter((cls) => cls.name.toLowerCase().includes(term) || cls.subjects.length > 0);

    this.filteredClasses.set(filtered);
  }

  protected openJoinDialog(): void {
    this.joinDialogOpen.set(true);
    this.joinError.set(null);
    this.joinSuccess.set(null);
    this.joinCodeControl.reset();
  }

  protected closeJoinDialog(): void {
    this.joinDialogOpen.set(false);
    this.joinError.set(null);
    this.joinSuccess.set(null);
    this.joinCodeControl.reset();
  }

  protected onJoinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    this.joinCodeControl.setValue(cleaned, { emitEvent: true });
    input.value = cleaned;
  }

  protected onJoinClass(): void {
    const code = (this.joinCodeControl.value ?? '').trim().toUpperCase();
    if (code.length !== 6) return;

    this.joining.set(true);
    this.joinError.set(null);
    this.joinSuccess.set(null);

    this.learningService
      .joinClass(code)
      .pipe(finalize(() => this.joining.set(false)))
      .subscribe({
        next: (res) => {
          this.joinSuccess.set(`Ти успішно приєднався до класу "${res.className}"!`);
          this.joinCodeControl.reset();
          setTimeout(() => {
            this.joinDialogOpen.set(false);
            this.joinSuccess.set(null);
            this.loadClasses();
          }, 1500);
        },
        error: (err) => {
          const msg: string = err?.error?.message ?? '';
          if (msg.toLowerCase().includes('invalid join code') || msg.toLowerCase().includes('not active')) {
            this.joinError.set('Невірний код або клас більше не активний.');
          } else if (msg.toLowerCase().includes('already joined')) {
            this.joinError.set('Ти вже є учасником цього класу.');
          } else {
            this.joinError.set('Не вдалося приєднатися. Перевір код та спробуй знову.');
          }
          this.logger.error('LearnBrowseComponent', 'Failed to join class', { code }, err);
        },
      });
  }

  protected onSubjectClick(subject: StudentClassSubject): void {
    if (subject.subjectId) {
      this.router.navigate(['/learn/subjects', subject.subjectId]);
    }
  }

  protected onRefresh(): void {
    this.loadClasses();
  }

  protected getProgressColor(progress: number): 'primary' | 'accent' | 'warn' {
    if (progress >= 80) return 'accent';
    if (progress >= 50) return 'primary';
    return 'warn';
  }

  protected getSubjectIcon(name: string): string {
    const iconMap: Record<string, string> = {
      матем: 'calculate',
      укр: 'menu_book',
      англ: 'language',
      фізи: 'science',
      хімі: 'science',
      біол: 'eco',
      гео: 'explore',
      іст: 'history_edu',
    };
    return iconMap[name.toLowerCase().slice(0, 4)] ?? 'book';
  }
}
