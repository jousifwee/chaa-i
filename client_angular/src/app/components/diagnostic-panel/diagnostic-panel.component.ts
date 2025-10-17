import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DiagnosticLogEntry } from '../../models';

@Component({
  selector: 'app-diagnostic-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './diagnostic-panel.component.html',
  styleUrls: ['./diagnostic-panel.component.scss']
})
export class DiagnosticPanelComponent {
  @Input() entries: DiagnosticLogEntry[] = [];
}
