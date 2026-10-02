'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { textoTicket } from '@/lib/balance';
import type { Cliente, Transaccion } from '@/lib/balance';
import { PAGE_STYLE_TICKET, TicketVenta } from './Imprimibles';
import { ModalShell, btnPrimario, btnSecundario } from './ui';

/**
 * Vista previa del ticket. "Descargar PDF" abre el dialogo de impresion con
 * solo el ticket (en el celular/PC se elige "Guardar como PDF"); "WhatsApp"
 * abre el chat del cliente con la version texto ya escrita, para adjuntar
 * el PDF ahi mismo.
 */
export default function TicketModal({
  t,
  cliente,
  onClose,
}: {
  t: Transaccion;
  cliente: Cliente | null;
  onClose: () => void;
}) {
  const telefono = cliente?.telefono ?? null;
  const ref = useRef<HTMLDivElement>(null);
  const imprimir = useReactToPrint({
    contentRef: ref,
    documentTitle: `Ticket ${t.ref_ticket ?? t.id} - Nutrirse`,
    pageStyle: PAGE_STYLE_TICKET,
  });

  // Sin telefono, wa.me/?text= deja elegir el contacto a mano.
  const urlWhatsApp = telefono
    ? buildWhatsAppUrl(textoTicket(t), telefono)
    : `https://wa.me/?text=${encodeURIComponent(textoTicket(t))}`;

  return (
    <ModalShell
      titulo={`Ticket ${t.ref_ticket ?? ''}`.trim()}
      onClose={onClose}
      ancho="max-w-lg"
      pie={
        <>
          <button onClick={onClose} className={btnSecundario}>Cerrar</button>
          <button onClick={() => imprimir()} className={btnSecundario}>Descargar PDF</button>
          <a href={urlWhatsApp} target="_blank" rel="noopener noreferrer" className={`${btnPrimario} inline-flex items-center`}>
            Enviar por WhatsApp
          </a>
        </>
      }
    >
      <div className="rounded-2xl border border-carbon/10 shadow-sm">
        <TicketVenta ref={ref} t={t} cliente={cliente} />
      </div>
    </ModalShell>
  );
}
