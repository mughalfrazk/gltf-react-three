import React, { useEffect } from 'react'
import Viewer from './viewer'
import useStore from '../utils/store'

const Result = () => {
  const { scene, generateScene } = useStore()

  const config = {
    types: false,
    shadows: true,
    instance: false,
    instanceall: false,
    verbose: false,
    keepnames: false,
    keepgroups: false,
    meta: false,
    precision: 3,
    pathPrefix: '',
  }

  useEffect(() => {
    generateScene(config)
  }, [config])

  return (
    <div className="h-full w-screen p-20 bg-gradient-to-r from-cyan-500 to-blue-500">
      {!scene ? (
        <p className="text-4xl font-bold w-screen h-screen flex justify-center items-center">Loading ...</p>
      ) : (
        <section className="h-full w-full col-span-2 bg-white rounded-lg shadow-lg">
          {scene && (
            <Viewer
              shadows={true}
              contactShadow={true}
              autoRotate={true}
              environment="city"
              preset="rembrandt"
              intensity={1.0}
            />
          )}
        </section>
      )}
    </div>
  )
}

export default Result
