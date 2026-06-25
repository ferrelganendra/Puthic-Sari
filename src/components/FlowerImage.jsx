const gradients = [
 ['#fff7f8', '#cc5d75'],
 ['#f4f7f2', '#6f8a74'],
 ['#fffaf8', '#e47f94'],
 ['#eef4eb', '#728c6b'],
 ['#fdf1f3', '#ad455d'],
]

const getInitials = (value = '') => value
 .split(/\s+/)
 .filter(Boolean)
 .slice(0, 2)
 .map(word => word[0]?.toUpperCase())
 .join('') || 'PS'

const createSvg = (category, name) => {
 const gradient = gradients[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % gradients.length]
 const initials = getInitials(category || name)

 return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
  <defs>
   <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:${gradient[0]}"/>
    <stop offset="100%" style="stop-color:${gradient[1]}"/>
   </linearGradient>
   <filter id="shadow">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.16"/>
   </filter>
  </defs>
  <rect width="600" height="450" fill="url(#g)"/>
  <rect x="70" y="60" width="460" height="330" fill="none" stroke="white" stroke-width="2" opacity="0.55"/>
   <text x="300" y="205" text-anchor="middle" font-family="Figtree, sans-serif" font-size="64" font-weight="600" fill="white" filter="url(#shadow)">${initials}</text>
   <text x="300" y="280" text-anchor="middle" font-family="Figtree, sans-serif" font-size="18" font-weight="500" fill="white" filter="url(#shadow)" opacity="0.92">${name}</text>
 </svg>`
}

const encodeSvg = (svg) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`

export default function FlowerImage({ category, name, className = '', style = {} }) {
  return (
   <img
    src={encodeSvg(createSvg(category, name))}
    alt={name}
    loading="lazy"
    decoding="async"
    className={className}
    style={style}
   />
  )
}

export function getFlowerImageUrl(category, name) {
 return encodeSvg(createSvg(category, name))
}
