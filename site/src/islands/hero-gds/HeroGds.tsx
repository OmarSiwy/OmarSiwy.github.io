import { useEffect, useState } from 'react'

import { HeroGdsCanvas } from './HeroGdsCanvas'
import { parseGdsLayout } from './parse-gds'
import type { HeroGdsLayout } from './types'
import './hero-gds.css'

export function HeroGds() {
	const [layout, setLayout] = useState<HeroGdsLayout | null>(null)
	const [errorMessage, setErrorMessage] = useState('')
	const [isReducedMotion, setIsReducedMotion] = useState(false)

	useEffect(() => {
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
		setIsReducedMotion(motionQuery.matches)
		const updateMotionPreference = (event: MediaQueryListEvent) => setIsReducedMotion(event.matches)
		motionQuery.addEventListener('change', updateMotionPreference)

		const contextProbe = document.createElement('canvas')
		const webGlContext = contextProbe.getContext('webgl2')
		if (!webGlContext) {
			setErrorMessage('WebGL 2 unavailable.')
			return () => motionQuery.removeEventListener('change', updateMotionPreference)
		}
		webGlContext.getExtension('WEBGL_lose_context')?.loseContext()

		const abortController = new AbortController()
		void fetch('/gds/sar-adc.gds', { signal: abortController.signal })
			.then((response) => {
				if (!response.ok) throw new Error(`GDS request failed with ${response.status}`)
				return response.arrayBuffer()
			})
			.then((buffer) => parseGdsLayout(new Uint8Array(buffer)))
			.then((parsedLayout) => setLayout(parsedLayout))
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === 'AbortError') return
				console.error('Could not prepare the SAR ADC hero', error)
				setErrorMessage('Live GDS unavailable.')
			})

		return () => {
			abortController.abort()
			motionQuery.removeEventListener('change', updateMotionPreference)
		}
	}, [])

	return (
		<figure className="hero-gds">
			<div className="hero-gds__viewport">
				{layout ? (
					<HeroGdsCanvas layout={layout} isReducedMotion={isReducedMotion} />
				) : (
					<LoadingGds message={errorMessage} />
				)}
			</div>
			<figcaption>
				<span><i aria-hidden="true" /> {errorMessage || 'Live GDSII · parsed locally'}</span>
				<span>{layout ? `${layout.polygonCount.toLocaleString()} polygons · ${layout.layers.length} layers` : 'SAR ADC · 8 bit'}</span>
			</figcaption>
		</figure>
	)
}

function LoadingGds({ message = '' }: { message?: string }) {
	return (
		<div className="hero-gds__loading" role="img" aria-label="Loading the live synthetic 8-bit SAR ADC GDS layout">
			<span>{message || 'Loading GDSII…'}</span>
		</div>
	)
}
