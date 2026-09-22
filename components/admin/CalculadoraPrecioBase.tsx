'use client';

import { useEffect, useRef, useState } from 'react';
import {
  alcanzadasPorPrecioBase,
  derivarPrecioBase,
  escalasPresentes,
  formulaDe,
  medidaDeEscala,
} from '@/lib/precio-base';
import type { EscalaPeso } from '@/lib/precio-base';
import type { Variant } from '@/types';

/**
 * Calculadora de precio base, una por escala de peso.
 *
 * Vive aparte porque la usan dos pantallas con la misma logica y el mismo
 * diseno: la grilla rapida del panel (donde `onGuardar` hace el PATCH) y el
 * ProductoModal (donde `onGuardar` solo reescribe las variantes del form,
 * que se persisten recien con "Guardar"). Si cada una tuviera su copia, un
 * ajuste de criterio quedaria aplicado en una sola.
 */

type OnGuardar = (base: number, escala: EscalaPeso) => Promise<void> | void;

/** Textos de cada escala, para no repetirlos en el input y en la ayuda. */
const ESCALAS: Record<EscalaPeso, { titulo: string; corto: string; placeholder: string }> = {
  fraccionado: { titulo: 'Precio Base (5 kg)', corto: 'fraccionado', placeholder: '7950' },
  bulto: { titulo: 'Precio Base (Bulto)', corto: 'bulto', placeholder: '6800' },
};

/**
 * Un input de precio base, atado a **una** escala.
 *
 * Aplica solo al salir del input o con Enter, y no en cada tecla: el cliente
 * tipea la lista de precios en el celular y un guardado por tecla dispararia
 * un PATCH por digito.
 */
function InputPrecioBase({
  variantes,
  idBase,
  nombre,
  escala,
  onGuardar,
  grande,
}: {
  variantes: Variant[];
  idBase: string;
  nombre: string;
  escala: EscalaPeso;
  onGuardar: OnGuardar;
  grande: boolean;
}) {
  const derivado = derivarPrecioBase(variantes, escala);
  const inicial = derivado === null ? '' : String(derivado);

  const [valor, setValor] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);
  const original = useRef(inicial);

  // El derivado cambia cuando el PATCH vuelve, cuando se edita una variante
  // suelta o cuando se guarda desde el modal: el input tiene que seguirlo.
  useEffect(() => {
    setValor(inicial);
    original.current = inicial;
  }, [inicial]);

  const alcanzadas = alcanzadasPorPrecioBase(variantes, escala);
  const medida = medidaDeEscala(variantes, escala);
  const texto = ESCALAS[escala];
  // Un pack de aceites no tiene "5 kg": el titulo dice por que se multiplica.
  const titulo =
    escala === 'fraccionado' && medida === 'unidad' ? 'Precio Base (x unidad)' : texto.titulo;

  const idInput = `base-${idBase}-${escala}`;

  const commit = async () => {
    if (guardando || valor === original.current) return;

    const n = Number(valor);
    // Un base en 0 o vacio pondria todos los precios en 0: se descarta y se
    // vuelve al valor anterior en vez de vaciar el producto.
    if (valor.trim() === '' || !Number.isFinite(n) || n <= 0) {
      setValor(original.current);
      return;
    }

    original.current = valor;
    setGuardando(true);
    try {
      await onGuardar(Math.round(n), escala);
      setOk(true);
      setTimeout(() => setOk(false), 1600);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={idInput}
          className={`truncate font-semibold uppercase tracking-wider text-[#175427] ${
            grande ? 'text-[11px]' : 'text-[10px]'
          }`}
        >
          {titulo}
        </label>
        {guardando ? (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-tostado">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-spin"
              aria-hidden
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
            </svg>
            Guardando
          </span>
        ) : (
          ok && <span className="shrink-0 text-[10px] font-semibold text-[#175427]">✓</span>
        )}
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        <span className={`font-medium text-tostado ${grande ? 'text-lg' : 'text-sm'}`}>$</span>
        <input
          id={idInput}
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          value={valor}
          disabled={guardando || alcanzadas === 0}
          onChange={(e) => setValor(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            // Dentro del ProductoModal, Enter haria submit del form entero.
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === 'Escape') setValor(original.current);
          }}
          placeholder={texto.placeholder}
          aria-label={`Precio base por ${medida === 'unidad' ? 'unidad' : 'kg'} ${texto.corto} de ${nombre}`}
          className={`w-full min-w-0 rounded-lg border bg-white font-semibold tabular-nums text-carbon outline-none transition-colors focus:border-[#143620]/50 focus:ring-2 focus:ring-[#143620]/12 disabled:bg-crema disabled:text-humo/50 ${
            ok ? 'border-[#1e6b32]/60' : 'border-[#1e6b32]/25'
          } ${grande ? 'h-12 px-3 text-lg' : 'h-8 px-2 text-sm'}`}
        />
      </div>

      <p className="mt-1 text-[10px] leading-snug text-humo/70">
        {`Recalcula ${alcanzadas} ${alcanzadas === 1 ? 'variante' : 'variantes'} (${formulaDe(medida)}).`}
      </p>
    </div>
  );
}

/**
 * Edicion masiva con una calculadora por escala de peso.
 *
 * El kilo fraccionado y el kilo de bulto cerrado tienen margenes distintos:
 * un unico input pisaba los dos con el mismo multiplicador y rompia uno de
 * los dos precios. Cada input recalcula solo **sus** variantes.
 *
 * Se dibuja solo la escala que el producto realmente tiene: un input vacio
 * que nunca se usa es un lugar mas donde tipear el numero equivocado.
 */
export default function CalculadoraPrecioBase({
  variantes,
  idBase,
  nombre,
  onGuardar,
  grande = false,
}: {
  variantes: Variant[];
  /**
   * Prefijo unico de los `id` de los inputs. La grilla dibuja la tabla y las
   * tarjetas a la vez (una oculta por CSS): sin un prefijo distinto por
   * vista, el `htmlFor` apuntaria a dos inputs con el mismo id.
   */
  idBase: string;
  /** Nombre del producto, para el aria-label. */
  nombre: string;
  onGuardar: OnGuardar;
  /**
   * Version tactil: en la tarjeta movil es la accion principal (el cliente
   * actualiza la lista de precios desde el telefono), asi que va a todo el
   * ancho y con tipografia grande.
   */
  grande?: boolean;
}) {
  const escalas = escalasPresentes(variantes);

  return (
    <div
      className={`rounded-xl border border-[#1e6b32]/25 bg-[#1e6b32]/[0.07] ${
        grande ? 'px-3 py-2.5' : 'px-2.5 py-2'
      }`}
    >
      {escalas.length === 0 ? (
        <>
          <p
            className={`font-semibold uppercase tracking-wider text-[#175427] ${
              grande ? 'text-[11px]' : 'text-[10px]'
            }`}
          >
            Precio Base (Kg/U)
          </p>
          <p className="mt-1 text-[10px] leading-snug text-humo/70">
            Sin variantes con peso ni unidades: cargá el peso o el rótulo de cada variante.
          </p>
        </>
      ) : (
        // Dos columnas solo cuando hay dos escalas: en el celular la tarjeta
        // es angosta, asi que se apilan hasta `xs` y recien ahi van a la par.
        <div
          className={
            escalas.length === 2 ? 'grid grid-cols-1 gap-3 min-[420px]:grid-cols-2' : ''
          }
        >
          {escalas.map((escala) => (
            <InputPrecioBase
              key={escala}
              variantes={variantes}
              idBase={idBase}
              nombre={nombre}
              escala={escala}
              onGuardar={onGuardar}
              grande={grande}
            />
          ))}
        </div>
      )}
    </div>
  );
}
