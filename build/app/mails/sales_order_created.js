import { BaseMail } from '@adonisjs/mail';
export default class SalesOrderCreated extends BaseMail {
    so;
    customer;
    perusahaan;
    cabang;
    from = 'sales@yourcompany.com';
    subject = 'Sales Order Confirmation';
    constructor(so, customer, perusahaan, cabang) {
        super();
        this.so = so;
        this.customer = customer;
        this.perusahaan = perusahaan;
        this.cabang = cabang;
    }
    prepare() {
        const htmlContent = `
      <h1>Konfirmasi Pesanan Penjualan</h1>
      <p>Halo ${this.customer.name},</p>
      <p>Terima kasih atas pesanan Anda. Berikut adalah detail pesanan Anda:</p>
      <ul>
        <li><strong>No. SO:</strong> ${this.so.noSo}</li>
        <li><strong>Tanggal:</strong> ${this.so.date instanceof Date ? this.so.date.toISOString().slice(0, 10) : this.so.date}</li>
        <li><strong>Perusahaan:</strong> ${this.perusahaan && 'name' in this.perusahaan ? this.perusahaan.name : ''}</li>
        <li><strong>Cabang:</strong> ${this.cabang && 'name' in this.cabang ? this.cabang.name : ''}</li>
        <li><strong>Total:</strong> ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(this.so.total)}</li>
      </ul>
      <p>Kami akan segera memproses pesanan Anda.</p>
      <p>Hormat kami,<br>Tim Penjualan</p>
    `;
        this.message.to(this.customer.email).html(htmlContent);
    }
}
//# sourceMappingURL=sales_order_created.js.map