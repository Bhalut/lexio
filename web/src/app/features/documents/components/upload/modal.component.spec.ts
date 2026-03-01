import { TestBed } from '@angular/core/testing';

import { UploadModalComponent } from './modal.component';

describe('UploadModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadModalComponent],
    }).compileComponents();
  });

  it('emits a delivery payload with legal metadata', () => {
    const fixture = TestBed.createComponent(UploadModalComponent);
    const component = fixture.componentInstance;
    const emitted: FormData[] = [];

    component.title = 'Pruebas del demandante';
    component.description = 'Soportes remitidos por el cliente.';
    component.category = 'Pruebas documentales';
    component.relatedPhase = 'Fase probatoria';
    component.selectedFiles = [
      new File(['pdf-content'], 'evidence.pdf', {
        type: 'application/pdf',
      }),
    ];
    component.upload.subscribe((payload) => emitted.push(payload));

    component.submit();

    expect(emitted).toHaveLength(1);
    expect(emitted[0].get('title')).toBe('Pruebas del demandante');
    expect(emitted[0].get('description')).toBe('Soportes remitidos por el cliente.');
    expect(emitted[0].get('category')).toBe('Pruebas documentales');
    expect(emitted[0].get('relatedPhase')).toBe('Fase probatoria');
    expect((emitted[0].get('files') as File).name).toBe('evidence.pdf');
  });

  it('keeps only unique files when the same file is added twice', () => {
    const fixture = TestBed.createComponent(UploadModalComponent);
    const component = fixture.componentInstance;
    const file = new File(['pdf-content'], 'evidence.pdf', {
      type: 'application/pdf',
      lastModified: 1,
    });

    component.addFiles([file, file]);

    expect(component.selectedFiles).toHaveLength(1);
  });
});
