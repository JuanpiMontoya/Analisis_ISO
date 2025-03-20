import { TestBed } from '@angular/core/testing';

import { ValidarContraseñaService } from './validar-contraseña.service';

describe('ValidarContraseñaService', () => {
  let service: ValidarContraseñaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidarContraseñaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
