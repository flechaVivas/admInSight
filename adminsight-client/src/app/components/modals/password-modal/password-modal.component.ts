import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-password-modal',
  templateUrl: './password-modal.component.html',
  styleUrls: ['./password-modal.component.css']
})
export class PasswordModalComponent {
  @Input() title: string = 'Enter sudo password';
  @Output() confirm = new EventEmitter<string>();
  @Output() cancel = new EventEmitter();

  sudoPassword: string = '';

  onConfirm() {
    this.confirm.emit(this.sudoPassword);
    this.sudoPassword = '';
  }

  onCancel() {
    this.cancel.emit();
    this.sudoPassword = '';
  }
}