import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareprojectsComponent } from './softwareprojects.component';

describe('SoftwareprojectsComponent', () => {
  let component: SoftwareprojectsComponent;
  let fixture: ComponentFixture<SoftwareprojectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoftwareprojectsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SoftwareprojectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
