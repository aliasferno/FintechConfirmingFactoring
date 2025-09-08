<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as VerifyEmailBase;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class CustomVerifyEmail extends VerifyEmailBase implements ShouldQueue
{
    use Queueable;

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);
        $userType = $notifiable->user_type;
        
        $subject = $this->getSubjectByUserType($userType);
        $greeting = $this->getGreetingByUserType($userType, $notifiable->name);
        $content = $this->getContentByUserType($userType);

        return (new MailMessage)
            ->subject($subject)
            ->greeting($greeting)
            ->line($content)
            ->action('Verificar Email', $verificationUrl)
            ->line('Si no creaste una cuenta, no es necesario realizar ninguna acción.')
            ->line('Este enlace de verificación expirará en 60 minutos.')
            ->salutation('Saludos,\nEquipo de Fintech Confirming Factoring');
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl($notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }

    /**
     * Get subject by user type.
     */
    private function getSubjectByUserType(string $userType): string
    {
        return match ($userType) {
            'empresa' => 'Verifica tu cuenta empresarial - Fintech Confirming Factoring',
            'inversor' => 'Verifica tu cuenta de inversor - Fintech Confirming Factoring',
            'admin' => 'Verifica tu cuenta de administrador - Fintech Confirming Factoring',
            default => 'Verifica tu dirección de email - Fintech Confirming Factoring',
        };
    }

    /**
     * Get greeting by user type.
     */
    private function getGreetingByUserType(string $userType, string $name): string
    {
        return match ($userType) {
            'empresa' => "¡Hola {$name}! Bienvenido a nuestra plataforma empresarial",
            'inversor' => "¡Hola {$name}! Bienvenido a nuestra plataforma de inversión",
            'admin' => "¡Hola {$name}! Acceso administrativo",
            default => "¡Hola {$name}!",
        };
    }

    /**
     * Get content by user type.
     */
    private function getContentByUserType(string $userType): string
    {
        return match ($userType) {
            'empresa' => 'Gracias por registrarte como empresa en nuestra plataforma de confirming y factoring. Para completar tu registro y acceder a todas las funcionalidades empresariales, por favor verifica tu dirección de email haciendo clic en el botón de abajo.',
            'inversor' => 'Gracias por registrarte como inversor en nuestra plataforma de confirming y factoring. Para completar tu registro y comenzar a explorar oportunidades de inversión, por favor verifica tu dirección de email haciendo clic en el botón de abajo.',
            'admin' => 'Tu cuenta de administrador ha sido creada. Por favor verifica tu dirección de email para acceder al panel administrativo.',
            default => 'Por favor verifica tu dirección de email haciendo clic en el botón de abajo.',
        };
    }
}