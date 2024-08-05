import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { create } from 'zustand'
import { KTXLoader } from 'three-stdlib'

const useStore = create((set, get) => ({
  fileName: '',
  buffers: null,
  textOriginalFile: '',
  animations: false,
  scene: null,
  generateScene: async (config) => {
    const { fileName: rawFileName, buffers } = get()
    const fileName = config.pathPrefix && config.pathPrefix !== '' ? `${config.pathPrefix}/${rawFileName}` : rawFileName
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

        const gltfBuffer = buffers.get(fileName)

        const onLoad = (gltf) => {
          // clean up
          objectURLs.forEach(URL.revokeObjectURL)
          loadingManager.setURLModifier = THREE.DefaultLoadingManager.setURLModifier

          resolve(gltf)
        }
        console.log(gltfBuffer)
        gltfLoader.parse(gltfBuffer, fileName.slice(0, fileName.lastIndexOf('/') + 1), onLoad, reject)
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
    // const code = await parse(result, { ...config, fileName, printwidth: 100 })
    // console.log("code: ", code)
    set({
      code: "",
      animations: !!result.animations.length,
    })
    if (!get().scene) set({ scene: result.scene })
  },
}))

export default useStore
