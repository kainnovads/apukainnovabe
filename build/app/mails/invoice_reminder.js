import { BaseMail } from '@adonisjs/mail';
export default class InvoiceReminder extends BaseMail {
    invoice;
    customer;
    perusahaan;
    from = 'billing@yourcompany.com';
    subject = 'Reminder: Tagihan Invoice Belum Lunas';
    constructor(invoice, customer, perusahaan) {
        super();
        this.invoice = invoice;
        this.customer = customer;
        this.perusahaan = perusahaan;
    }
    prepare() {
        const dueDate = this.invoice.dueDate instanceof Date
            ? this.invoice.dueDate.toLocaleDateString('id-ID')
            : this.invoice.dueDate;
        const remainingAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(this.invoice.remainingAmount);
        const totalAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(this.invoice.total);
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .invoice-details { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .amount { font-size: 18px; font-weight: bold; color: #dc3545; }
          .due-date { color: #dc3545; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Reminder Tagihan Invoice</h2>
            <p>Halo ${this.customer.name},</p>
          </div>

          <p>Kami ingin mengingatkan bahwa Anda memiliki tagihan invoice yang belum lunas:</p>

          <div class="invoice-details">
            <h3>Detail Invoice:</h3>
            <ul>
              <li><strong>No. Invoice:</strong> ${this.invoice.noInvoice}</li>
              <li><strong>Tanggal Invoice:</strong> ${this.invoice.date instanceof Date ? this.invoice.date.toLocaleDateString('id-ID') : this.invoice.date}</li>
              <li><strong>Jatuh Tempo:</strong> <span class="due-date">${dueDate}</span></li>
              <li><strong>Total Tagihan:</strong> ${totalAmount}</li>
              <li><strong>Sudah Dibayar:</strong> ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(this.invoice.paidAmount)}</li>
              <li><strong>Sisa Tagihan:</strong> <span class="amount">${remainingAmount}</span></li>
              <li><strong>Status:</strong> <span style="color: ${this.invoice.status === 'partial' ? '#ffc107' : '#dc3545'}; font-weight: bold;">${this.invoice.status === 'partial' ? 'Sebagian Dibayar' : 'Belum Dibayar'}</span></li>
            </ul>
          </div>

          <p>Mohon segera lakukan pembayaran untuk menghindari keterlambatan. Jika Anda sudah melakukan pembayaran, mohon abaikan email ini.</p>

          <p>Untuk informasi lebih lanjut, silakan hubungi tim keuangan kami.</p>

          <div class="footer">
            <p>Hormat kami,<br>
            <strong>Tim Keuangan ${this.perusahaan?.nmPerusahaan || 'Perusahaan'}</strong></p>
            <p>Email: billing@yourcompany.com<br>
            Telepon: (021) 1234-5678</p>
          </div>
        </div>
      </body>
      </html>
    `;
        this.message.to(this.customer.email).html(htmlContent);
    }
}
//# sourceMappingURL=invoice_reminder.js.map