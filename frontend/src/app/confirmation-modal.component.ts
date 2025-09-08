import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible) {
      <div class="modal-overlay" (click)="onCancel()">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 class="modal-title">{{ title }}</h3>
          </div>
          
          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="onCancel()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Cancelar
            </button>
            <button class="btn btn-danger" (click)="onConfirm()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Input() isVisible = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Estás seguro de que deseas continuar?';
  @Input() confirmText = 'Confirmar';
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  
  onConfirm() {
    this.confirmed.emit();
  }
  
  onCancel() {
    this.cancelled.emit();
  }
}