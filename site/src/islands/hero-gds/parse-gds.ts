import { parseGDS, RecordType } from 'gdsii'

import type { HeroGdsLayer, HeroGdsLayout } from './types'

interface LayerDefinition extends Omit<HeroGdsLayer, 'rectangles'> {}

interface RawRectangle {
	key: string
	x: number
	y: number
	width: number
	height: number
}

type ElementType = 'boundary' | 'other' | ''

const LAYER_DEFINITIONS: LayerDefinition[] = [
	{ id: 'substrate', name: 'Die boundary', gdsLayer: 235, datatype: 4, color: '#1a2630', z: 0, thickness: 0.8, opacity: 1 },
	{ id: 'nwell', name: 'N-well', gdsLayer: 64, datatype: 20, color: '#3c7d78', z: 1, thickness: 0.45, opacity: 0.42 },
	{ id: 'active', name: 'Active diffusion', gdsLayer: 65, datatype: 20, color: '#79d1a6', z: 1.8, thickness: 0.55, opacity: 0.86 },
	{ id: 'poly', name: 'Polysilicon', gdsLayer: 66, datatype: 20, color: '#ef6574', z: 2.7, thickness: 0.45, opacity: 0.94 },
	{ id: 'metal1', name: 'Metal 1', gdsLayer: 67, datatype: 20, color: '#5ca6ee', z: 4, thickness: 0.65, opacity: 0.9 },
	{ id: 'via1', name: 'Via 1', gdsLayer: 67, datatype: 44, color: '#f1df87', z: 5, thickness: 0.75, opacity: 1 },
	{ id: 'metal2', name: 'Metal 2', gdsLayer: 68, datatype: 20, color: '#ba8bf1', z: 6.2, thickness: 0.8, opacity: 0.88 },
	{ id: 'via2', name: 'Via 2', gdsLayer: 68, datatype: 44, color: '#ffd36e', z: 7.4, thickness: 0.8, opacity: 1 },
	{ id: 'metal3', name: 'Metal 3', gdsLayer: 69, datatype: 20, color: '#e58d52', z: 8.8, thickness: 0.95, opacity: 0.91 },
	{ id: 'metal4', name: 'Metal 4', gdsLayer: 70, datatype: 20, color: '#52d1c4', z: 10.5, thickness: 1.1, opacity: 0.94 },
]

const LAYER_BY_KEY = new Map(
	LAYER_DEFINITIONS.map((layer) => [`${layer.gdsLayer}/${layer.datatype}`, layer]),
)

const HIDDEN_BACKGROUND_LAYERS = new Set(['substrate', 'nwell'])

export function parseGdsLayout(bytes: Uint8Array): HeroGdsLayout {
	let cellName = 'SAR_ADC_8B_SYNTHETIC'
	let currentLayer = 0
	let currentDatatype = 0
	let currentElement: ElementType = ''
	let currentCoordinates: Array<[number, number]> = []
	let micronsPerDatabaseUnit = 0.001
	const rawRectangles: RawRectangle[] = []

	for (const record of parseGDS(bytes)) {
		switch (record.tag) {
			case RecordType.UNITS:
				micronsPerDatabaseUnit = record.data.metersPerUnit * 1_000_000
				break
			case RecordType.STRNAME:
				cellName = record.data
				break
			case RecordType.BOUNDARY:
				currentElement = 'boundary'
				break
			case RecordType.PATH:
			case RecordType.SREF:
			case RecordType.AREF:
			case RecordType.TEXT:
				currentElement = 'other'
				break
			case RecordType.LAYER:
				currentLayer = record.data
				break
			case RecordType.DATATYPE:
				currentDatatype = record.data
				break
			case RecordType.XY:
				currentCoordinates = record.data
				break
			case RecordType.ENDEL:
				if (currentElement === 'boundary') {
					const rectangle = getAxisAlignedBounds(currentCoordinates)
					const key = `${currentLayer}/${currentDatatype}`
					if (rectangle && LAYER_BY_KEY.has(key)) rawRectangles.push({ key, ...rectangle })
				}
				currentElement = ''
				currentCoordinates = []
				break
		}
	}

	if (rawRectangles.length === 0) throw new Error('The GDS did not contain supported boundary geometry')

	const minimumX = Math.min(...rawRectangles.map((rectangle) => rectangle.x))
	const minimumY = Math.min(...rawRectangles.map((rectangle) => rectangle.y))
	const maximumX = Math.max(...rawRectangles.map((rectangle) => rectangle.x + rectangle.width))
	const maximumY = Math.max(...rawRectangles.map((rectangle) => rectangle.y + rectangle.height))
	const rectanglesByLayer = new Map<string, HeroGdsLayer['rectangles']>()

	for (const rectangle of rawRectangles) {
		const layerRectangles = rectanglesByLayer.get(rectangle.key) ?? []
		layerRectangles.push([
			(rectangle.x - minimumX) * micronsPerDatabaseUnit,
			(rectangle.y - minimumY) * micronsPerDatabaseUnit,
			rectangle.width * micronsPerDatabaseUnit,
			rectangle.height * micronsPerDatabaseUnit,
		])
		rectanglesByLayer.set(rectangle.key, layerRectangles)
	}

	const layers = LAYER_DEFINITIONS.filter((definition) => !HIDDEN_BACKGROUND_LAYERS.has(definition.id)).flatMap((definition) => {
		const rectangles = rectanglesByLayer.get(`${definition.gdsLayer}/${definition.datatype}`)
		return rectangles ? [{ ...definition, rectangles }] : []
	})

	return {
		cellName,
		width: (maximumX - minimumX) * micronsPerDatabaseUnit,
		height: (maximumY - minimumY) * micronsPerDatabaseUnit,
		polygonCount: rawRectangles.length,
		layers,
	}
}

function getAxisAlignedBounds(coordinates: Array<[number, number]>) {
	if (coordinates.length < 4) return null
	const xValues = coordinates.map(([x]) => x)
	const yValues = coordinates.map(([, y]) => y)
	const minimumX = Math.min(...xValues)
	const minimumY = Math.min(...yValues)
	const maximumX = Math.max(...xValues)
	const maximumY = Math.max(...yValues)
	if (maximumX <= minimumX || maximumY <= minimumY) return null

	return { x: minimumX, y: minimumY, width: maximumX - minimumX, height: maximumY - minimumY }
}
