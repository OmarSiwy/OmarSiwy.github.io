export interface HeroGdsLayer {
	id: string
	name: string
	gdsLayer: number
	datatype: number
	color: string
	z: number
	thickness: number
	opacity: number
	rectangles: Array<[x: number, y: number, width: number, height: number]>
}

export interface HeroGdsLayout {
	cellName: string
	width: number
	height: number
	polygonCount: number
	layers: HeroGdsLayer[]
}
