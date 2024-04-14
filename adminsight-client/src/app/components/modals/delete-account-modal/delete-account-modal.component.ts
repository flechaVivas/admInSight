import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-delete-account-modal',
  templateUrl: './delete-account-modal.component.html',
  styleUrls: ['./delete-account-modal.component.css']
})
export class DeleteAccountModalComponent {
  @Output() confirmDelete = new EventEmitter<void>();
  @Output() cancelDelete = new EventEmitter<void>();

  confirmDeleteAccount(): void {
    this.confirmDelete.emit();
  }

  cancelDeleteAccount(): void {
    this.cancelDelete.emit();
  }
}