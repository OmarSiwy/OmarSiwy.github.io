export type LayoutRectangle = [
	x: number,
	y: number,
	width: number,
	height: number,
	blockIndex: number,
	signalIndex: number,
]

export interface GdsLayer {
	id: string
	name: string
	gdsLayer: number
	datatype: number
	color: string
	z: number
	thickness: number
	opacity: number
	rectangles: LayoutRectangle[]
}

export interface GdsBlock {
	id: string
	name: string
	shortName: string
	bounds: [x: number, y: number, width: number, height: number]
	description: string
}

export interface GdsSignal {
	id: string
	name: string
	color: string
}

export interface GdsLayout {
	schemaVersion: number
	meta: {
		name: string
		cell: string
		process: string
		units: string
		resolutionNm: number
		architecture: string
		electricalStatus: string
	}
	bounds: [minX: number, minY: number, width: number, height: number]
	layers: GdsLayer[]
	blocks: GdsBlock[]
	signals: GdsSignal[]
	metrics: {
		instances: number
		triangles: number
		layerDrawCalls: number
		unitCapacitors: number
	}
}
