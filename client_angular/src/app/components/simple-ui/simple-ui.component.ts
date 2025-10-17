import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SimpleLogEntry } from '../../models';

@Component({
  selector: 'app-simple-ui',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './simple-ui.component.html',
  styleUrls: ['./simple-ui.component.scss']
})
export class SimpleUiComponent {
  @Input() status = 'Nicht verbunden';
  @Input() statusClass: 'ok' | 'idle' = 'idle';
  @Input() connected = false;
  @Input() userId = '';
  @Input() simpleKeyLabel = '';
  @Input() simpleForm!: FormGroup;
  @Input() logEntries: SimpleLogEntry[] = [];

  @Output() connectClick = new EventEmitter<void>();
  @Output() disconnectClick = new EventEmitter<void>();
  @Output() sendClick = new EventEmitter<void>();
}
