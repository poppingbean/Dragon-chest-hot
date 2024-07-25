<script>
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import * as THREE from 'three';
    import { scoreTexture, hintActive as hintActiveStore, brightestPixel } from '../store.js';
    // import Background from '../background.svelte';

    /**
     * @type {HTMLElement | null}
     */
    let container;
    /**
     * @type {{ children: any; add: (arg0: any) => void; }}
     */
    /**
     * @type {{ position: { z: number; set: (arg0: number, arg1: number, arg2: number) => void; }; aspect: number; updateProjectionMatrix: () => void; }}
     */
    /**
     * @type {{ domElement: { style: { cursor: string; }; addEventListener: (arg0: string, arg1: { (event: any): void; (event: any): void; }) => void; removeEventListener: (arg0: string, arg1: { (event: any): void; (event: any): void; }) => void; }; setSize: (arg0: any, arg1: any) => void; setClearColor: (arg0: number, arg1: number) => void; render: (arg0: any, arg1: any) => void; }}
     */
    let scene, camera, renderer;

    /**
     * @type {{ rotation: { clone: () => any; x: any; y: number; z: any; copy: (arg0: any) => void; }; material: { needsUpdate: boolean; }; position: { y: number; }; }}
     */
    /**
     * @type {{ uniforms: { alphaMask: { value: any; }; baseTexture: { value: any; }; crackTexture: { value: any; }; }; }}
     */
    let egg, eggMaterial;
    /**
     * @type {number | undefined}
     */
    let requestId;
    let isInitialized = false;
    let crackTexture; 
    /**
     * @type {CanvasImageSource}
     */
    /**
     * @type {CanvasRenderingContext2D | null}
     */
    let alphaMaskCanvas, alphaMaskCtx;
    /**
     * @type {HTMLElement | null}
     */
    /**
     * @type {HTMLElement | null}
     */
    let zoomInButton, zoomOutButton;
    /**
     * @type {{ needsUpdate: boolean; wrapS: any; wrapT: any; }}
     */
     export let AlphaMaskTexture;
    let hintActive = false;
    let scoreTextureCopy;
    let currentBrightestPixel = { x: null, y: null };
    /**
     * @type {{ uniforms: { baseTexture: { value: any; }; }; }}
     */
    let originalMaterial;

    let updateInterval = setInterval(() => {}, 1000 / 30);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const minDistance = 1; // minimum distance of camera from egg in meters
    const maxDistance = 12; // maximum distance of camera from egg in meters
    const zoomSpeed = 0.1; // speed of zooming

    const zoomInSpeed = 0.1; // speed of zooming in
    const zoomOutSpeed = zoomInSpeed / 2; // speed of zooming out, half of zooming in
    // Calculate the default zoom level (69%)
    const defaultZoomLevel = 1 + (12 - 1) * (1 - 0.69);

    // Orbit parameters
    const orbitRadius = 2; // Adjust as needed, slightly more than half the egg's size
    const orbitSpeed = 0.01; // Speed of the orbit
    let orbitAngle = 0; // Current angle of the orbit

    let initialSliderValue = 20 - (defaultZoomLevel - 1); // Initial value, corresponding to the camera's initial z-position
    let sliderValue = initialSliderValue; // Reactive value for the slider
  
    // Function to update the camera position and slider value
    /**
     * @param {number} zoomLevel
     */
    function updateCameraZoom(zoomLevel) {
        camera.position.z = zoomLevel;
        // Recalculate sliderValue based on the new zoom level
        sliderValue = Math.round((1 - (zoomLevel - minDistance) / (maxDistance - minDistance)) * 20);
    }

    function zoomIn() {
        // Calculate new zoom level
        let newZoom = Math.max(camera.position.z - zoomInSpeed, minDistance);
        updateCameraZoom(newZoom);
    }

    function zoomOut() {
        // Calculate new zoom level
        let newZoom = Math.min(camera.position.z + zoomOutSpeed, maxDistance);
        updateCameraZoom(newZoom);
    }
    // Call this function when the slider input changes
    /**
     * @param {{ target: { value: any; }; }} event
     */
    function onSliderChange(event) {
        const sliderValue = event.target.value; // The current value of the slider
        // Convert the slider value to a corresponding camera zoom level
        const zoomLevel = (1 - sliderValue / 25) * (maxDistance - minDistance) + minDistance;
        updateCameraZoom(zoomLevel);
    }

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
            vec4 crackColor = texture2D(crackTexture, fract(vUv)); // Use the fract function to wrap the texture
            float alpha = texture2D(alphaMask, vUv).r; 
            gl_FragColor = mix(baseColor, crackColor, alpha);
        }
    `;

    // ShaderMaterial for the egg
    eggMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            baseTexture: { value: null },
            crackTexture: { value: null },
            crackIntensity: { value: 0.0 },
            alphaMask: { value: null }
        },
        transparent: true
    });

    // Hint fragmentShader
    const hintFragmentShader = `
        uniform sampler2D baseTexture;
        uniform sampler2D alphaMask;
        varying vec2 vUv;

        void main() {
            vec4 maskColor = texture2D(alphaMask, vUv);
            float alpha = maskColor.r;
            vec3 color = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), alpha); // Red to green transition
            gl_FragColor = vec4(color, 1.0);
        }
    `;
    
    // Function to check if the mouse is over the egg
    /**
     * @param {{ clientX: number; clientY: number; }} event
     */
    function checkEggHover(event) {
        // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children);

        // Check if the egg is intersected
        if (intersects.length > 0 && intersects[0].object === egg) {
            renderer.domElement.style.cursor = 'url(cursor2.png), auto'; // Change cursor when over the egg
        } else {
            renderer.domElement.style.cursor = 'auto'; // Default cursor otherwise
        }
    }

    /**
     * @param {number} centerX
     * @param {number} centerY
     */
    function applyWrapAroundEffect(centerX, centerY) {
        // Convert centerY to a range between 0 and 1, assuming centerY is in pixel units
        centerY = centerY / alphaMaskCanvas.height;

        // Calculate the wrap point which is at the very top or bottom edge of the texture
        let wrapPoint = centerY % 1;
        if (wrapPoint < 0) wrapPoint += 1.05;  // Ensure wrapPoint is always positive

        // Now calculate the actual Y position on the alpha mask canvas
        let actualY = wrapPoint * alphaMaskCanvas.height;
        let currentOpacity = 0;
        /**
         * @param {number} x
         * @param {number} y
         */
        function applyCrackEffect(x, y) {
            // Ensure x is within the canvas bounds
            x = x % alphaMaskCanvas.width;
            if (x < 0) x += alphaMaskCanvas.width;

            let currentOpacity = (alphaMaskCtx.getImageData(x, y, 1, 1).data[3] / 255);
            let newOpacity = Math.min(currentOpacity + 0.25, 1);
            
            alphaMaskCtx.fillStyle = `rgba(255, 255, 255, ${newOpacity})`;
            alphaMaskCtx.fillRect(x, y, 1, 1);
            currentOpacity = (alphaMaskCtx.getImageData(x, y, 1, 1).data[3] / 255);
        }

        // Apply the crack effect to the normalized Y position
        applyCrackEffect(centerX, actualY);

        // If the wrap point is near the top or bottom edge, apply the effect to the opposite edge
        let edgeThreshold = 2 / alphaMaskCanvas.height;  // Threshold for wrapping
        if (wrapPoint < edgeThreshold) {
            // Near the bottom edge, wrap to the top
            applyCrackEffect(centerX, alphaMaskCanvas.height - actualY);
        } else if (wrapPoint > (1 - edgeThreshold)) {
            // Near the top edge, wrap to the bottom
            applyCrackEffect(centerX, alphaMaskCanvas.height - actualY);
        }
    }

    function updateScoreTexture() {
        const scoreCanvas = document.createElement('canvas');
        scoreCanvas.width = alphaMaskCanvas.width;
        scoreCanvas.height = alphaMaskCanvas.height;
        const scoreCtx = scoreCanvas.getContext('2d');

        // Copy the current state of the alpha mask to the score canvas
        scoreCtx.drawImage(alphaMaskCanvas, 0, 0);

        // Create a texture from the score canvas
        const scoreTextureCopy = new THREE.CanvasTexture(scoreCanvas);
        scoreTextureCopy.needsUpdate = true;

        // Update the store with the new texture
        scoreTexture.set(scoreTextureCopy);
    }

    /**
     * @param {{ x: number; y: number; }} uv
     */
    function handleEggCrack(uv) {
        // Increase crack intensity unifor uncomment out this line below and comment out the rest.
        // eggMaterial.uniforms.crackIntensity.value = Math.min(1, eggMaterial.uniforms.crackIntensity.value + 0.01);
        //  ************
        // Convert UV coordinates to canvas coordinates
        let x = uv.x * alphaMaskCanvas.width;
        let y = (1 - uv.y) * alphaMaskCanvas.height;
        
        applyWrapAroundEffect(x, y);

        // Determine the current opacity
        let imageData = alphaMaskCtx.getImageData(x, y, 1, 1);
        let currentOpacity = imageData.data[3] / 255;

        // Calculate new opacity
        let newOpacity = Math.min(currentOpacity + 0.33, 1); // Increase by 33%, but cap at 100%


        // Draw on the mask to reveal a portion
        alphaMaskCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Fully opaque
        alphaMaskCtx.beginPath();
        alphaMaskCtx.arc(x, y, 4.20, 2, 0 * Math.PI); // Adjust size and shape as needed
        alphaMaskCtx.fill();

        // Update the texture
        AlphaMaskTexture.needsUpdate = true;
        updateScoreTexture();
    }

    /**
     * @param {any} event
     */
    function onEggKeyDown(event) {
        // Trigger the crack effect for specific keys, e.g., Enter or Space
        onEggClick(event);
    }

    /**
     * @param {{ preventDefault: () => void; clientX: number; clientY: number; }} event
     */
    function onEggClick(event) {
        event.preventDefault();

        // Calculate mouse position relative to the container
        const bounds = container.getBoundingClientRect();
        mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

        console.log('onEggClick UV', { x: mouse.x, y: mouse.y });

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object === egg) {
                const uv = intersects[i].uv; 
                handleEggCrack(uv);
                animateShake(); 
                break;
            }
        }
    }

    function animateShake() {
        const maxShakeIntensity = 0.08; // Reduced maximum intensity for a smoother shake
        const shakeDuration = 500; // Increased duration for a slower shake
        const shakeFrequency = 5; // Lower frequency for a smoother shake

        /**
         * @type {number | null}
         */
        let startTime = null;
        const initialRotation = egg.rotation.clone(); // Save initial rotation

        let shake = (/** @type {number} */ timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;
            const progress = elapsedTime / shakeDuration;
            const randomIntensity = Math.random() * maxShakeIntensity;
            
            // Smooth transition using sine function
            const shakeFactor = Math.sin(progress * Math.PI) * Math.sin(elapsedTime * 0.001 * shakeFrequency) * randomIntensity;

            // Apply shake in X, Y, and Z directions
            egg.rotation.x = initialRotation.x + shakeFactor * (Math.random() > 0.3 ? 1 : -1);
            egg.rotation.y = initialRotation.y + shakeFactor * (Math.random() > 0.3 ? 1 : -1);
            egg.rotation.z = initialRotation.z + shakeFactor * (Math.random() > 0.3 ? 1 : -1);

            if (elapsedTime < shakeDuration) {
                requestAnimationFrame(shake);
            } else {
                egg.rotation.copy(initialRotation); // Reset to initial rotation after shake
            }
        };

        requestAnimationFrame(shake);
    }  

    /**
     * @param {boolean} isHintActive
     */
    function toggleHintVisibility(isHintActive) {
        if (isHintActive) {
            // Use the hint shader material
            const hintMaterial = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: hintFragmentShader,
                uniforms: {
                    baseTexture: { value: originalMaterial.uniforms.baseTexture.value },
                    alphaMask: { value: AlphaMaskTexture }
                },
                transparent: true
            });
            egg.material = hintMaterial;
        } else {
            // Revert to the original material
            egg.material = originalMaterial;
        }

        egg.material.needsUpdate = true;
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    function get3DPositionFromTexture(x, y) {
        const textureWidth = 512; // Replace with your texture's actual width
        const textureHeight = 512; // Replace with your texture's actual height
        
        // Normalize texture coordinates to [0, 1]
        const normalizedX = x / textureWidth; // Assuming textureWidth is the width of the texture
        const normalizedY = y / textureHeight; // Assuming textureHeight is the height of the texture

        // Convert normalized texture coordinates to spherical coordinates
        const theta = 2 * Math.PI * normalizedX; // Horizontal angle
        const phi = Math.PI * normalizedY; // Vertical angle

        // Convert spherical coordinates to Cartesian coordinates for a unit sphere
        const unitX = Math.sin(phi) * Math.cos(theta);
        const unitY = Math.sin(phi) * Math.sin(theta);
        const unitZ = Math.cos(phi);

        // Adjust for egg's elongation along the Y-axis
        const elongatedY = unitY * 1.4; // The Y coordinate is scaled by 1.4

        // Create a Vector3 to represent the 3D position on the egg's surface
        const position = new THREE.Vector3(unitX, elongatedY, unitZ);

        // Since the egg is centered at the origin, no additional translation is needed
        return position;
    }

    // Global variable to track the last brightest point
    let lastBrightestPixel = { x: null, y: null };
      
    /**
     * @type {string | number | NodeJS.Timeout | undefined}
     */
    let highlightUpdateInterval; // Variable to store the interval ID

    function startHighlightUpdater() {
        // Clear any existing interval to avoid duplicates
        if (highlightUpdateInterval) {
            clearInterval(highlightUpdateInterval);
        }
        // Start a new interval
        highlightUpdateInterval = setInterval(() => {
            if (currentBrightestPixel.x !== null && currentBrightestPixel.y !== null) {
                updateHighlightLineAndBall(currentBrightestPixel);
            }
        }, 1000 / 30); // Update 30 times per second
    }

    function stopHighlightUpdater() {
        if (highlightUpdateInterval) {
            clearInterval(highlightUpdateInterval);
        }
    }

    function initThreeJS() {
        if (!container) {
            console.error('Container is not defined');
            return;
        }

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0.65, 5);
    
        // Enable alpha transparency on the renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Set clear color to black with desired opacity (e.g., 0.5)
        renderer.setClearColor(0x000000, 0.5);
    
        container.appendChild(renderer.domElement);
   

        // Egg Geometry
        const eggGeometry = new THREE.SphereGeometry(1, 32, 32).scale(1, 1.4, 1);

        // ShaderMaterial for the egg
        eggMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                baseTexture: { value: null },
                crackTexture: { value: null },
                crackIntensity: { value: 0.0 },
                alphaMask: { value: null } // Added uniform for alpha mask
            },
            transparent: true
        });

        // Create a canvas for the alpha mask
        alphaMaskCanvas = document.createElement('canvas');
        alphaMaskCanvas.width = 64; // Set appropriate size
        alphaMaskCanvas.height = 64;
        alphaMaskCtx = alphaMaskCanvas.getContext('2d', { willReadFrequently: true });

        // Initialize the mask as fully transparent
        alphaMaskCtx.fillStyle = 'rgba(0, 0, 0, 1)'; // Fully transparent
        alphaMaskCtx.fillRect(0, 0, alphaMaskCanvas.width, alphaMaskCanvas.height);

        // Create a texture from the canvas
        AlphaMaskTexture = new THREE.CanvasTexture(alphaMaskCanvas);
        AlphaMaskTexture.wrapS = AlphaMaskTexture.wrapT = THREE.RepeatWrapping;

        // Add the mask texture to the shader material
        eggMaterial.uniforms.alphaMask.value = AlphaMaskTexture;

        // Create and add egg mesh to the scene
        egg = new THREE.Mesh(eggGeometry, eggMaterial);
        egg.position.y = 0;
        scene.add(egg);
        originalMaterial = eggMaterial;

        // Load textures for the egg
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('dskinShellCracked.jpg', function (/** @type {{ wrapS: any; wrapT: any; }} */ texture) {
            texture.wrapS = THREE.RepeatWrapping; 
            texture.wrapT = THREE.RepeatWrapping;
            eggMaterial.uniforms.baseTexture.value = texture;
            isInitialized = true;
        });

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
        scene.add(ambientLight);

        textureLoader.load('dskinCracked.jpg', function (/** @type {any} */ texture) {
            eggMaterial.uniforms.crackTexture.value = texture;
        });
        updateCameraZoom(defaultZoomLevel);
        window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    const eggRotationSpeed = 0.0069420; // Speed of the egg's rotation
    
    // Modify the animate function to include the orbit logic
    function animate() {
        requestId = requestAnimationFrame(animate);

        if (!isInitialized || !egg || !egg.material) {
            return;
        }

        // Rotate the egg
        egg.rotation.y += eggRotationSpeed;

        renderer.render(scene, camera);
    }

    onMount(() => {
        if (browser) {
            container = document.getElementById('container');
            initThreeJS();
            animate();

            // Add click event listener to the renderer's DOM element
            renderer.domElement.addEventListener('click', onEggClick);
            renderer.domElement.addEventListener('mousemove', checkEggHover);
        }
        // Ensure the zoom control elements are present in the DOM
        zoomInButton = document.getElementById('zoom-in');
        zoomOutButton = document.getElementById('zoom-out');

        // Only add event listeners if the elements are found
        if(zoomInButton && zoomOutButton) {
            zoomInButton.addEventListener('click', zoomIn);
            zoomOutButton.addEventListener('click', zoomOut);
            const zoomSlider = document.getElementById('zoom-slider');
            if (zoomSlider) {
                zoomSlider.oninput = onSliderChange;
            }
        }
        updateCameraZoom(defaultZoomLevel);
        
        // Subscribe to the hintActive store and update the texture accordingly
        const unsubscribeHintActive = hintActiveStore.subscribe(value => {
            hintActive = value;
            toggleHintVisibility(hintActive);
        });


        function checkHintActive() {
        // Now you can use the `isHintActive` variable to determine the state
             return isHintActive;
        }

        
        return () => {
            // Cleanup function
            unsubscribeHintActive();

        };
    });


    onDestroy(() => {

        if (browser) {
            window.removeEventListener('resize', onWindowResize);
            if (requestId !== undefined) {
                cancelAnimationFrame(requestId);
            }

            // Remove click event listener from the renderer's DOM element
            renderer.domElement.removeEventListener('click', onEggClick);
        }
        // Only remove event listeners if the elements were found and listeners were added
        if(zoomInButton) {
            zoomInButton.removeEventListener('click', zoomIn);
        }
        if(zoomOutButton) {
            zoomOutButton.removeEventListener('click', zoomOut);
        }
        // Remove event listener for mouse move
        if (renderer && renderer.domElement) {
            renderer.domElement.removeEventListener('mousemove', checkEggHover);
        }
        // Clear the interval when the component is destroyed
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        stopHighlightUpdater();
    });

</script>
<style>
    #zoom-controls {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: 10px;
        display: flex;
        justify-content: space-between;
        width: 100%;
        
    }

    #zoom-controls button {
        background-color: black;
        color: #73AD21;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        background-size: 100% 100%;
        /* font-size: 16px; */
        /* add more styles as needed */
    }

    /* Chrome, Safari, and newer Opera versions */
    /* General styles for all browsers */
    #zoom-slider {
        flex-grow: 1; /* Allow the slider to fill the space between the buttons */
        margin: 1 10px; /* Provide some spacing */
        background: transparent; /* Make the default background transparent */
        -webkit-appearance: none; /* Remove default styling for WebKit browsers */
        appearance: none; /* Remove default styling for modern browsers */
    }

    /* Styles for WebKit browsers like Chrome and Safari */
    #zoom-slider::-webkit-slider-runnable-track {
        height: 10px;
        -webkit-appearance: none;
        background-color: rgba( 14, 10, 23, .3); /* Unfilled part of the slider */
        border-radius: 3px; /* Rounded corners for the slider track */
    }

    /* Styles for WebKit browsers like Chrome and Safari */
    #zoom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 30px; /* Width of the thumb */
        height: 30px; /* Height of the thumb */
        cursor: pointer;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><text x="50%" y="50%" dy=".3em" text-anchor="middle" font-size="24">🔎</text></svg>') no-repeat center center;
        background-size: contain; /* Ensure the image is fully contained within the thumb */
        border: none;
    }

    /* Styles for Mozilla Firefox */
    #zoom-slider::-moz-range-track {
        background-color: rgba( 14, 10, 23, .3); /* Unfilled part of the slider */
        border-radius: 5px;
    }

    #zoom-slider::-moz-range-progress {
        background-color: rgb(14, 10, 23); /* Filled part of the slider */
        border-radius: 5px;
    }

    /* Styles for Mozilla Firefox */
    #zoom-slider::-moz-range-thumb {
        width: 30px;
        height: 30px;
        cursor: pointer;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><text x="50%" y="50%" dy=".3em" text-anchor="middle" font-size="24">🔎</text></svg>') no-repeat center center;
        background-size: contain; /* Ensure the image is fully contained within the thumb */
        border: none;
    }

    /* Styles for Internet Explorer */
    #zoom-slider::-ms-track {
        background: transparent; /* Remove default styling */
        border-color: transparent;
        color: transparent;
    }

    #zoom-slider::-ms-fill-lower {
        background-color: rgb(14, 10, 23); /* Filled part of the slider */
        border-radius: 5px;
    }

    #zoom-slider::-ms-fill-upper {
        background-color: rgba( 14, 10, 23, .3); /* Unfilled part of the slider */
        border-radius: 5px;
    }

    /* Styles for Internet Explorer */
    #zoom-slider::-ms-thumb {
        width: 30px;
        height: 30px;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><text x="50%" y="50%" dy=".3em" text-anchor="middle" font-size="24">🔎</text></svg>') no-repeat center center;
        background-size: contain; /* Ensure the image is fully contained within the thumb */
        cursor: pointer;
        border: none;
    }


    #zoom-in {
        font-size: 100%; /* Adjust the size of the emoji */
        line-height: 1; /* Align the emoji vertically */
        text-align: center; /* Align the emoji horizontally */
    }

    #zoom-out {
        font-size: 69%; /* Set the emoji to be 50% of the current font size */
        line-height: 1; /* Align the emoji vertically */
        text-align: center; /* Align the emoji horizontally */
    }

    #container {
        width: 80vw; /* Adjust based on the actual size of the egg */
        height: 80vh; /* Adjust based on the actual size of the egg */
        display: block;
        background-color: rgba(0, 0, 0, 0.5);
        overflow: hidden;
        z-index: 33;
        margin: auto; /* Center the container on the page */
        position: relative;
        border-radius: 25px;
        border: 3px solid rgba( 14, 10, 23, 1);
        top: 55%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: absolute;
        cursor: url('cursor2.png'), auto;
    }

    /* Responsive adjustments for smaller heights */
    @media (max-height: 700px) {
        #container {
            margin-top: 60px; /* Adjust top margin to give space for the logo */
            margin-bottom: 60px; /* Adjust bottom margin to give space for the footer */
            width: 70vw; /* Increase the width to prevent cutting off */
            height: 60vh; /* Adjust height automatically */
        }
    }

    @media (max-height: 700px) {
            #container {
                margin-top: 60px; /* Adjust top margin to give space for the logo */
                margin-bottom: 60px; /* Adjust bottom margin to give space for the footer */
                width: 70vw; /* Increase the width to prevent cutting off */
                height: 60vh; /* Adjust height automatically */
            }
        }

    @media (max-height: 400px) {
        #container {
            margin-top: 20px; /* Increase top margin to give more space for the logo */
            margin-bottom: 40px; /* Increase bottom margin to give more space for the footer */
            width: 80vw; /* Increase the width to prevent cutting off */
        }
    }

    /* Additional step for extremely small heights */
    @media (max-height: 512px) {
        #container {
            margin-top: 20px; /* Increase top margin to give more space for the logo */
            margin-bottom: 30px; /* Increase bottom margin to give more space for the footer */
            width: 95vw; /* Increase the width to prevent cutting off */
        }
    }

    /* Responsive adjustments for smaller widths */
    @media (max-width: 500px) {
        #container {
            width: 80vw; /* Increase the width to ensure the egg is visible */
            height: auto; /* Adjust height automatically to maintain aspect ratio */
        }
    }

    /* Specific adjustments for Galaxy Fold */
    @media (height: 280px) and (width: 653px), /* Portrait */
        (height: 653px) and (width: 280px) /* Landscape */ {
        #container {
            width: 90vw; /* May need to adjust based on actual device testing */
            height: 40vh; /* May need to adjust based on actual device testing */
            margin-top: 5vh; /* Provide some space on the top */
        }
    }

</style>

<div id="container" bind:this={container} aria-label="Interactive 3D Egg">
    <div id="zoom-controls">
        <button id="zoom-out">🥚</button>
        <input type="range" id="zoom-slider" min="1" max="20" bind:value={sliderValue} step="any" />
        <button id="zoom-in">🥚</button>
    </div>
    
</div>
