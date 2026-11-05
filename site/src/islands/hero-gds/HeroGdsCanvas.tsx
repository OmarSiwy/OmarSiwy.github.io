import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Group, InstancedMesh, Matrix4, OrthographicCamera, Quaternion, Vector3 } from 'three'

import type { HeroGdsLayer, HeroGdsLayout } from './types'

interface HeroGdsCanvasProps {
	layout: HeroGdsLayout
	isReducedMotion: boolean
}

const INSTANCE_POSITION = new Vector3()
const INSTANCE_SCALE = new Vector3()
const INSTANCE_ROTATION = new Quaternion()
const INSTANCE_MATRIX = new Matrix4()

export function HeroGdsCanvas({ layout, isReducedMotion }: HeroGdsCanvasProps) {
	return (
		<Canvas
			orthographic
			frameloop={isReducedMotion ? 'demand' : 'always'}
			dpr={[1, 1.35]}
			camera={{ position: [230, 185, 255], near: 0.1, far: 1000 }}
			gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
		>
			<ResponsiveCamera layout={layout} />
			<VisibilityLoop isReducedMotion={isReducedMotion} />
			<gridHelper args={[360, 24, '#33424c', '#17242d']} position={[0, -0.7, 0]} />
			<AutoRotatingLayout layout={layout} isReducedMotion={isReducedMotion} />
		</Canvas>
	)
}

function AutoRotatingLayout({ layout, isReducedMotion }: HeroGdsCanvasProps) {
	const groupReference = useRef<Group>(null)
	const layoutCenter = useMemo(() => new Vector3(layout.width / 2, 0, layout.height / 2), [layout])

	useFrame((_, delta) => {
		if (isReducedMotion || !groupReference.current) return
		groupReference.current.rotation.y += Math.min(delta, 0.05) * 0.16
	})

	return (
		<group ref={groupReference} rotation={[0, -0.48, 0]}>
			{layout.layers.map((layer) => (
				<LayerInstances key={layer.id} layer={layer} layoutCenter={layoutCenter} />
			))}
		</group>
	)
}

function LayerInstances({ layer, layoutCenter }: { layer: HeroGdsLayer; layoutCenter: Vector3 }) {
	const meshReference = useRef<InstancedMesh>(null)

	useLayoutEffect(() => {
		const mesh = meshReference.current
		if (!mesh) return

		for (let index = 0; index < layer.rectangles.length; index += 1) {
			const rectangle = layer.rectangles[index]
			if (!rectangle) continue
			const [x, y, width, height] = rectangle
			INSTANCE_POSITION.set(
				x + width / 2 - layoutCenter.x,
				layer.z + layer.thickness / 2,
				-(y + height / 2 - layoutCenter.z),
			)
			INSTANCE_SCALE.set(width, layer.thickness, height)
			INSTANCE_MATRIX.compose(INSTANCE_POSITION, INSTANCE_ROTATION, INSTANCE_SCALE)
			mesh.setMatrixAt(index, INSTANCE_MATRIX)
		}

		mesh.instanceMatrix.needsUpdate = true
	}, [layer, layoutCenter])

	return (
		<instancedMesh
			ref={meshReference}
			args={[undefined, undefined, layer.rectangles.length]}
			frustumCulled={false}
			renderOrder={Math.round(layer.z * 10)}
		>
			<boxGeometry />
			<meshBasicMaterial
				color={layer.color}
				transparent
				opacity={layer.opacity}
				depthWrite={false}
				toneMapped={false}
			/>
		</instancedMesh>
	)
}

function ResponsiveCamera({ layout }: { layout: HeroGdsLayout }) {
	const { camera, size, invalidate } = useThree()

	useLayoutEffect(() => {
		if (!(camera instanceof OrthographicCamera)) return
		const rotatingWidth = Math.hypot(layout.width, layout.height)
		camera.zoom = Math.max(0.75, Math.min(size.width / (rotatingWidth * 1.08), size.height / (layout.height * 1.18)))
		camera.lookAt(0, 0, 0)
		camera.updateProjectionMatrix()
		camera.updateMatrixWorld()
		invalidate()
	}, [camera, invalidate, layout.height, layout.width, size.height, size.width])

	return null
}

function VisibilityLoop({ isReducedMotion }: { isReducedMotion: boolean }) {
	const { gl, invalidate, setFrameloop } = useThree()

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				const shouldAnimate = Boolean(entry?.isIntersecting) && !isReducedMotion
				setFrameloop(shouldAnimate ? 'always' : 'demand')
				if (entry?.isIntersecting) invalidate()
			},
			{ threshold: 0.02 },
		)
		observer.observe(gl.domElement)
		return () => observer.disconnect()
	}, [gl.domElement, invalidate, isReducedMotion, setFrameloop])

	return null
}
