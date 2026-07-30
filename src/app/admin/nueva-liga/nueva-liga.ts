import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { EquipoService } from '../../shared/services/equipo';
import { FormatoLiga, Liga, LigaService } from '../../shared/services/liga';

type Paso = 'formulario' | 'creada';

@Component({
  selector: 'app-nueva-liga',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './nueva-liga.html',
  styleUrl: './nueva-liga.scss',
})
export class NuevaLiga {
  private readonly fb = inject(FormBuilder);
  private readonly ligaService = inject(LigaService);
  private readonly equipoService = inject(EquipoService);

  readonly paso = signal<Paso>('formulario');
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly copiado = signal(false);
  readonly ligaCreada = signal<Liga | null>(null);

  // Informativo: la Temporada real se crea automáticamente al guardar la
  // liga (ver crearCategoriaPorDefecto), este campo solo la anticipa.
  readonly temporadaLabel = `Temporada 1 - ${new Date().getFullYear()}`;

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    sede: [''],
    cuposMaximos: this.fb.control<number | null>(null, Validators.min(1)),
    formato: this.fb.nonNullable.control<FormatoLiga>('liga'),
  });

  seleccionarFormato(formato: FormatoLiga): void {
    this.form.controls.formato.setValue(formato);
  }

  crear(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);

    const { nombre, sede, cuposMaximos, formato } = this.form.getRawValue();
    this.ligaService.crear({ nombre, sede, formato, cuposMaximos }).subscribe({
      next: (liga) => {
        // Categoria por defecto detrás de escena, lista para cuando exista la pantalla de equipos.
        this.equipoService.crearCategoriaPorDefecto(liga.id).subscribe();
        this.loading.set(false);
        this.ligaCreada.set(liga);
        this.paso.set('creada');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractErrorMessage(err));
      },
    });
  }

  copiarCodigo(): void {
    const codigo = this.ligaCreada()?.codigo;
    if (!codigo) {
      return;
    }
    navigator.clipboard.writeText(codigo);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 1500);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object') {
      const messages = Object.values(body).flat();
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    return 'No se pudo crear la liga. Intenta de nuevo.';
  }
}
