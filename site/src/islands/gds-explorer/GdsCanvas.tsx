import { Canvas, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
	Color,
	InstancedMesh,
	Matrix4,
	OrthographicCamera,
	Quaternion,
	Vector3,
} from 'three'

import type { GdsBlock, GdsLayer, GdsLayout } from './types'

interface LayerInstancesProps {
	layer: GdsLayer
	layerOrder: number
	isExploded: boolean
	isVisible: boolean
	selectedBlockIndex: number
	layoutCenter: Vector3
}

interface BlockHitAreasProps {
	blocks: GdsBlock[]
	selectedBlockIndex: number
	onSelectBlock: (index: number) => void
	layoutCenter: Vector3
}

type CameraPreset = 'isometric' | 'top'

interface OrbitState {
	theta: number
	phi: number
	radius: number
	pointerId: number | null
	pointerX: number
	pointerY: number
}

const INSTANCE_POSITION = new Vector3()
const INSTANCE_SCALE = new Vector3()
const INSTANCE_ROTATION = new Quaternion()
const INSTANCE_MATRIX = new Matrix4()

export function GdsCanvas({ layout }: { layout: GdsLayout }) {
	const layoutCenter = useMemo(
		() => new Vector3(layout.bounds[2] / 2, 0, layout.bounds[3] / 2),
		[layout.bounds],
	)
	const [isExploded, setIsExploded] = useState(false)
	const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric')
	const [selectedBlockId, setSelectedBlockId] = useState(layout.blocks[0]?.id ?? '')
	const [visibleLayerIds, setVisibleLayerIds] = useState(
		() => new Set(layout.layers.map((layer) => layer.id)),
	)
	const selectedBlockIndex = layout.blocks.findIndex((block) => block.id === selectedBlockId)
	const selectedBlock = layout.blocks[selectedBlockIndex] ?? layout.blocks[0]

	useEffect(() => {
		return () => {
			document.body.style.cursor = ''
		}
	}, [])

	function toggleLayer(layerId: string) {
		setVisibleLayerIds((currentLayerIds) => {
			const nextLayerIds = new Set(currentLayerIds)
			if (nextLayerIds.has(layerId)) nextLayerIds.delete(layerId)
			else nextLayerIds.add(layerId)
			return nextLayerIds
		})
	}

	return (
		<section className="gds-explorer" aria-label="Interactive SAR ADC GDS explorer">
			<header className="gds-explorer__toolbar">
				<div>
					<span className="gds-explorer__status-dot" aria-hidden="true" />
					<span>GDSII / SAR_ADC_8B_SYNTHETIC</span>
				</div>
				<div className="gds-explorer__view-controls" aria-label="View controls">
					<button
						type="button"
						className={cameraPreset === 'isometric' ? 'active' : ''}
						aria-pressed={cameraPreset === 'isometric'}
						onClick={() => setCameraPreset('isometric')}
					>
						ISO
					</button>
					<button
						type="button"
						className={cameraPreset === 'top' ? 'active' : ''}
						aria-pressed={cameraPreset === 'top'}
						onClick={() => setCameraPreset('top')}
					>
						TOP
					</button>
					<button
						type="button"
						className={isExploded ? 'active' : ''}
						aria-pressed={isExploded}
						onClick={() => setIsExploded((currentValue) => !currentValue)}
					>
						EXPLODE
					</button>
				</div>
			</header>

			<div className="gds-explorer__workspace">
				<div className="gds-explorer__viewport">
					<Canvas
						orthographic
						frameloop="demand"
						dpr={[1, 1.5]}
						camera={{ position: [190, 170, 210], zoom: 2.45, near: 0.1, far: 1200 }}
						gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
					>
						<color attach="background" args={['#071016']} />
						<ambientLight intensity={1.25} />
						<directionalLight position={[80, 190, 120]} intensity={2.4} />
						<CameraController preset={cameraPreset} />
						<gridHelper
							args={[320, 32, '#263844', '#14232d']}
							position={[0, -0.6, 0]}
						/>
						{layout.layers.map((layer, layerOrder) => (
							<LayerInstances
								key={layer.id}
								layer={layer}
								layerOrder={layerOrder}
								isExploded={isExploded}
								isVisible={visibleLayerIds.has(layer.id)}
								selectedBlockIndex={selectedBlockIndex}
								layoutCenter={layoutCenter}
							/>
						))}
						<BlockHitAreas
							blocks={layout.blocks}
							selectedBlockIndex={selectedBlockIndex}
							layoutCenter={layoutCenter}
							onSelectBlock={(index) => setSelectedBlockId(layout.blocks[index]?.id ?? '')}
						/>
					</Canvas>
					<div className="gds-explorer__viewport-help">Drag to orbit · scroll to zoom · select a block</div>
				</div>

				<aside className="gds-explorer__inspector" aria-label="Layout inspector">
					<div className="gds-explorer__inspector-section">
						<p className="gds-explorer__label">Functional blocks</p>
						<div className="gds-explorer__block-list">
							{layout.blocks.map((block) => (
								<button
									key={block.id}
									type="button"
									className={block.id === selectedBlockId ? 'active' : ''}
									aria-pressed={block.id === selectedBlockId}
									onClick={() => setSelectedBlockId(block.id)}
								>
									<span>{block.shortName}</span>
									<strong>{block.name}</strong>
								</button>
							))}
						</div>
					</div>

					<div className="gds-explorer__selection" aria-live="polite">
						<p className="gds-explorer__label">Selected block</p>
						<strong>{selectedBlock?.name}</strong>
						<p>{selectedBlock?.description}</p>
					</div>
				</aside>
			</div>

			<details className="gds-explorer__layers">
				<summary>Process layers ({visibleLayerIds.size}/{layout.layers.length})</summary>
				<div>
					{layout.layers.map((layer) => (
						<label key={layer.id}>
							<input
								type="checkbox"
								checked={visibleLayerIds.has(layer.id)}
								onChange={() => toggleLayer(layer.id)}
							/>
							<i style={{ backgroundColor: layer.color }} aria-hidden="true" />
							<span>{layer.name}</span>
							<small>{layer.gdsLayer}/{layer.datatype}</small>
						</label>
					))}
				</div>
			</details>

			<footer className="gds-explorer__metrics">
				<span>{layout.metrics.instances.toLocaleString()} instances</span>
				<span>{layout.metrics.triangles.toLocaleString()} triangles</span>
				<span>{layout.metrics.layerDrawCalls} layer draw calls</span>
				<span>render on demand</span>
			</footer>
		</section>
	)
}

function LayerInstances({
	layer,
	layerOrder,
	isExploded,
	isVisible,
	selectedBlockIndex,
	layoutCenter,
}: LayerInstancesProps) {
	const meshReference = useRef<InstancedMesh>(null)
	const invalidate = useThree((state) => state.invalidate)
	const baseColor = useMemo(() => new Color(layer.color), [layer.color])
	const highlightColor = useMemo(() => new Color('#fff0b4'), [])

	useLayoutEffect(() => {
		const mesh = meshReference.current
		if (!mesh) return

		const layerHeight = layer.z + layer.thickness / 2 + (isExploded ? layerOrder * 3.4 : 0)
		for (let index = 0; index < layer.rectangles.length; index += 1) {
			const rectangle = layer.rectangles[index]
			if (!rectangle) continue
			const [x, y, width, height, blockIndex] = rectangle
			INSTANCE_POSITION.set(
				x + width / 2 - layoutCenter.x,
				layerHeight,
				-(y + height / 2 - layoutCenter.z),
			)
			INSTANCE_SCALE.set(width, layer.thickness, height)
			INSTANCE_MATRIX.compose(INSTANCE_POSITION, INSTANCE_ROTATION, INSTANCE_SCALE)
			mesh.setMatrixAt(index, INSTANCE_MATRIX)
			mesh.setColorAt(
				index,
				selectedBlockIndex >= 0 && blockIndex === selectedBlockIndex ? highlightColor : baseColor,
			)
		}

		mesh.instanceMatrix.needsUpdate = true
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
		invalidate()
	}, [baseColor, highlightColor, invalidate, isExploded, layer, layerOrder, layoutCenter, selectedBlockIndex])

	return (
		<instancedMesh
			ref={meshReference}
			args={[undefined, undefined, layer.rectangles.length]}
			visible={isVisible}
			frustumCulled={false}
		>
			<boxGeometry />
			<meshStandardMaterial
				vertexColors
				transparent={layer.opacity < 1}
				opacity={layer.opacity}
				depthWrite={layer.opacity >= 0.75}
				roughness={0.56}
				metalness={layer.id.startsWith('metal') ? 0.22 : 0.04}
			/>
		</instancedMesh>
	)
}

function BlockHitAreas({ blocks, selectedBlockIndex, onSelectBlock, layoutCenter }: BlockHitAreasProps) {
	return blocks.map((block, index) => {
		const [x, y, width, height] = block.bounds
		const isSelected = index === selectedBlockIndex
		return (
			<mesh
				key={block.id}
				position={[
					x + width / 2 - layoutCenter.x,
					13.2,
					-(y + height / 2 - layoutCenter.z),
				]}
				scale={[width, 0.65, height]}
				onClick={(event) => {
					event.stopPropagation()
					onSelectBlock(index)
				}}
				onPointerOver={(event) => {
					event.stopPropagation()
					document.body.style.cursor = 'pointer'
				}}
				onPointerOut={() => {
					document.body.style.cursor = ''
				}}
			>
				<boxGeometry />
				<meshBasicMaterial
					color={isSelected ? '#fff0b4' : '#ffffff'}
					transparent
					opacity={isSelected ? 0.13 : 0}
					depthWrite={false}
				/>
			</mesh>
		)
	})
}

function CameraController({ preset }: { preset: CameraPreset }) {
	const { camera, gl, invalidate } = useThree()
	const orbitReference = useRef<OrbitState>({
		theta: Math.PI * 0.23,
		phi: Math.PI * 0.32,
		radius: 330,
		pointerId: null,
		pointerX: 0,
		pointerY: 0,
	})

	const applyCamera = useCallback(() => {
		const orbit = orbitReference.current
		const horizontalRadius = orbit.radius * Math.sin(orbit.phi)
		camera.position.set(
			horizontalRadius * Math.cos(orbit.theta),
			orbit.radius * Math.cos(orbit.phi),
			horizontalRadius * Math.sin(orbit.theta),
		)
		camera.lookAt(0, 0, 0)
		camera.updateMatrixWorld()
		invalidate()
	}, [camera, invalidate])

	useEffect(() => {
		const canvas = gl.domElement

		function handlePointerDown(event: PointerEvent) {
			if (event.pointerType === 'mouse' && event.button !== 0) return
			const orbit = orbitReference.current
			orbit.pointerId = event.pointerId
			orbit.pointerX = event.clientX
			orbit.pointerY = event.clientY
			canvas.setPointerCapture(event.pointerId)
		}

		function handlePointerMove(event: PointerEvent) {
			const orbit = orbitReference.current
			if (orbit.pointerId !== event.pointerId) return

			const deltaX = event.clientX - orbit.pointerX
			const deltaY = event.clientY - orbit.pointerY
			orbit.pointerX = event.clientX
			orbit.pointerY = event.clientY
			orbit.theta -= deltaX * 0.008
			orbit.phi = Math.min(Math.PI * 0.48, Math.max(0.055, orbit.phi - deltaY * 0.006))
			applyCamera()
		}

		function handlePointerEnd(event: PointerEvent) {
			const orbit = orbitReference.current
			if (orbit.pointerId !== event.pointerId) return
			orbit.pointerId = null
			if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
		}

		function handleWheel(event: WheelEvent) {
			if (!(camera instanceof OrthographicCamera)) return
			event.preventDefault()
			camera.zoom = Math.min(7, Math.max(1.35, camera.zoom * Math.exp(-event.deltaY * 0.0012)))
			camera.updateProjectionMatrix()
			invalidate()
		}

		canvas.addEventListener('pointerdown', handlePointerDown)
		canvas.addEventListener('pointermove', handlePointerMove)
		canvas.addEventListener('pointerup', handlePointerEnd)
		canvas.addEventListener('pointercancel', handlePointerEnd)
		canvas.addEventListener('wheel', handleWheel, { passive: false })

		return () => {
			canvas.removeEventListener('pointerdown', handlePointerDown)
			canvas.removeEventListener('pointermove', handlePointerMove)
			canvas.removeEventListener('pointerup', handlePointerEnd)
			canvas.removeEventListener('pointercancel', handlePointerEnd)
			canvas.removeEventListener('wheel', handleWheel)
		}
	}, [applyCamera, camera, gl.domElement, invalidate])

	useEffect(() => {
		const orbit = orbitReference.current
		if (preset === 'top') {
			orbit.theta = Math.PI / 2
			orbit.phi = 0.0001
			orbit.radius = 280
		} else {
			orbit.theta = Math.PI * 0.23
			orbit.phi = Math.PI * 0.32
			orbit.radius = 330
		}

		if (camera instanceof OrthographicCamera) {
			camera.zoom = preset === 'top' ? 3.05 : 2.45
			camera.updateProjectionMatrix()
		}
		applyCamera()
	}, [applyCamera, camera, preset])

	return null
}
