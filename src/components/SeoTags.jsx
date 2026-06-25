import { Helmet } from 'react-helmet-async'

export default function SeoTags({ seo, product, reviews = [], reviewStats = null }) {
 if (!seo) return null
 const hasApprovedReviews = reviewStats?.count > 0 && reviews.length > 0

 return (
  <Helmet>
   <html lang="id" />
   <title>{seo.title}</title>
   <meta name="title" content={seo.title} />
   <meta name="description" content={seo.description} />
   <meta name="keywords" content={seo.keywords} />
   <meta name="author" content="Puthic Sari" />
   <meta name="robots" content={seo.robots} />
   <link rel="canonical" href={seo.url} />

   <meta property="og:type" content={seo.type} />
   <meta property="og:url" content={seo.url} />
   <meta property="og:title" content={seo.title} />
   <meta property="og:description" content={seo.description} />
   <meta property="og:image" content={seo.image} />
   <meta property="og:image:alt" content={seo.imageAlt} />
   <meta property="og:image:width" content="1200" />
   <meta property="og:image:height" content="630" />
   <meta property="og:locale" content={seo.locale} />
   <meta property="og:site_name" content={seo.siteName} />

   <meta name="twitter:card" content={seo.twitterCard} />
   <meta name="twitter:title" content={seo.title} />
   <meta name="twitter:description" content={seo.description} />
   <meta name="twitter:image" content={seo.image} />

   {seo.productPriceAmount ? (
    <meta property="product:price:amount" content={String(seo.productPriceAmount)} />
   ) : null}
   {seo.productPriceCurrency ? (
    <meta property="product:price:currency" content={seo.productPriceCurrency} />
   ) : null}

    {/* Product JSON-LD structured data */}
    {seo.type === 'product' && product ? (
     <script type="application/ld+json">{JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      description: product.description || seo.description,
      image: seo.image,
      offers: {
       '@type': 'Offer',
       price: seo.productPriceAmount,
       priceCurrency: seo.productPriceCurrency || 'IDR',
       availability: product.is_sold_out ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
       url: seo.url,
      },
      brand: {
       '@type': 'Brand',
       name: 'Puthic Sari',
      },
     })}</script>
     ) : null}

    {seo.type === 'website' && hasApprovedReviews ? (
     <script type="application/ld+json">{JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'LocalBusiness',
      name: 'Puthic Sari',
      url: seo.url,
      image: seo.image,
      aggregateRating: {
       '@type': 'AggregateRating',
       ratingValue: reviewStats.average,
       reviewCount: reviewStats.count,
      },
      review: reviews.slice(0, 6).map((review) => ({
       '@type': 'Review',
       author: {
        '@type': 'Person',
        name: review.name,
       },
       reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
       },
       reviewBody: review.comment,
       datePublished: review.created_at,
      })),
     })}</script>
    ) : null}
 
   </Helmet>

 )
}
