import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import fs from 'fs';
import { resolveObjectURL } from 'buffer';
import { fileURLToPath, pathToFileURL } from 'url';
import { Worker as NodeWorker } from 'worker_threads';

// The loaders rely on browser APIs: self, ProgressEvent, fetch() for the Draco decoder
// files and Web Workers for decoding. Provide minimal Node equivalents so the compressed
// model can be parsed. Textures still fail to decode (no DOM images); geometry is unaffected.
globalThis.self = globalThis;

globalThis.ProgressEvent ??= class extends Event {
  constructor(type, init = {}) {
    super(type);
    Object.assign(this, init);
  }
};

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('file:')) return new Response(fs.readFileSync(fileURLToPath(url)));
  return nativeFetch(input, init);
};

globalThis.Worker = class {
  constructor(url) {
    this.onmessage = null;
    this.ready = resolveObjectURL(url).text().then((source) => {
      const worker = new NodeWorker(
        `const { parentPort } = require('worker_threads');
        globalThis.self = globalThis;
        self.postMessage = (message, transfer) => parentPort.postMessage(message, transfer);
        parentPort.on('message', (data) => self.onmessage({ data }));
        ${source}`,
        { eval: true }
      );
      worker.on('message', (data) => this.onmessage?.({ data }));
      return worker;
    });
  }

  postMessage(message, transfer) {
    this.ready.then((worker) => worker.postMessage(message, transfer));
  }

  terminate() {
    this.ready.then((worker) => worker.terminate());
  }
};

async function testGLB() {
  const filePath = 'public/royal_enfield.glb';
  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    return;
  }

  const stats = fs.statSync(filePath);
  console.log('GLB File Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

  const data = fs.readFileSync(filePath);
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(pathToFileURL('public/draco/').href);

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.parse(
    arrayBuffer,
    '',
    (gltf) => {
      console.log('GLTF Parse Success!');
      const root = gltf.scene;
      
      let meshCount = 0;
      let matCount = 0;
      const materials = new Set();

      root.traverse((node) => {
        if (node.isMesh) {
          meshCount++;
          if (node.material) {
            matCount++;
            if (Array.isArray(node.material)) {
              node.material.forEach(m => materials.add(m));
            } else {
              materials.add(node.material);
            }
          }
        }
      });

      console.log(`Found ${meshCount} meshes and ${materials.size} unique materials.`);

      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      console.log('Bounding Box Min:', box.min);
      console.log('Bounding Box Max:', box.max);
      console.log('Bounding Box Size (X, Y, Z):', size);
      console.log('Bounding Box Center (X, Y, Z):', center);

      // Print sample materials
      let sampleIndex = 0;
      materials.forEach((mat) => {
        if (sampleIndex < 5) {
          console.log(`Material ${mat.name || 'unnamed'}: type=${mat.type}, color=#${mat.color?.getHexString()}, opacity=${mat.opacity}, transparent=${mat.transparent}, visible=${mat.visible}, metalness=${mat.metalness}, roughness=${mat.roughness}`);
          sampleIndex++;
        }
      });
      dracoLoader.dispose();
    },
    (err) => {
      console.error('GLTF Parse Error:', err);
      dracoLoader.dispose();
      process.exitCode = 1;
    }
  );
}

testGLB().catch(console.error);
