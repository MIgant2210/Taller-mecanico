import React, { useMemo } from 'react';

// Modal that shows a printable invoice and allows exporting to PDF
const InvoiceModal = ({ invoice, tickets = [], onClose }) => {
  const ticket = useMemo(() => {
    if (!invoice) return null;
    if (invoice.id_ticket) return tickets.find(t => t.id_ticket === invoice.id_ticket) || null;
    return null;
  }, [invoice, tickets]);

  const formatCurrency = (v) => `Q ${parseFloat(v || 0).toFixed(2)}`;

  const exportPDF = async () => {
    try {
      // dynamic import to keep bundle small
      const html2canvasMod = await import('html2canvas');
      const { jsPDF } = await import('jspdf');
      const html2canvas = html2canvasMod.default || html2canvasMod;

      const element = document.getElementById('invoice-to-print');
      if (!element) return alert('Error: no se encontró la sección para imprimir');

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      // if content taller than one page, add pages (basic handling)
      if (imgHeight > pageHeight) {
        let remainingHeight = imgHeight - pageHeight;
        while (remainingHeight > 0) {
          position = -remainingHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          remainingHeight -= pageHeight;
        }
      }

      const name = `factura_${invoice.numero_factura || invoice.id_factura || 'sin_num'}.pdf`;
      pdf.save(name);
    } catch (err) {
      console.error('Error exporting PDF', err);
      alert('No se pudo generar el PDF. Revisa la consola para más detalles.');
    }
  };

  if (!invoice) return null;

  const items = invoice.detalles || (ticket ? (
    [ ...(ticket.servicios || []).map(s => ({ descripcion: s.descripcion_servicio || 'Servicio', cantidad: 1, precio_unitario: parseFloat(s.precio || 0) })),
      ...(ticket.repuestos || []).map(r => ({ descripcion: r.descripcion_repuesto || 'Repuesto', cantidad: parseFloat(r.cantidad || 1), precio_unitario: parseFloat(r.precio_unitario || 0) }))
    ]
  ) : []);

  const subtotal = invoice.subtotal ?? items.reduce((s, it) => s + (parseFloat(it.precio_unitario || 0) * (parseFloat(it.cantidad || 1))), 0);
  const impuestos = invoice.impuestos ?? 0;
  const descuentos = invoice.descuentos ?? 0;
  const total = invoice.total ?? (subtotal + (subtotal * (parseFloat(impuestos) / 100)) - parseFloat(descuentos));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Factura #{invoice.numero_factura || invoice.id_factura}</h3>
          <div className="flex items-center gap-2">
            <button onClick={exportPDF} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:opacity-90">Exportar PDF</button>
            <button onClick={onClose} className="bg-gray-100 px-4 py-2 rounded-lg">Cerrar</button>
          </div>
        </div>

        <div id="invoice-to-print" className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Taller - Factura</h2>
              <p className="text-sm text-gray-600">Dirección del Taller | Tel: 1234-5678</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Fecha: {new Date(invoice.fecha_factura).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Factura: <span className="font-mono font-bold">#{invoice.numero_factura || invoice.id_factura}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold">Cliente</h4>
              <p>{invoice.cliente ? `${invoice.cliente.nombres} ${invoice.cliente.apellidos}` : 'N/D'}</p>
              <p className="text-sm text-gray-600">Tel: {invoice.cliente?.telefono || 'N/D'}</p>
            </div>
            <div>
              <h4 className="font-semibold">Método de Pago</h4>
              <p>{invoice.forma_pago?.nombre_forma_pago || 'N/D'}</p>
              <p className="text-sm text-gray-600">Vencimiento: {invoice.fecha_vencimiento || 'N/D'}</p>
            </div>
          </div>

          <div className="overflow-auto mb-6">
            <table className="w-full text-sm border table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Descripción</th>
                  <th className="p-2 text-right">Cantidad</th>
                  <th className="p-2 text-right">Precio Unit.</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{it.descripcion}</td>
                    <td className="p-2 text-right">{it.cantidad}</td>
                    <td className="p-2 text-right">{formatCurrency(it.precio_unitario)}</td>
                    <td className="p-2 text-right">{formatCurrency((it.precio_unitario || 0) * (it.cantidad || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-1/3">
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Impuestos ({impuestos}%)</span>
                <span className="font-semibold">{formatCurrency((subtotal * (parseFloat(impuestos) / 100)) || 0)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Descuentos</span>
                <span className="font-semibold">{formatCurrency(descuentos)}</span>
              </div>
              <div className="flex justify-between py-3 border-t mt-3">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
