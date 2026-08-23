export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-hueso">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-nuez">
            Nutrirse<span className="text-tostado">.</span>
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-humo">
            Distribuidora mayorista de frutos secos y desecados. Salta, Argentina.
          </p>
        </div>
        <div className="text-sm text-humo">
          <p className="mb-3 font-medium text-carbon">Operación</p>
          <p>Venta exclusiva por mayor</p>
          <p>Mínimo de compra: 5 kg</p>
          <p>Despachos de lunes a viernes</p>
        </div>
        <div className="text-sm text-humo">
          <p className="mb-3 font-medium text-carbon">Contacto</p>
          <p>Pedidos por WhatsApp</p>
          <p>Salta Capital · CP 4400</p>
        </div>
      </div>
      <div className="border-t border-black/5 px-5 py-5 text-center text-xs text-humo sm:px-8">
        © {new Date().getFullYear()} Nutrirse. Precios sin IVA sujetos a modificación.
      </div>
    </footer>
  );
}
