import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { LigaService } from './liga';

describe('LigaService', () => {
  let service: LigaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(LigaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
