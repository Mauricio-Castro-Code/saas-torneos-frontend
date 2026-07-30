import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapitanShell } from './capitan-shell';

describe('CapitanShell', () => {
  let component: CapitanShell;
  let fixture: ComponentFixture<CapitanShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapitanShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapitanShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
