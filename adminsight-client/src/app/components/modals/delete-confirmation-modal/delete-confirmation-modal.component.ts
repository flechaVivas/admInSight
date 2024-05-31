import { Component, Input, Output, EventEmitter } from '@angular/core';
import { System } from '../../../models';

@Component({
  selector: 'app-delete-confirmation-modal',
  templateUrl: './delete-confirmation-modal.component.html',
})
export class DeleteConfirmationModalComponent {
  @Input() visible: boolean = false;
  @Input() systemToDelete: System | null = null;
  @Output() confirmDelete = new EventEmitter<void>();
  @Output() cancelDelete = new EventEmitter<void>();
}