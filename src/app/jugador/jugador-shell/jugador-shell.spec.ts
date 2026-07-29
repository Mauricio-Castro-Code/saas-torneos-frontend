import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JugadorShell } from './jugador-shell';

describe('JugadorShell', () => {
  let component: JugadorShell;
  let fixture: ComponentFixture<JugadorShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JugadorShell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JugadorShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
