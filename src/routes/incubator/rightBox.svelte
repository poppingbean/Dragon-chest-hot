<script>
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import { scoreTexture } from '../store'; // Ensure this import path is correct
    import * as THREE from 'three';
    import { brightestPixel } from '../store';
    import { hintActive } from '../store';
    import { get } from 'svelte/store';
        
    let fontColor = '#F8F8FF'; // Off-white color for percentage text
    let progressDataUrl;
    export let isFullScreen = false;

    let texture; // Define texture variable outside any function to make it accessible in the script
    let canvas, context, baseTexture, overlayTexture, progressCanvas, progressContext;

    let baseTextureDataUrl; 
    let overlayTextureDataUrl; 

    let percentageComplete = 0;
    let sliderValue = 0;

    // Reactive statement to update the slider's CSS variable for the "used" portion
    $: sliderPercentage = `${sliderValue}%`;
    $: if (sliderElement) {
        sliderElement.style.setProperty('--slider-percentage', sliderPercentage);
    }
    let image = scoreTexture;
    let sliderElement;

    // Paths to your images
    const baseTexturePath = 'pskin1.jpg';
    const overlayTexturePath = 'eggPM.png';

    let currentTab = '% Completed'; // Default tab for the right box

    // Function to change the current tab on the right side
    function changeTab(tab) {
        currentTab = tab;
    }

    function toggleFullScreen() {
        isFullScreen = !isFullScreen;
    }
    

    onMount(() => {
        // Initialize canvas for the mask and progress
        canvas = document.createElement('canvas');
        context = canvas.getContext('2d', { willReadFrequently: true });
        baseTexture = new Image();
        overlayTexture = new Image();
        progressCanvas = document.createElement('canvas');
        progressContext = progressCanvas.getContext('2d');
        sliderElement = document.querySelector('.slider');
        // Set up base texture
        baseTexture.src = baseTexturePath;
        baseTexture.onload = () => {
            baseTextureDataUrl = baseTexture.src; // Now it gets the actual path
            // drawEggProgress(percentageComplete);
        };

        // Set up overlay texture
        overlayTexture.src = overlayTexturePath;
        overlayTexture.onload = () => {
            overlayTextureDataUrl = overlayTexture.src; // Now it gets the actual path
            // drawEggProgress(percentageComplete);
        };

        // Subscribe to texture updates
        scoreTexture.subscribe(value => {
            texture = value;
            if (texture && texture.image) {
                updatePercentage(texture);
            }
        });

        scoreTexture.subscribe(value => {
            if (value && value.image) { // Check if value and value.image are defined
                texture = value;
                updatePercentage(texture);
            }
        });

    });
    
    $: sliderValue = percentageComplete;

    function updatePercentage(texture) {
        if (!texture || !texture.image) {
            console.error("Texture or texture image is undefined.");
            return;
        }

        // Ensure the canvas dimensions match the texture
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        context.drawImage(texture.image, 0, 0);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height, {willReadFrequently: true}).data;
        let whitePixels = 0;
        let totalPixels = canvas.width * canvas.height;

        // Iterate over each pixel to convert to grayscale and check if it's white enough
        for (let i = 0; i < imageData.length; i += 4) {
            // Convert to grayscale using luminosity method: 0.299*r + 0.587*g + 0.114*b
            let grayscale = 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
            imageData[i] = imageData[i + 1] = imageData[i + 2] = grayscale;

            // Set a threshold for what is considered white (e.g., 220 out of 255)
            const whiteThreshold = 220;
            if (grayscale >= whiteThreshold) {
                whitePixels++;
            }
        }

        // Calculate the percentage of white pixels
        percentageComplete = (whitePixels / totalPixels) * 100; // Convert to percentage
        fontColor = getFontColor(percentageComplete); // Update font color based on percentage
        // console.log(`Percentage complete: ${percentageComplete.toFixed(2)}%`);
    }

    function getFontColor(percentage) {
        const hue = percentage * 120 / 100;
        return `hsl(${hue}, 100%, 50%)`;
    }

    // Function to find the region with the highest average brightness
    function findBrightestPoint(imageData) {
        let whitePixels = [];
        const whiteThreshold = 220; // Define what you consider "white"
    
        // Iterate over each pixel
        for (let y = 0; y < imageData.height; y++) {
            for (let x = 0; x < imageData.width; x++) {
                const i = (y * imageData.width + x) * 4; // Index for the red channel
                const grayscale = imageData.data[i]; // Assuming imageData is already grayscale
    
                if (grayscale >= whiteThreshold) {
                    whitePixels.push({ x, y });
                }
            }
        }
    
        // Find the average position of all white pixels
        const avgX = whitePixels.reduce((acc, curr) => acc + curr.x, 0) / whitePixels.length;
        const avgY = whitePixels.reduce((acc, curr) => acc + curr.y, 0) / whitePixels.length;
    
        const centerPoint = { x: Math.round(avgX), y: Math.round(avgY) };
    
        // console.log("Center of brightest area:", centerPoint);
        brightestPixel.set(centerPoint); // Update the store
    
        return centerPoint;
    }

    let hintCone; // Assuming hintCone is defined at a higher scope
    let hintConeTimeout; // For managing the timeout
  
    let AlphaMaskTexture;

    if (browser) {
        AlphaMaskTexture = new Image();
        AlphaMaskTexture.onload = (scoreTexture) => {
            // Image is now loaded; it's safe to call buyHint
        };
    }

    $: isHintButtonEnabled = texture && texture.image;

    function buyHint() {
        // Activate the hint
        hintActive.set(true);
        console.log('Hint activated');

        // Function to process the image and find the brightest point
        const processImage = () => {
            // Retrieve the latest image object from the scoreTexture store each time
            const { image } = get(scoreTexture);

            // Check if the image object is available and valid
            if (!image) {
                console.error('Image is not available in the store.');
                return;
            }

            // Create an off-screen canvas to draw the image and extract its data
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // Set canvas size to match the image
            canvas.width = image.width;
            canvas.height = image.height;

            // Clear the canvas of any previous image data
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the image onto the canvas
            context.drawImage(image, 0, 0);

            // Get the ImageData from the entire canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Use the ImageData to find the brightest point and update the store
            findBrightestPoint(imageData);
        };

        // Recalculate the brightest point 4 times a second
        const intervalId = setInterval(() => {
            if (!get(hintActive)) {
                clearInterval(intervalId);  // Clear the interval if the hint is deactivated
            } else {
                processImage();  // Recalculate the brightest point with the latest image
            }
        }, 250); // 1000ms / 4 = 250ms for 4 times a second

        // Set a timeout to deactivate the hint
        if (hintConeTimeout) clearTimeout(hintConeTimeout);
        hintConeTimeout = setTimeout(() => {
            hintActive.set(false);  // Deactivate the hint
            clearInterval(intervalId);  // Ensure the interval is cleared when the hint is deactivated
            console.log('Hint deactivated');
        }, 30000);  // Adjust the timeout duration as needed
    }


    brightestPixel.subscribe(value => {
        console.log('');
    });

    function onTextureUpdate() {
        if (hintActive.get()) { // Check if the hint is currently active
            const brightestPoint = findBrightestPoint(scoreTexture.image);
            updateConePosition(hintCone, brightestPoint); // Update cone position to the new brightest point
        }
    }
    
    let showTooltip = false;

    function confirmHint() {
        buyHint();
        showTooltip = false; // Hide tooltip after confirming
    }

</script>

<style>
    :global(.right-box) {
        width: 20vw;
        height: 60vh;
        background-color:  rgba( 14, 10, 23, .7);
        border-radius: 25px;
        border: 3px solid  rgba( 14, 10, 23, 1);
        position: absolute;
        top: 69%;
        right: calc((100vw - 45vw - 2 * 20vw) / 3);
        transform: translateY(-50%);
        z-index: 32;
    }

    @media (max-width: 768px) {
        :global(.right-box) {
            width: 80vw;
            height: 10vh;
            position: fixed;
            right: 10%;
            bottom: 10vh;
            transform: translateY(0);
            z-index: 200;
        }
    }

    /* Scoped styles for text elements */
    h1, h2, h3 {
        color: white;
        text-align: center;
        margin-top: 7%;
    }

    h2 { font-size: 1em; 
        color: white;
        text-align: center;
        margin: auto;
        margin-top: 5px;
    }

    h1 { font-size: 2em; }
    h2, h3 { font-size: 1.5em; }

    h2 { font-size: 1em; }

    /* Slider track styling */
    .slider {
        -webkit-appearance: none;
        width: 150px;
        height: 150px; /* Adjust height as needed */
        background: linear-gradient(to bottom, green 0%, green var(--slider-percentage), red var(--slider-percentage), red 100%); /* Gradient for the track */
        outline: none;
        position: absolute;
        z-index: 30;
        top: 50%; /* Align center vertically */
        left: 50%;
        transform: translate(-50%, -50%) rotate(270deg); /* Center the slider and rotate it to go upwards */
        pointer-events: none; /* Disable manual interactions */
    }

    /* Style for Chrome, Safari, and Opera */
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        width: 150px; /* Adjust width as needed */
        height: 150px; /* Adjust height as needed */
        cursor: pointer;
    }

    /* Style for Firefox */
    .slider::-moz-range-thumb {
        background: transparent;
        width: 150px; /* Adjust width as needed */
        height: 150px; /* Adjust height as needed */
        cursor: pointer;
    }

    /* Style for Chrome, Safari, and Opera */
    .slider::-webkit-slider-runnable-track {
        background: linear-gradient(to right, green 0%, green var(--slider-percentage), red var(--slider-percentage), red 100%);
        width: 150px;
    }

    /* Style for Firefox */
    .slider::-moz-range-track {
        background: linear-gradient(to right, green 0%, green var(--slider-percentage), red var(--slider-percentage), red 100%);
        width: 150px
    }

    /* Style for IE */
    .slider::-ms-track {
        background: transparent; /* Required for custom track styles in IE */
        border-color: transparent;
        color: transparent;
    }

    /* Adjust the egg overlay texture style */
    .overlay-texture-img {
        max-width: none; /* Prevent stretching */
        width: 150px; /* Original width */
        height: 150px; /* Original height */
        position: absolute;
        mix-blend-mode: multiply;
        top: 51%; /* Align center vertically */
        left: 51%;
        opacity: 0.7; /* Partial transparency */
        transform: translate(-50%, -50%);
        z-index: 32; /* Above the progress color but below the text */
        border-color: 7px solid rgba( 14, 10, 23, 1);
    } 
    
    .egg-container {
        display: flex;
        align-items: center; /* Align items vertically */
        position: relative; /* Set to relative for absolute positioning of children */
        height: auto; /* Set height to match slider and overlay */
        width: calc(100% - 20px); /* Set width to match slider and overlay */
        margin: auto; /* Auto margins for horizontal centering */
        z-index: 32; /* Above the slider */
        padding: 75px 0; /* Add padding to the top and bottom */
        transform: translate(0%, 25%); /* Adjust vertically to center */
    }   

    .right-tab-container {
        display: flex;
        justify-content: space-around;
        background: #333; /* Dark background for the tabs */
        padding: 0.5rem 0;
        border-top-left-radius: 25px; /* Rounded top-left corner */
        border-top-right-radius: 25px; /* Rounded top-right corner */
    }

    .right-tab {
        cursor: pointer;
        /* color: white; */
        padding: 0.5rem 1rem;
        text-align: center;
    }

    .right-tab.active {
        border-bottom: 2px solid yellow; /* Highlight active tab */
    }

    .right-content {
        padding: 1rem;
        color: white;
    }

    .hint-button {
        position: absolute;
        width: 100px; /* Adjust the width as needed */
        height: 100px; /* Adjust the height as needed */
        border: none; /* Remove the default button border */
        top: 150%; /* Adjust the vertical position as needed */
        right: 50%; /* Adjust the horizontal position as needed */
        transform: translate(50%, -25%); /* Adjust the horizontal position as needed */
        background: none; /* Remove any background styling */
        border: none; /* Remove any border styling */
        border-radius: 50%; /* Make the button round */
        box-shadow: 0 0 10px 10px #b5af09c1; /* Add a shadow to indicate the button is clickable */
        transition: box-shadow 0.5s ease; /* Transition for the box-shadow */
    }

    .hint-button:hover {
        box-shadow: 0 0 30px 15px #b5af09fc; /* Shadow color on hover */
    }

    .hint-button img {
        display: block; /* Remove any extra space around the image */
        width: 130px; /* Adjust the width as needed */
        height: 130px; /* Adjust the height as needed */
        transform: translate(-50%, -55%); /* Adjust horizontally and vertically */
        position: absolute; /* Absolute positioning within the button */
        top: 50%; /* Start at the vertical center */
        left: 50%; /* Start at the horizontal center */
        margin: auto;
    }

    .hint-tooltip {
        display: none; /* Hide by default */
        position: absolute;
        bottom: -50px; /* Position above the button */
        left: 50%;
        transform: translateX(-50%) translateY(-10px);
        width: 220px;
        background-color: #333333;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 0.75rem;
        z-index: 34;
        text-align: left;
        box-shadow: 0px 2px 4px rgba(0,0,0,0.5);
        box-sizing: border-box;
        line-height: 1.4;
    }

    .hint-tooltip-content {
        margin-bottom: 10px; /* Space above the confirm button */
    }

    .confirm-button {
        padding: 5px 10px;
        background: #73AD21;
        border: none;
        /* color: white; */
        border-radius: 3px;
        cursor: pointer;
        width: 100%;
        justify-content: center;
    }

    .hint-button:hover + .hint-tooltip,
    .hint-tooltip:hover {
        display: block; /* Show on hover */
    }

    /* Additional styles for a11y */
    .hint-button:focus + .hint-tooltip {
        display: block; /* Show when focused */
    }

    .hint-button {
        /* Ensure the button is focusable */
        outline: none; /* Customize focus styles */
    }

    .hint-button:focus {
        /* Your custom styles for when the button is focused */
    }

</style>

<div class="right-box">
    <div class="right-tab-container">
        <div class="right-tab" style="color: {fontColor}; font-weight: bold;" class:active={currentTab === '% Completed'} on:click={() => changeTab('% Completed')} on:keydown={e => (e.key === 'Enter' || e.key === ' ') && changeTab('% Completed')} tabindex="0"  role="button">
            {sliderValue.toFixed(1)} %
        </div>
        <div class="right-tab" class:active={currentTab === 'Leaderboard'} on:click={() => changeTab('Leaderboard')} on:keydown={e => (e.key === 'Enter' || e.key === ' ') && changeTab('Leaderboard')} tabindex="0"  role="button">
            🏆
        </div>
        <div class="right-tab" class:active={currentTab === 'Help'} on:click={() => changeTab('Help')} on:keydown={e => (e.key === 'Enter' || e.key === ' ') && changeTab('Help')} tabindex="0"  role="button">
            ❔
        </div>
    </div>
    <div class="right-content">
        {#if currentTab === '% Completed'}
        
        <div class="egg-container">   
            <input 
                type="range" 
                class="slider" 
                bind:value={sliderValue} 
                min="0" 
                max="100" D
                step="0.001" 
                style="--slider-percentage: {sliderValue}%;"
            />
            <img src={overlayTextureDataUrl} alt="Overlay Texture" class="overlay-texture-img" />
            
            <button class="hint-button">
                <img src="Book.png" alt="Hint" style="justify-self: center; padding-top: 20px;"/>
            </button>
            <div class="hint-tooltip" class:show={showTooltip}>
                <div class="hint-tooltip-content">
                    <h1>Buy a Hint with NEAR.</h1>
                    <h3>When activated:</h3>
                    <h3 style="color: red">The egg will start bright red</h3>
                    <h3>Then the egg will turn</h3>
                    <h3 style="color: green">Bright green when complete</h3>
                    <h3>Duration: 30 seconds</h3>
                    <h3>Cost: 0.1 NEAR</h3>
                </div>
                <button class="confirm-button" on:click={confirmHint}>Confirm</button>
            </div>
        </div>
        {:else if currentTab === 'Leaderboard'}
            <h1>Leaderboard</h1>
            <h2>Coming Soon</h2>
        {/if}
    </div>
</div>