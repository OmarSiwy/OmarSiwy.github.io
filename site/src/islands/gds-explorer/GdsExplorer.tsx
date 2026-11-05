import { lazy, Suspense, useEffect, useState } from 'react'

import type { GdsLayout } from './types'
import './gds-explorer.css'

let sceneModulePromise: ReturnType<typeof importSceneModule> | undefined

function importSceneModule() {
	return import('./GdsCanvas')
}

function loadSceneModule() {
	sceneModulePromise ??= importSceneModule()
	return sceneModulePromise
}

const GdsCanvas = lazy(() => loadSceneModule().then((module) => ({ default: module.GdsCanvas })))

export function GdsExplorer() {
	const [hasMounted, setHasMounted] = useState(false)
	const [layout, setLayout] = useState<GdsLayout | null>(null)
	const [errorMessage, setErrorMessage] = useState('')

	useEffect(() => {
		setHasMounted(true)
		const contextProbe = document.createElement('canvas')
		const webGlContext = contextProbe.getContext('webgl2')
		if (!webGlContext) {
			setErrorMessage('WebGL 2 is unavailable in this browser. The static GDS poster remains available.')
			return
		}
		webGlContext.getExtension('WEBGL_lose_context')?.loseContext()

		const abortController = new AbortController()
		void loadSceneModule()

		fetch('/gds/sar-adc-layout.json', { signal: abortController.signal })
			.then((response) => {
				if (!response.ok) throw new Error(`Layout request failed with ${response.status}`)
				return response.json() as Promise<unknown>
			})
			.then((candidateLayout) => {
				if (!isGdsLayout(candidateLayout)) throw new Error('Layout data did not match schema version 1')
				setLayout(candidateLayout)
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === 'AbortError') return
				console.error('Could not load the SAR ADC layout', error)
				setErrorMessage('The interactive geometry could not be loaded. The static poster remains available.')
			})

		return () => abortController.abort()
	}, [])

	if (!hasMounted) return <StaticFallback />
	if (errorMessage) return <StaticFallback message={errorMessage} />
	if (!layout) return <StaticFallback isLoading />

	return (
		<Suspense fallback={<StaticFallback isLoading />}>
			<GdsCanvas layout={layout} />
		</Suspense>
	)
}

interface StaticFallbackProps {
	isLoading?: boolean
	message?: string
}

function StaticFallback({ isLoading = false, message = '' }: StaticFallbackProps) {
	return (
		<figure className="gds-explorer gds-explorer--fallback">
			<img
				src="/gds/sar-adc-poster.svg"
				alt="Top-down synthetic 8-bit SAR ADC layout showing the capacitor DAC, sampling switch, comparator, SAR logic, and reference blocks."
				width="960"
				height="680"
				loading="lazy"
				decoding="async"
			/>
			<figcaption>
				<span>{message || (isLoading ? 'Preparing interactive layers…' : 'Interactive view loads when this section approaches the viewport.')}</span>
				<span>Static GDS poster · no JavaScript required</span>
			</figcaption>
		</figure>
	)
}

function isGdsLayout(candidate: unknown): candidate is GdsLayout {
	if (!candidate || typeof candidate !== 'object') return false
	const layout = candidate as Partial<GdsLayout>
	return (
		layout.schemaVersion === 1 &&
		Array.isArray(layout.bounds) &&
		Array.isArray(layout.layers) &&
		Array.isArray(layout.blocks) &&
		Array.isArray(layout.signals) &&
		typeof layout.metrics?.instances === 'number'
	)
}
