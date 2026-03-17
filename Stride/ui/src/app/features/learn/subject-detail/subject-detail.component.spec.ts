import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { SubjectDetailComponent } from './subject-detail.component';
import { LearningService, Subject, Topic } from '@app/core';
import { of } from 'rxjs';

describe('SubjectDetailComponent', () => {
  let component: SubjectDetailComponent;
  let fixture: ComponentFixture<SubjectDetailComponent>;
  let learningService: jasmine.SpyObj<LearningService>;

  const mockSubject: Subject = {
    id: '1',
    name: 'Математика',
    slug: 'math',
    description: 'Основи математики',
    iconUrl: null,
    sortOrder: 1,
    topicCount: 3,
    progress: 45,
  };

  const mockTopics: Topic[] = [
    {
      id: '1',
      subjectId: '1',
      parentTopicId: null,
      name: 'Алгебра',
      gradeLevel: 5,
      sortOrder: 1,
      masteryLevel: 60,
      progress: 50,
    },
    {
      id: '2',
      subjectId: '1',
      parentTopicId: '1',
      name: 'Рівняння',
      gradeLevel: 5,
      sortOrder: 1,
      masteryLevel: 70,
      progress: 60,
    },
    {
      id: '3',
      subjectId: '1',
      parentTopicId: null,
      name: 'Геометрія',
      gradeLevel: 5,
      sortOrder: 2,
      masteryLevel: 0,
      progress: 0,
    },
  ];

  beforeEach(async () => {
    const learningServiceSpy = jasmine.createSpyObj('LearningService', [
      'getSubject',
      'getSubjectTopics',
    ]);

    await TestBed.configureTestingModule({
      imports: [SubjectDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
        { provide: LearningService, useValue: learningServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1',
              },
            },
          },
        },
      ],
    }).compileComponents();

    learningService = TestBed.inject(LearningService) as jasmine.SpyObj<LearningService>;
    fixture = TestBed.createComponent(SubjectDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    learningService.getSubject.and.returnValue(of(mockSubject));
    learningService.getSubjectTopics.and.returnValue(of(mockTopics));
    
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load subject and topics on init', () => {
    learningService.getSubject.and.returnValue(of(mockSubject));
    learningService.getSubjectTopics.and.returnValue(of(mockTopics));

    fixture.detectChanges();

    expect(learningService.getSubject).toHaveBeenCalledWith('1');
    expect(learningService.getSubjectTopics).toHaveBeenCalledWith('1');
    expect(component['subject']()).toEqual(mockSubject);
    expect(component['topics']()).toEqual(mockTopics);
    expect(component['loading']()).toBe(false);
  });

  it('should build hierarchical topic tree', () => {
    learningService.getSubject.and.returnValue(of(mockSubject));
    learningService.getSubjectTopics.and.returnValue(of(mockTopics));

    fixture.detectChanges();

    const treeData = component['dataSource'].data;
    expect(treeData.length).toBe(2); // Two root topics
    expect(treeData[0].children?.length).toBe(1); // Algebra has 1 child
    expect(treeData[0].children?.[0].id).toBe('2');
  });

  it('should get correct mastery label', () => {
    expect(component['getMasteryLabel'](95)).toBe('Майстер');
    expect(component['getMasteryLabel'](75)).toBe('Досвідчений');
    expect(component['getMasteryLabel'](55)).toBe('Вивчаю');
    expect(component['getMasteryLabel'](35)).toBe('Початківець');
    expect(component['getMasteryLabel'](10)).toBe('Не розпочато');
  });

  it('should get correct mastery color', () => {
    expect(component['getMasteryColor'](95)).toBe('accent');
    expect(component['getMasteryColor'](75)).toBe('primary');
    expect(component['getMasteryColor'](55)).toBe('primary');
    expect(component['getMasteryColor'](35)).toBe('warn');
    expect(component['getMasteryColor'](10)).toBe('');
  });

  it('should get correct mastery icon', () => {
    expect(component['getMasteryIcon'](95)).toBe('emoji_events');
    expect(component['getMasteryIcon'](75)).toBe('star');
    expect(component['getMasteryIcon'](55)).toBe('trending_up');
    expect(component['getMasteryIcon'](35)).toBe('play_circle_outline');
    expect(component['getMasteryIcon'](10)).toBe('radio_button_unchecked');
  });
});
