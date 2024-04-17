import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HardwareprojectsComponent } from './hardwareprojects.component';

describe('HardwareprojectsComponent', () => {
  let component: HardwareprojectsComponent;
  let fixture: ComponentFixture<HardwareprojectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HardwareprojectsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HardwareprojectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
