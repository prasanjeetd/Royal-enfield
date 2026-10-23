import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import fs from 'fs';

async function testGLB() {
  const filePath = 'public/ROYAL ENFIELD glTF.glb';
  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    return;
  }

  const stats = fs.statSync(filePath);
  console.log('GLB File Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');

  const data = fs.readFileSync(filePath);
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

  const loader = new GLTFLoader();
  
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
    },
    (err) => {
      console.error('GLTF Parse Error:', err);
    }
  );
}

testGLB().catch(console.error);
