// Shaders.js
import * as THREE from 'three';

export function setupShaderMaterial() {
    // Vertex Shader
    const vertexShader = `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    // Fragment Shader for Cracking Effect
    const fragmentShader = `
        uniform sampler2D baseTexture;
        uniform sampler2D crackTexture;
        uniform sampler2D alphaMask;
        varying vec2 vUv;

        void main() {
            vec2 scaledUv = vUv * 1.05;
            vec4 baseColor = texture2D(baseTexture, vUv);
            vec4 crackColor = texture2D(crackTexture, fract(vUv));
            float alpha = texture2D(alphaMask, vUv).r; 
            gl_FragColor = mix(baseColor, crackColor, alpha);
        }
    `;

    let eggMaterial = new THREE.ShaderMaterial({
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

    return { eggMaterial, vertexShader, fragmentShader };
}

export function applyWrapAroundEffect(centerX, centerY, alphaMaskCanvas, alphaMaskCtx) {
    let wrapPoint = centerY % 1;
    if (wrapPoint < 0) wrapPoint += 1;

    let actualY = wrapPoint * alphaMaskCanvas.height;

    applyCrackEffect(centerX, actualY, alphaMaskCanvas, alphaMaskCtx);
}

export function applyCrackEffect(x, y, alphaMaskCanvas, alphaMaskCtx) {
    x = x % alphaMaskCanvas.width;
    if (x < 0) x += alphaMaskCanvas.width;

    let currentOpacity = (alphaMaskCtx.getImageData(x, y, 1, 1).data[3] / 255);
    let newOpacity = Math.min(currentOpacity + 0.25, 1);
    
    alphaMaskCtx.fillStyle = `rgba(255, 255, 255, ${newOpacity})`;
    alphaMaskCtx.fillRect(x, y, 1, 1);
}
