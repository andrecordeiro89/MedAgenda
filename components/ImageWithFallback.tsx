import React, { useState } from 'react'

interface Props {
  baseName: string
  alt: string
  className?: string
  maxWidth?: number
}

export const ImageWithFallback: React.FC<Props> = ({ baseName, alt, className, maxWidth }) => {
  const [srcIndex, setSrcIndex] = useState(0)
  const candidates = [
    `/images/${baseName}.jpg`,
    `/images/${baseName}.png`,
    `/images/${baseName}.webp`,
    `images/${baseName}.jpg`,
    `images/${baseName}.png`,
    `images/${baseName}.webp`,
  ]

  const handleError = () => {
    if (srcIndex < candidates.length - 1) {
      setSrcIndex(srcIndex + 1)
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
