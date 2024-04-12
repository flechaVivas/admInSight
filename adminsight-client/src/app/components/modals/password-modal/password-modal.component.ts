// password-modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-password-modal',
  templateUrl: './password-modal.component.html',
  styleUrls: ['./password-modal.component.css']
})
export class PasswordModalComponent {
  sudoPassword: string = '';

  @Input() serviceName: string = '';
  @Input() action: 'start' | 'stop' | 'restart' = 'start';

  @Output() confirm = new EventEmitter<{ password: string, serviceName: string, action: 'start' | 'stop' | 'restart' }>();
  @Output() cancel = new EventEmitter();

  onConfirm(sudoPassword: string, serviceName: string, action: string) {
    this.confirm.emit({ password: this.sudoPassword, serviceName: this.serviceName, action: this.action });
  }

  onCancel() {
    this.cancel.emit();
    this.sudoPassword = '';
  }
}