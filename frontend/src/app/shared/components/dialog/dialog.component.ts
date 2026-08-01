import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.css'
})
export class DialogComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() openChange = new EventEmitter<boolean>();

  onClose(): void {
    this.openChange.emit(false);
  }

  onOverlayClick(): void {
    this.openChange.emit(false);
  }
}