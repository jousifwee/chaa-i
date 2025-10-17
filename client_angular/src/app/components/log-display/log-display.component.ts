import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-log-display',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './log-display.component.html',
  styleUrls: ['./log-display.component.scss']
})
export class LogDisplayComponent {
  @Input() entries: string[] = [];
  @Input() title = 'Log';
  @Input() emptyLabel = 'Noch keine Logeintraege.';
}
