<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use Carbon\Carbon;

class UpdateExpiredInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:update-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update the status of expired invoices based on due date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting expired invoices update...');
        
        // Actualizar facturas caducadas
        $expiredCount = Invoice::where('due_date', '<', Carbon::now())
            ->whereIn('status', [Invoice::STATUS_PENDING, Invoice::STATUS_APPROVED])
            ->update(['status' => Invoice::STATUS_EXPIRED]);
        
        $this->info("Completed! Updated {$expiredCount} invoices to expired status.");
        
        return Command::SUCCESS;
    }
}
