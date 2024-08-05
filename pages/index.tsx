import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { KTXLoader } from 'three-stdlib'
import JSZip from 'jszip'

import suzanne from '../public/suzanne.gltf'
import FileDrop from '../components/fileDrop'
import { isGlb, isGltf, isZip } from '../utils/isExtension'
import { loadFileAsArrayBuffer, stringToArrayBuffer } from '../utils/buffers'

const Loading = () => <p className="text-4xl font-bold">Loading ...</p>

const Result = dynamic(() => import('../components/result'), {
  ssr: false,
  loading: Loading,
})

export default function Home() {
  const [fileName, setFileName] = useState('')
  const [buffers, setBuffers] = useState(null)
  const [scene, setScene] = useState(null)

  const generateScene = async (config) => {
    const rawFileName = fileName
    const nameOfFile = config.pathPrefix && config.pathPrefix !== '' ? `${config.pathPrefix}/${rawFileName}` : rawFileName

    let result
    if (buffers.size !== 1) {
      const loadingManager = new THREE.LoadingManager()
      const dracoloader = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
      const gltfLoader = new GLTFLoader(loadingManager)
        .setDRACOLoader(dracoloader)
        .setMeshoptDecoder(MeshoptDecoder)
        .setKTX2Loader(KTXLoader)

      result = await new Promise((resolve, reject) => {
        const objectURLs = []

        // return objectUrl blob build from the buffer map
        loadingManager.setURLModifier((path) => {
          const buffer = buffers.get(path)

          const url = URL.createObjectURL(new Blob([buffer]))

          objectURLs.push(url)

          return url
        })

        const gltfBuffer = buffers.get(nameOfFile)
        const onLoad = (gltf) => {
          // clean up
          objectURLs.forEach(URL.revokeObjectURL)
          loadingManager.setURLModifier = THREE.DefaultLoadingManager.setURLModifier

          resolve(gltf)
        }
        
        gltfLoader.parse(gltfBuffer, nameOfFile.slice(0, nameOfFile.lastIndexOf('/') + 1), onLoad, reject)
      })
    } else {
      const dracoloader = new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
      const gltfLoader = new GLTFLoader()
        .setDRACOLoader(dracoloader)
        .setMeshoptDecoder(MeshoptDecoder)
        .setKTX2Loader(KTXLoader)

      result = await new Promise((resolve, reject) =>
        gltfLoader.parse(buffers.entries().next().value[1], '', resolve, reject)
      )
    }

    if (!scene) setScene(result.scene)
  }

  // const buffers = useStore((state) => state.buffers)

  const onDrop = useCallback(async (acceptedFiles) => {
    const buffers = new Map()

    // load all files as arrayBuffer in the buffers map
    await Promise.all(
      acceptedFiles.map((file) =>
        loadFileAsArrayBuffer(file).then((buffer) => buffers.set(file.path.replace(/^\//, ''), buffer))
      )
    )

    // unzip files
    for (const [path, buffer] of buffers.entries()) {
      if (isZip(path)) {
        const { files } = await JSZip.loadAsync(buffer)
        for (const [path, file] of Object.entries(files)) {
          const buffer = await file.async('arraybuffer')
          buffers.set(path, buffer)
        }
        buffers.delete(path)
      }
    }

    const filePath = Array.from(buffers.keys()).find((path) => isGlb(path) || isGltf(path))

    setBuffers(buffers)
    setFileName(filePath)
  }, [])

  const useSuzanne = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const arr = await stringToArrayBuffer(suzanne)

    setBuffers(new Map().set('suzanne.gltf', arr))
    setFileName('suzanne.gltf')
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <main className="flex flex-col items-center justify-center flex-1" style={{ height: 'calc(100vh - 56px)' }}>
        {buffers ? <Result scene={scene} generateScene={generateScene} /> : <FileDrop onDrop={onDrop} useSuzanne={useSuzanne} />}
      </main>
    </div>
  )
}
