import { NEGOCIO, SITE_DESCRIPTION, SITE_NAME, SITE_URL, OG_IMAGE } from './site';

/**
 * JSON-LD del sitio, en un solo `@graph`.
 *
 * `WholesaleStore` es un subtipo de Store -> LocalBusiness -> Organization:
 * le dice a buscadores y motores de respuesta que esto es venta mayorista,
 * no retail. Es la senal que evita que la marca aparezca como opcion para
 * alguien que busca comprar 200 g de nueces.
 */
export function schemaSitio() {
  const org = {
    '@type': ['WholesaleStore', 'Organization'],
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}${OG_IMAGE.url}`,
      caption: SITE_NAME,
    },
    image: `${SITE_URL}${OG_IMAGE.url}`,
    description: SITE_DESCRIPTION,
    email: NEGOCIO.email,
    telephone: NEGOCIO.telefono,
    address: {
      '@type': 'PostalAddress',
      ...(NEGOCIO.calle ? { streetAddress: NEGOCIO.calle } : {}),
      addressLocality: NEGOCIO.ciudad,
      addressRegion: NEGOCIO.provincia,
      postalCode: NEGOCIO.codigoPostal,
      addressCountry: NEGOCIO.pais,
    },
    // Despacha a todo el pais, aunque el deposito este en Salta.
    areaServed: { '@type': 'Country', name: 'Argentina' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: NEGOCIO.telefono,
        email: NEGOCIO.email,
        areaServed: 'AR',
        availableLanguage: ['es-AR'],
      },
    ],
    currenciesAccepted: 'ARS',
    paymentAccepted: 'Transferencia bancaria, Efectivo',
    priceRange: '$$',
    ...(NEGOCIO.redes.length > 0 ? { sameAs: NEGOCIO.redes } : {}),
    knowsAbout: [
      'Frutos secos',
      'Frutas desecadas',
      'Semillas',
      'Distribución mayorista de alimentos',
      'Insumos de repostería',
    ],
    // Condicion comercial dura: minimo 5 kg, sin venta al publico.
    makesOffer: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      eligibleCustomerType: 'https://schema.org/Wholesaler',
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: 5,
        unitCode: 'KGM',
      },
      availableDeliveryMethod: [
        'https://schema.org/ParcelService',
        'https://schema.org/OnSitePickup',
      ],
    },
  };

  const web = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    inLanguage: 'es-AR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    // Sin `SearchAction`: el catalogo filtra en el cliente y no hay una URL
    // de busqueda que Google pueda invocar. Declararla y que no funcione
    // es peor que no tenerla.
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [org, web],
  };
}
