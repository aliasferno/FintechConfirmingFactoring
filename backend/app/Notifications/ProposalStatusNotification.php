<?php

namespace App\Notifications;

use App\Models\InvestmentProposal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProposalStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $proposal;
    protected $status;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(InvestmentProposal $proposal, string $status, string $message = null)
    {
        $this->proposal = $proposal;
        $this->status = $status;
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $invoice = $this->proposal->invoice;
        $company = $invoice->company;
        $operationType = $invoice->operation_type === 'factoring' ? 'Factoring' : 'Confirming';
        
        $mailMessage = (new MailMessage)
            ->subject($this->getSubject())
            ->greeting("¡Hola {$notifiable->name}!");

        if ($this->status === 'approved') {
            $mailMessage
                ->line("¡Excelentes noticias! Tu propuesta de inversión ha sido **aprobada**.")
                ->line("**Detalles de la Propuesta Aprobada:**")
                ->line("• Factura: {$invoice->invoice_number}")
                ->line("• Empresa: {$company->business_name}")
                ->line("• Tipo de Operación: {$operationType}")
                ->line("• Monto de Inversión: $" . number_format($this->proposal->amount, 2))
                ->line($this->getOperationSpecificDetails());
                
            if ($this->message) {
                $mailMessage->line("**Mensaje de la empresa:** {$this->message}");
            }
            
            $mailMessage
                ->action('Ver Detalles de la Inversión', url("/mis-inversiones"))
                ->line('La inversión se procesará automáticamente según los términos acordados.');
                
        } elseif ($this->status === 'rejected') {
            $mailMessage
                ->line("Tu propuesta de inversión ha sido **rechazada**.")
                ->line("**Detalles de la Propuesta:**")
                ->line("• Factura: {$invoice->invoice_number}")
                ->line("• Empresa: {$company->business_name}")
                ->line("• Tipo de Operación: {$operationType}")
                ->line("• Monto Propuesto: $" . number_format($this->proposal->amount, 2));
                
            if ($this->message) {
                $mailMessage->line("**Motivo del rechazo:** {$this->message}");
            }
            
            $mailMessage
                ->action('Explorar Otras Oportunidades', url("/oportunidades-inversion"))
                ->line('No te desanimes, hay muchas otras oportunidades de inversión disponibles.');
        }

        return $mailMessage->salutation('Saludos,\nEquipo de Fintech Confirming Factoring');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'proposal_status_update',
            'proposal_id' => $this->proposal->id,
            'invoice_id' => $this->proposal->invoice_id,
            'company_name' => $this->proposal->invoice->company->business_name,
            'status' => $this->status,
            'amount' => $this->proposal->amount,
            'operation_type' => $this->proposal->invoice->operation_type,
            'message' => $this->getNotificationMessage()
        ];
    }

    /**
     * Get the subject for the email.
     */
    private function getSubject(): string
    {
        return match ($this->status) {
            'approved' => 'Propuesta de Inversión Aprobada',
            'rejected' => 'Propuesta de Inversión Rechazada',
            default => 'Actualización de Propuesta de Inversión'
        };
    }

    /**
     * Get the notification message.
     */
    private function getNotificationMessage(): string
    {
        $action = match ($this->status) {
            'approved' => 'aprobada',
            'rejected' => 'rechazada',
            default => 'actualizada'
        };
        
        return "Tu propuesta de inversión para la factura {$this->proposal->invoice->invoice_number} ha sido {$action}";
    }

    /**
     * Get operation-specific details for the email.
     */
    private function getOperationSpecificDetails(): string
    {
        $invoice = $this->proposal->invoice;
        
        if ($invoice->operation_type === 'factoring') {
            $rate = $this->proposal->proposed_interest_rate ?? $invoice->interest_rate ?? 'No especificada';
            $term = $this->proposal->proposed_term_days ?? $invoice->term_days ?? 'No especificado';
            
            return "• Tasa de Interés: {$rate}%\n• Plazo: {$term} días";
        } else {
            $discountRate = $this->proposal->proposed_discount_rate ?? $invoice->discount_rate ?? 'No especificada';
            $commission = $this->proposal->proposed_commission_rate ?? $invoice->commission_rate ?? 'No especificada';
            
            return "• Tasa de Descuento: {$discountRate}%\n• Comisión: {$commission}%";
        }
    }
}