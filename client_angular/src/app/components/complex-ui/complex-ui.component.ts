import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-complex-ui',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule
  ],
  templateUrl: './complex-ui.component.html',
  styleUrls: ['./complex-ui.component.scss']
})
export class ComplexUiComponent {
  @Input() configForm!: FormGroup;
  @Input() messageForm!: FormGroup;
  @Input() status = 'Nicht verbunden';
  @Input() statusClass: 'ok' | 'idle' = 'idle';
  @Input() connected = false;

  @Output() connectClick = new EventEmitter<void>();
  @Output() disconnectClick = new EventEmitter<void>();
  @Output() sendClick = new EventEmitter<void>();
  @Output() applyPassphraseClick = new EventEmitter<void>();
}
