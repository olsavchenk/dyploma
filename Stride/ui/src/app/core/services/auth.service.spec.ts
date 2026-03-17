import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '@environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  SelectRoleRequest,
} from '../models/auth-request.models';
import { AuthResponse, UserInfo } from '../models/auth-response.models';

/**
 * Unit tests for AuthService
 * US-040: AuthService sample test
 */
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  let localStorageMock: { [key: string]: string };

  const mockUser: UserInfo = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'Student',
    avatarUrl: null,
    isEmailVerified: true,
    hasCompletedOnboarding: false,
    createdAt: new Date().toISOString(),
  };

  const mockAuthResponse: AuthResponse = {
    token: 'mock-jwt-token',
    user: mockUser,
  };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorageMock = {};
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should load token from localStorage on init', () => {
      localStorageMock['stride_access_token'] = 'stored-token';
      const newService = TestBed.inject(AuthService);
      expect(newService.token()).toBe('stored-token');
    });

    it('should load user from localStorage on init', () => {
      localStorageMock['stride_user'] = JSON.stringify(mockUser);
      const newService = TestBed.inject(AuthService);
      expect(newService.user()).toEqual(mockUser);
    });
  });

  describe('Login', () => {
    it('should call login endpoint and handle success', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      service.login(loginRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(service.token()).toBe(mockAuthResponse.token);
          expect(service.user()).toEqual(mockAuthResponse.user);
          expect(service.isAuthenticated()).toBe(true);
          expect(service.loading()).toBe(false);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockAuthResponse);
    });

    it('should set loading state during login', () => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(service.loading()).toBe(false);

      service.login(loginRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(service.loading()).toBe(false);
    });

    it('should handle login error', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      service.login(loginRequest).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(service.loading()).toBe(false);
          expect(service.token()).toBeNull();
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Register', () => {
    it('should call register endpoint and handle success', (done) => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        displayName: 'New User',
        gdprConsent: true,
      };

      service.register(registerRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(mockAuthResponse);
          expect(service.token()).toBe(mockAuthResponse.token);
          expect(service.user()).toEqual(mockAuthResponse.user);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(mockAuthResponse);
    });
  });

  describe('Select Role', () => {
    it('should call select-role endpoint successfully', (done) => {
      const selectRoleRequest: SelectRoleRequest = {
        role: 'Student',
      };

      const responseWithRole: AuthResponse = {
        ...mockAuthResponse,
        user: { ...mockUser, role: 'Student' },
      };

      service.selectRole(selectRoleRequest).subscribe({
        next: (response) => {
          expect(response).toEqual(responseWithRole);
          expect(service.userRole()).toBe('Student');
          expect(service.isStudent()).toBe(true);
          expect(service.isTeacher()).toBe(false);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/select-role`);
      expect(req.request.method).toBe('POST');
      req.flush(responseWithRole);
    });
  });

  describe('Logout', () => {
    it('should call logout endpoint and clear auth data', (done) => {
      // First set some auth data
      localStorageMock['stride_access_token'] = 'token';
      localStorageMock['stride_user'] = JSON.stringify(mockUser);

      service.logout().subscribe({
        next: () => {
          expect(service.token()).toBeNull();
          expect(service.user()).toBeNull();
          expect(service.isAuthenticated()).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should clear auth data even if API call fails', (done) => {
      service.logout().subscribe({
        next: () => {
          expect(service.token()).toBeNull();
          expect(service.user()).toBeNull();
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('Computed Signals', () => {
    it('should compute isAuthenticated correctly', () => {
      expect(service.isAuthenticated()).toBe(false);

      // Simulate login
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should compute user role properties correctly', () => {
      const studentResponse: AuthResponse = {
        token: 'token',
        user: { ...mockUser, role: 'Student' },
      };

      service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(studentResponse);

      expect(service.userRole()).toBe('Student');
      expect(service.isStudent()).toBe(true);
      expect(service.isTeacher()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });

    it('should compute teacher role correctly', () => {
      const teacherResponse: AuthResponse = {
        token: 'token',
        user: { ...mockUser, role: 'Teacher' },
      };

      service.login({ email: 'teacher@example.com', password: 'pass' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(teacherResponse);

      expect(service.userRole()).toBe('Teacher');
      expect(service.isTeacher()).toBe(true);
      expect(service.isStudent()).toBe(false);
    });
  });

  describe('Role Checking', () => {
    beforeEach(() => {
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);
    });

    it('should check if user has specific role', () => {
      expect(service.hasRole('Student')).toBe(true);
      expect(service.hasRole('Teacher')).toBe(false);
    });

    it('should check if user has any of specified roles', () => {
      expect(service.hasAnyRole(['Student', 'Teacher'])).toBe(true);
      expect(service.hasAnyRole(['Teacher', 'Admin'])).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', (done) => {
      const refreshResponse = { token: 'new-token' };

      service.refreshToken().subscribe({
        next: (response) => {
          expect(response.token).toBe('new-token');
          expect(service.token()).toBe('new-token');
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(refreshResponse);
    });

    it('should logout on refresh failure', (done) => {
      service.refreshToken().subscribe({
        next: () => done.fail('Should have failed'),
        error: () => {
          expect(service.token()).toBeNull();
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      req.flush({ message: 'Refresh token expired' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('LocalStorage Synchronization', () => {
    it('should store token in localStorage on login', (done) => {
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe({
        next: () => {
          // Wait for effect to run
          setTimeout(() => {
            expect(localStorage.setItem).toHaveBeenCalledWith(
              'stride_access_token',
              mockAuthResponse.token
            );
            done();
          }, 0);
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);
    });

    it('should store user in localStorage on login', (done) => {
      service.login({ email: 'test@example.com', password: 'pass' }).subscribe({
        next: () => {
          // Wait for effect to run
          setTimeout(() => {
            expect(localStorage.setItem).toHaveBeenCalledWith(
              'stride_user',
              JSON.stringify(mockUser)
            );
            done();
          }, 0);
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockAuthResponse);
    });

    it('should remove data from localStorage on logout', (done) => {
      service.logout().subscribe({
        next: () => {
          // Wait for effect to run
          setTimeout(() => {
            expect(localStorage.removeItem).toHaveBeenCalledWith('stride_access_token');
            expect(localStorage.removeItem).toHaveBeenCalledWith('stride_user');
            done();
          }, 0);
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });
  });
});
