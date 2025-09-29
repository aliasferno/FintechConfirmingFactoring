<?php

namespace App\Notifications;

use App\Models\InvestmentProposal;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewInvestmentProposalNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $proposal;

    /**
     * Create a new notification instance.
     */
    public function __construct(InvestmentProposal $proposal)
    {
        $this->proposal = $proposal;
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
        $investor = $this->proposal->investor;
        $operationType = $invoice->operation_type === 'factoring' ? 'Factoring' : 'Confirming';
        
        return (new MailMessage)
            ->subject('Nueva Propuesta de Inversión Recibida')
            ->greeting("¡Hola {$notifiable->name}!")
            ->line("Has recibido una nueva propuesta de inversión para tu factura de {$operationType}.")
            ->line("**Detalles de la Propuesta:**")
            ->line("• Factura: {$invoice->invoice_number}")
            ->line("• Monto de la Factura: $" . number_format($invoice->amount, 2))
            ->line("• Monto Propuesto: $" . number_format($this->proposal->amount, 2))
            ->line("• Inversor: {$investor->user->name}")
            ->line($this->getOperationSpecificDetails())
            ->action('Ver Propuesta', url("/propuestas-recibidas"))
            ->line('Puedes revisar los detalles completos y responder a esta propuesta desde tu panel de control.')
            ->salutation('Saludos,\nEquipo de Fintech Confirming Factoring');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'new_investment_proposal',
            'proposal_id' => $this->proposal->id,
            'invoice_id' => $this->proposal->invoice_id,
            'investor_name' => $this->proposal->investor->user->name,
            'amount' => $this->proposal->amount,
            'operation_type' => $this->proposal->invoice->operation_type,
            'message' => "Nueva propuesta de inversión recibida para la factura {$this->proposal->invoice->invoice_number}"
        ];
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
            
            return "• Tasa de Interés Propuesta: {$rate}%\n• Plazo Propuesto: {$term} días";
        } else {
            $discountRate = $this->proposal->proposed_discount_rate ?? $invoice->discount_rate ?? 'No especificada';
            $commission = $this->proposal->proposed_commission_rate ?? $invoice->commission_rate ?? 'No especificada';
            
            return "• Tasa de Descuento Propuesta: {$discountRate}%\n• Comisión Propuesta: {$commission}%";
        }
    }
}