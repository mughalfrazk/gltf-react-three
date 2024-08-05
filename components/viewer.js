/* eslint-disable react/no-unknown-property */
import React, { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage } from '@react-three/drei'

export default function Viewer({ scene, shadows, contactShadow, autoRotate, environment, preset, intensity }) {
  const ref = useRef()
  useLayoutEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = obj.receiveShadow = shadows
        obj.material.envMapIntensity = 0.8
      }
    })
  }, [scene, shadows])

  return (
    <Canvas gl={{ preserveDrawingBuffer: true }} shadows dpr={[1, 1.5]} camera={{ position: [0, 0, 150], fov: 50 }}>
      <ambientLight intensity={0.25} />
      <Suspense fallback={null}>
        <Stage
          controls={ref}
          preset={preset}
          intensity={intensity}
          contactShadow={contactShadow}
          shadows
          adjustCamera
          environment={environment}>
          <primitive object={scene} />
        </Stage>
      </Suspense>
      <OrbitControls ref={ref} autoRotate={autoRotate} />
    </Canvas>
  )
}
