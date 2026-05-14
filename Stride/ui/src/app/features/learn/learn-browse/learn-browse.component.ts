import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { LearningService, StudentClass, StudentClassSubject, Subject } from '@app/core';
import { LoggingService } from '@app/core/services/logging.service';
import { TranslationService } from '@app/core/services/translation.service';
import { PluralUaPipe } from '@app/shared/pipes/plural-ua.pipe';

@Component({
  selector: 'app-learn-browse',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    PluralUaPipe,
  ],
  templateUrl: './learn-browse.component.html',
  styleUrl: './learn-browse.component.scss',
})
export class LearnBrowseComponent implements OnInit {
  private readonly learningService = inject(LearningService);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggingService);
  private readonly i18n = inject(TranslationService);

  // State signals
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string | null>(null);
  protected readonly classes = signal<StudentClass[]>([]);
  protected readonly filteredClasses = signal<StudentClass[]>([]);

  // Catalog of all available subjects (M-26) — independent of class enrolment.
  protected readonly allSubjects = signal<Subject[]>([]);
  protected readonly allSubjectsLoading = signal<boolean>(false);

  // Join class state
  protected readonly joinDialogOpen = signal<boolean>(false);
  protected readonly joining = signal<boolean>(false);
  protected readonly joinError = signal<string | null>(null);
  protected readonly joinSuccess = signal<string | null>(null);

  // Grade filter — labels are i18n keys, rendered via `| translate` in the template.
  protected readonly activeGradeFilter = signal<string>('all');
  protected readonly gradeFilters = [
    { labelKey: 'learn.browse.filters.all', value: 'all' },
    { labelKey: 'learn.browse.filters.primary', value: '1-4' },
    { labelKey: 'learn.browse.filters.middle', value: '5-9' },
    { labelKey: 'learn.browse.filters.high', value: '10-11' },
  ];

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
    this.loadAllSubjects();
    this.setupSearch();
  }

  private loadAllSubjects(): void {
    this.allSubjectsLoading.set(true);
    this.learningService
      .getSubjects()
      .pipe(finalize(() => this.allSubjectsLoading.set(false)))
      .subscribe({
        next: (subjects) => this.allSubjects.set(this.dedupSubjects(subjects ?? [])),
        error: (err) => {
          this.logger.error('LearnBrowseComponent', 'Failed to load subjects catalog', {}, err);
          this.allSubjects.set([]);
        },
      });
  }

  /**
   * BUG H-06: backend currently seeds duplicate Math (`Math` and `Математика`) and
   * an unwanted Природознавство. Dedup on the client by canonical lower-cased name
   * (or `code` if present) and keep the localized record.
   * TODO: backend seed migration needed to fix the actual source data — agent E
   *       will handle the seed for Math + add History of Ukraine.
   */
  private dedupSubjects(list: Subject[]): Subject[] {
    const seen = new Map<string, Subject>();
    for (const s of list) {
      const anyS = s as any;
      const key = (
        anyS.code ??
        anyS.slug ??
        this.canonicalSubjectKey(s.name)
      ).toString().trim().toLowerCase();
      if (!key) continue;
      // Prefer the entry whose name contains Cyrillic letters (Ukrainian) over Latin-only "Math".
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, s);
        continue;
      }
      const cyrillic = /[Ѐ-ӿ]/;
      if (cyrillic.test(s.name) && !cyrillic.test(existing.name)) {
        seen.set(key, s);
      }
    }
    return Array.from(seen.values());
  }

  private canonicalSubjectKey(name: string): string {
    const lower = (name ?? '').trim().toLowerCase();
    if (lower === 'math' || lower === 'mathematics' || lower === 'математика') return 'math';
    if (lower === 'ukrainian' || lower === 'ukrainian language' || lower === 'українська' || lower === 'українська мова') return 'ukrainian';
    if (lower === 'english' || lower === 'англійська' || lower === 'англійська мова') return 'english';
    if (lower === 'history' || lower === 'history of ukraine' || lower === 'історія' || lower === 'історія україни') return 'history-ua';
    return lower;
  }

  protected onSubjectCardClick(subject: Subject): void {
    if (subject.id) {
      this.router.navigate(['/learn/subjects', subject.id]);
    }
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
          this.error.set(this.i18n.instant('errors.generic'));
        },
      });
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term: string | null) => this.filterClasses(term || ''));
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
          const successMsg = this.i18n.instant('learn.browse.joinSuccess', { className: res.className });
          this.joinSuccess.set(successMsg);
          this.joinCodeControl.reset();
          // BUG H-05: refresh memberships immediately so the joined-state UI renders.
          this.learningService.clearCaches();
          this.loadClasses();
          setTimeout(() => {
            this.joinDialogOpen.set(false);
            this.joinSuccess.set(null);
          }, 1500);
        },
        error: (err) => {
          const msg: string = err?.error?.message ?? '';
          const lower = msg.toLowerCase();
          if (lower.includes('already joined') || lower.includes('already a member') || lower.includes('вже')) {
            // BUG H-05: treat "already joined" as a success — refetch memberships and
            // show the joined-state UI instead of an error toast.
            this.joinSuccess.set(this.i18n.instant('learn.browse.joinAlready'));
            this.joinCodeControl.reset();
            this.learningService.clearCaches();
            this.loadClasses();
            setTimeout(() => {
              this.joinDialogOpen.set(false);
              this.joinSuccess.set(null);
            }, 1500);
            return;
          }
          if (lower.includes('invalid join code') || lower.includes('not active')) {
            this.joinError.set(this.i18n.instant('learn.browse.joinInvalid'));
          } else {
            this.joinError.set(this.i18n.instant('learn.browse.joinFailed'));
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

  protected setGradeFilter(value: string): void {
    this.activeGradeFilter.set(value);
    this.applyGradeFilter();
  }

  private applyGradeFilter(): void {
    const filter = this.activeGradeFilter();
    if (filter === 'all') {
      this.filteredClasses.set(this.classes());
      return;
    }
    const [min, max] = filter.split('-').map(Number);
    const filtered = this.classes().filter(
      (cls) => cls.gradeLevel >= min && cls.gradeLevel <= max
    );
    this.filteredClasses.set(filtered);
  }

  protected getMasteryDash(progress: number): string {
    // circumference of r=20 circle = 2π*20 ≈ 125.66
    return ((progress / 100) * 125.66).toFixed(2);
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
