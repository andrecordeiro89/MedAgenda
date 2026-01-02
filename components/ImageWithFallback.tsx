import React, { useState } from 'react'

interface Props {
  baseName: string
  alt: string
  className?: string
  maxWidth?: number
}

export const ImageWithFallback: React.FC<Props> = ({ baseName, alt, className, maxWidth }) => {
  const [srcIndex, setSrcIndex] = useState(0)
  const baseUrl = (import.meta as any).env?.BASE_URL || '/'
  // Buscar assets empacotados pelo Vite (se existirem em /assets)
  const assetModules: Record<string, any> = import.meta.glob('../assets/*.{jpg,png,webp}', { eager: true })
  const assetUrls = Object.entries(assetModules)
    .filter(([path]) => path.includes(`/${baseName}.`))
    .map(([,mod]) => (mod as any)?.default || (mod as any))
  const candidates = [
    ...assetUrls,
    `${baseUrl}images/${baseName}.jpg`,
    `${baseUrl}images/${baseName}.png`,
    `${baseUrl}images/${baseName}.webp`,
    `${baseUrl}${baseName}.jpg`,
    `${baseUrl}${baseName}.png`,
    `${baseUrl}${baseName}.webp`,
    `/images/${baseName}.jpg`,
    `/images/${baseName}.png`,
    `/images/${baseName}.webp`,
    `/${baseName}.jpg`,
    `/${baseName}.png`,
    `/${baseName}.webp`,
  ]

  const handleError = () => {
    if (srcIndex < candidates.length - 1) {
      setSrcIndex(srcIndex + 1)
    } else {
      const svg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
          <rect width="100%" height="100%" fill="white"/>
          <g transform="translate(320,220)">
            <circle r="80" fill="#e5e7eb"/>
            <rect x="-140" y="90" width="280" height="24" rx="12" fill="#e5e7eb"/>
            <rect x="-100" y="-140" width="200" height="12" rx="6" fill="#cbd5e1"/>
            <rect x="-120" y="-120" width="240" height="12" rx="6" fill="#cbd5e1"/>
            <rect x="-80" y="-100" width="160" height="12" rx="6" fill="#cbd5e1"/>
            <text x="0" y="160" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#64748b">Imagem não encontrada</text>
          </g>
        </svg>
      `)
      const dataUrl = `data:image/svg+xml;charset=UTF-8,${svg}`
      const img = new Image()
      img.src = dataUrl
      ;(img as any).onload = () => {}
      ;(img as any).onerror = () => {}
      ;(img as any)
      ;(window as any)
      setTimeout(() => setSrcIndex(candidates.length - 1), 0)
      candidates[candidates.length - 1] = dataUrl
    }
  }

  const style = maxWidth ? { maxWidth: `${maxWidth}px` } : undefined

  return (
    <img
      src={candidates[srcIndex]}
      alt={alt}
      onError={handleError}
      className={className || 'object-contain select-none'}
      style={style}
    />
  )
}

export default ImageWithFallback
