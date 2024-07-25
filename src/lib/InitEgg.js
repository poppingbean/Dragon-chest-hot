import { vertexShader, fragmentShader } from './shaders'; // Update the path as per your project structure

// Additional necessary imports
import * as THREE from 'three';

function initThreeJS(container) {
    if (!container) {
        console.error('Container is not defined');
        return;
    }

    // Create a scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.65, 5);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Define the egg geometry
    const eggGeometry = new THREE.SphereGeometry(1, 32, 32).scale(1, 1.4, 1);

    // Create a ShaderMaterial for the egg
    const eggMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            baseTexture: { value: null },
            crackTexture: { value: null },
            crackIntensity: { value: 0.0 },
            alphaMask: { value: null }
        },
        transparent: true
    });

    // Create a canvas for the alpha mask
    const alphaMaskCanvas = document.createElement('canvas');
    alphaMaskCanvas.width = 300; // Set appropriate size
    alphaMaskCanvas.height = 300;
    const alphaMaskCtx = alphaMaskCanvas.getContext('2d', { willReadFrequently: true });
    alphaMaskCtx.fillStyle = 'rgba(0, 0, 0, 1)'; // Fully transparent
    alphaMaskCtx.fillRect(0, 0, alphaMaskCanvas.width, alphaMaskCanvas.height);

    // Create a texture from the canvas
    const alphaMaskTexture = new THREE.CanvasTexture(alphaMaskCanvas);
    alphaMaskTexture.wrapS = alphaMaskTexture.wrapT = THREE.RepeatWrapping;
    eggMaterial.uniforms.alphaMask.value = alphaMaskTexture;

    // Create the egg mesh and add it to the scene
    const egg = new THREE.Mesh(eggGeometry, eggMaterial);
    egg.position.y = -0.4;
    scene.add(egg);

    // Load textures for the egg
    const textureLoader = new THREE.TextureLoader();
    let isInitialized = false;
    textureLoader.load('dskinShellCracked.jpg', function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        eggMaterial.uniforms.baseTexture.value = texture;
        isInitialized = true;
    });
    textureLoader.load('dskinCracked.jpg', function (texture) {
        eggMaterial.uniforms.crackTexture.value = texture;
    });

    // Handle window resize
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onWindowResize);

    // Return the initialized objects for further use
    return { scene, camera, renderer, egg, eggMaterial, alphaMaskCanvas, alphaMaskCtx, alphaMaskTexture, isInitialized };
}

export { initThreeJS };
