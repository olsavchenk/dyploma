import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LearnBrowseComponent } from './learn-browse.component';
import { LearningService } from '@app/core';
import { of } from 'rxjs';

describe('LearnBrowseComponent', () => {
  let component: LearnBrowseComponent;
  let fixture: ComponentFixture<LearnBrowseComponent>;
  let learningService: jasmine.SpyObj<LearningService>;

  const mockSubjects = [
    {
      id: '1',
      name: 'Математика',
      slug: 'math',
      description: 'Основи математики',
      iconUrl: null,
      sortOrder: 1,
      topicCount: 10,
      progress: 45,
    },
    {
      id: '2',
      name: 'Українська мова',
      slug: 'ukrainian',
      description: 'Українська мова та література',
      iconUrl: null,
      sortOrder: 2,
      topicCount: 8,
      progress: 0,
    },
  ];

  beforeEach(async () => {
    const learningServiceSpy = jasmine.createSpyObj('LearningService', ['getSubjects']);

    await TestBed.configureTestingModule({
      imports: [LearnBrowseComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
        { provide: LearningService, useValue: learningServiceSpy },
      ],
    }).compileComponents();

    learningService = TestBed.inject(LearningService) as jasmine.SpyObj<LearningService>;
    fixture = TestBed.createComponent(LearnBrowseComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    learningService.getSubjects.and.returnValue(of(mockSubjects));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load subjects on init', () => {
    learningService.getSubjects.and.returnValue(of(mockSubjects));
    
    fixture.detectChanges();

    expect(learningService.getSubjects).toHaveBeenCalled();
    expect(component['subjects']()).toEqual(mockSubjects);
    expect(component['filteredSubjects']()).toEqual(mockSubjects);
    expect(component['loading']()).toBe(false);
  });

  it('should filter subjects by search term', (done) => {
    learningService.getSubjects.and.returnValue(of(mockSubjects));
    fixture.detectChanges();

    component['searchControl'].setValue('Матем');

    // Wait for debounce
    setTimeout(() => {
      expect(component['filteredSubjects']().length).toBe(1);
      expect(component['filteredSubjects']()[0].name).toBe('Математика');
      done();
    }, 350);
  });

  it('should show empty state when no subjects match search', (done) => {
    learningService.getSubjects.and.returnValue(of(mockSubjects));
    fixture.detectChanges();

    component['searchControl'].setValue('Фізика');

    // Wait for debounce
    setTimeout(() => {
      expect(component['filteredSubjects']().length).toBe(0);
      done();
    }, 350);
  });

  it('should get correct progress color', () => {
    expect(component['getProgressColor'](85)).toBe('accent');
    expect(component['getProgressColor'](65)).toBe('primary');
    expect(component['getProgressColor'](30)).toBe('warn');
  });
});
