<script>
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';

    let welcomeVisible = writable(true);
    let dontShowAgain = writable(false);
    let animateClose = writable(false);
    let animateEggMove = writable(false);
    let animateOpen = writable(false);

    function saveSettings() {
        if (typeof window !== 'undefined') {
            const settings = JSON.stringify({ welcomeVisible: get(welcomeVisible), dontShowAgain: get(dontShowAgain) });
            localStorage.setItem('welcome', settings);
        }
    }

    function closeAnimation() {
        animateClose.set(true);
        setTimeout(() => {
            animateEggMove.set(true);
            setTimeout(() => {
                welcomeVisible.set(false);
                saveSettings();
                animateClose.set(false);
                animateEggMove.set(false);
            }, 1150);
        }, 120);
    }

    function openAnimation() {
        welcomeVisible.set(true);
        animateOpen.set(true);
        setTimeout(() => {
            animateOpen.set(false);
        }, 500);
    }

    onMount(() => {
        async function initialize() {

            const delay = new Promise(resolve => setTimeout(resolve, 0)); // Set a minimum delay of 1.5 seconds
            const settingsPromise = new Promise(resolve => {
                if (typeof window !== 'undefined') {
                    const settings = JSON.parse(localStorage.getItem('welcome') || '{}');
                    resolve(settings);
                } else {
                    resolve({});
                }
            });

            const [settings] = await Promise.all([settingsPromise, delay]); // Wait for both the delay and the settings load

            welcomeVisible.set(!(settings.dontShowAgain === true)); // Set visibility based on settings
            dontShowAgain.set(settings.dontShowAgain === true);
        }

        initialize();
    });

    $: if ($dontShowAgain) {
        welcomeVisible.set(false);
        saveSettings();
    }
</script>


{#if $welcomeVisible}
<div class="welcome-overlay">
    <div class="welcome-content" class:animate-close={$animateClose}>
        <button class="close-button close-egg" class:animate-move={$animateEggMove} on:click={closeAnimation}>×</button>
        <h2 class='h2w'>Welcome to DragonVerse Labs</h2>
        <p class='pw'>Please, look around and acclimate yourself.</p><br/>
        <p class='pw'>If you have already collected eggs, proceed to the site and trade for Shells.</p>
        <br/>
        <h2 class='h2w'>What are Shells?</h2>
        <p class='pw'>Shells are calcified stem cells used to reconstruct an amalgamation of chromosomes into a new
            Dragon Egg.</p><br/>
        <p class='pw'>This new Dragon Egg hosts an embryo of the Dragon Superbreed allowing it to endure
            experimentations like.</p>
        <p class='pw'>Stake n’ Eggs on Jump DeFi & Hatchening in the Incubator.</p><br/>
        <p class='pw'>10 Shells are required to complete genetic recomposition and receive the new Dragon Egg.</p><br/>
        
        <p class='pw animate-close'>If you are one of the fortunate collectors of magic eggs, more Shells will be granted through an
            airdrop after redemption. Your first Shell will be instantly credited upon transaction completion, with
            additional bonus Shells following soon after the transaction is visible on the indexer.</p><br/>
        
        <div class='legend'>
            <h3 class='legend-title animate-close'>NFT Collections with Extra Shells</h3>
            <div class="legend-container">
                <div class="card card-genesis">
                    <h3 class="card-title">Genesis</h3>
                    <p class="card-shells"><span class="egg-icon genesis"></span>= 20 Shells</p>
                    <p><a href="https://paras.id/collection/dragonear-by-ikhimaznear" target="_blank">DragonNEAR (Genesis)</a></p>
                </div>
                <div class="card card-platinum">
                    <h3 class="card-title">Platinum</h3>
                    <p class="card-shells"><span class="egg-icon platinum"></span>= 6 Shells</p>
                    <p><a href="https://paras.id/collection/eggs-of-near-by-eggvendornear?tab=activity" target="_blank">EGGS of NEAR</a></p>
                    <p><a href="https://www.mintbase.xyz/meta/mint.sharddog.near%3Af0c1c0bd0766f133d3863a06cdb8f2b5" target="_blank">Dragon Seoul (1st Edition)</a></p>
                    <p><a href="https://www.mintbase.xyz/meta/claim.sharddog.near%3A909a37eb7844aa423e660ed52525c173" target="_blank">Dragon Seoul (2nd Edition)</a></p>
                    <p><a href="https://www.mintbase.xyz/meta/mint.sharddog.near%3A10bd063b66316f2700b4f2afb313f64e" target="_blank">Magic Dragon Eggs (Denver)</a></p>
                    <p><a href="https://www.mintbase.xyz/meta/claim.sharddog.near%3A4c78e8e3a7e9af5091f8a516756ca4eb" target="_blank">Magic Dragon Eggs (Seoul)</a></p>
                </div>
                <div class="card card-gold">
                    <h3 class="card-title">Gold</h3>
                    <p class="card-shells"><span class="egg-icon gold"></span>= 3 Shells</p>
                    <p><a href="https://paras.id/collection/egg-grand-guild-egg-by-kenzeroartnear" target="_blank">EGG GRAND GUILD</a></p>
                    <p><a href="https://paras.id/collection/near-eggs-by-daddyflukenear" target="_blank">NEAR EGGS</a></p>
                </div>
                <div class="card card-organic">
                    <h3 class="card-title">Organic</h3>
                    <p class="card-shells"><span class="egg-icon organic"></span>= 1 Shell</p>
                    <p>All Other Egg Collections</p>
                </div>
            </div>
        </div>
        
        <ul>
            <h2 class='h2w'>Begin Trials</h2>
            <li>(1) Select Your Eggs</li>
            <li>(2) Trade Eggs for Shells</li>
            <li>(3) Trade 10 Shells for 1 Dragon Egg</li>
            <li>(4) Stake Dragon Egg on Jump DeFi</li>
            <li>(5) Prepare for Hatchening</li>
        </ul>

        <label>
            <input type="checkbox" bind:checked={$dontShowAgain}>
            Close at page load
        </label>
    </div>
</div>
{/if}
<button class="reopen-button reopen-egg" class:animate-open={$animateOpen} on:click={openAnimation} style:display={$welcomeVisible ? 'none' : 'block' }>
    <img src="/eggIcon.png" alt="Egg Icon" />
</button>

<style>
    .welcome-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: flex-start; /* Changed from center to flex-start */
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        overflow-y: auto;
        padding-top: 3rem; /* Adds padding to the top */
    }

    .welcome-content {
        width: 90%;
        background-color: rgb(15, 15, 15, 0.988);
        padding: 20px;
        margin: 10px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(80, 41, 152, 0.25);
        text-align: left;
        position: relative;
        overflow-y: auto;
        max-height: max-content;
        margin-top: 3rem; /* Adds top margin to ensure content is below the navbar */
    }

    .h2w {
        font-size: 2rem;
        font-weight: bold;
        color: #fff;
    }

    .pw {
        font-size: 1.25rem;
        color: #fff;
    }

    .close-button {
        position: absolute;
        padding: 10px;
        top: 20px;
        right: 20px;
        border: none;
        background: #381f677b;
        color: white;
        font-size: 30px;
        cursor: pointer;
        border-radius: 50% 50% 50% 50%/60% 60% 40% 40%;
        box-shadow: 0 0 10px 5px rgba(255, 217, 0, 0.869);
    }

    /* Card Styles */
    .legend-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0px;
        padding: 0px;
    }

    .card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        text-align: center;
        font-weight: bold;
        color: #333;
        border-radius: 50% 50% 50% 50%/60% 60% 40% 40%;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    }

    .card-genesis {
        background-color: #FFD700;
        color: black;
    }

    .card-platinum {
        background-color: #C0C0C0;
        color: black;
    }

    .card-gold {
        background-color: #DAA520;
        color: black;
    }

    .card-organic {
        background-color: #228B22;
        color: white;
    }

    .card-shells {
        font-size: 1.5rem;
        margin-bottom: 10px;
    }

    .card a {
        color: black;
        text-decoration: none;
        font-size: 1rem;
        transition: color 0.3s;
    }

    .card a:hover {
        color: #def;
    }

    .card a::after {
        content: " 🔗";
        font-size: 1rem; /* Adjust the size if needed */
        margin-left: 5px; /* Space between the link text and the emoji */
    }

    .egg-icon {
        display: inline-block;
        width: 20px;
        height: 30px;
        background-color: #f0e68c;
        border-radius: 50% 50% 50% 50%/60% 60% 40% 40%;
        vertical-align: middle;
        margin-right: 10px;
        box-shadow: 0 0 8px #fff;
    }

    ul {
        margin-top: 10px;
        font-size: 1.25rem;
        justify-content: center;
        align-self: start;
        color: #fff;
    }

    li {
        margin-top: 3px;
        font-size: 1.5rem;
        font-weight: bold;
    }

    /* Checkbox and Label Styling */
    label {
        display: flex;
        align-items: center;
        font-size: 1.25rem;
        color: #fff; /* Adjust color to match the theme */
        font-weight: bold; /* Matches your general text styling */
        cursor: pointer;
        margin-top: 20px; /* Spacing from the content above */
    }

    label input[type="checkbox"] {
        appearance: none; /* Removes default styling */
        background-color: #fff; /* Background color */
        margin-right: 10px; /* Spacing between the checkbox and label text */
        width: 20px; /* Width of the checkbox */
        height: 20px; /* Height of the checkbox */
        border: 2px solid #381f67; /* Border color matching your theme */
        border-radius: 5px; /* Rounded corners */
        position: relative;
        outline: none; /* Removes default focus outline */
    }

    label input[type="checkbox"]:checked {
        background-color: #381f67; /* Background color when checked */
    }

    label input[type="checkbox"]:checked::after {
        content: ''; /* Creates the checkmark */
        position: absolute;
        left: 4px; /* Positioning of the checkmark inside the checkbox */
        top: 1px;
        width: 6px;
        height: 10px;
        border: solid #fff; /* Color of the checkmark */
        border-width: 0 3px 3px 0;
        transform: rotate(45deg);
    }


    .reopen-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        /* background-image: url('eggIcon.svg'); */
        background-size: contain; /* Ensures the entire image is visible */
        background-repeat: no-repeat; /* Stops the image from repeating */
        background-position: center; /* Centers the background image */
        width: 40px; /* Adjust this to match the aspect ratio of your SVG */
        height: 60px;
        font-size: 24px;
        cursor: pointer;
        z-index: 1050;
    }

    .reopen-button:hover {
        box-shadow: 1px rgba(255, 217, 0, 0.869);
        border-radius: 50% 50% 50% 50%/60% 60% 40% 40%;
    }

    @media (max-width: 768px) {
        li {
            font-size: 1rem;
            font-weight: 500;
        }

        .welcome-content {
            width: 95%;
            background-color: rgb(15, 15, 15, 0.9);
            padding: 15px;
            margin: 10px;
            top: 80px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(80, 41, 152, 0.25);
            text-align: left;
            position: absolute;
            overflow-y:auto;            /* Ensures content within the popup is scrollable */
            max-height: max-content; 
        }

        .legend-container {
            flex-direction: column;
            align-items: center;
            padding: 0px;
        }

        .card {
            flex-basis: 100%;
        }
    }
    
    /* *******************************************
    ***************   ANIMATIONS   ***************
    ********************************************* */
    @keyframes shrinkContent {
        0% {
            transform: scaleY(1) scaleX(1) translateX(0%);
            opacity: 1;
        }
        100% {
            transform: scaleY(0.1) scaleX(0) translateX(50%);
            opacity: 0;
        }
    }

    @keyframes fadeCard {
        to {
            opacity: 0;
        }
    }

    @keyframes moveEggToReopen {
        0% {
            transform: translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateY(calc(100vh - 100%));
            opacity: 0; /* Fade as it moves */
        }
    }

    @keyframes expandFromEgg {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .welcome-content.animate-close {
        animation: fadeCard .5s 1.5s forwards;
    }

    .welcome-content.animate-close h2, .welcome-content.animate-close p, .welcome-content.animate-close ul {
        animation: shrinkContent 0.5s forwards;
    }

    .close-button.animate-move {
        animation: moveEggToReopen 1s 0.5s forwards;
    }

    .reopen-button.animate-open {
        animation: expandFromEgg 1.5s forwards;
    }

    @media (min-width: 769px) {
        .legend-container {
            flex-direction: row;
            align-items: center;
        }

        .card {
            flex-basis: auto;
            margin-right: -50px;
        }

        .card:nth-child(1) {
            transform: rotate(-10deg);
            z-index: 1;
        }

        .card:nth-child(2) {
            transform: rotate(5deg);
            z-index: 2;
        }

        .card:nth-child(3) {
            transform: rotate(-5deg);
            z-index: 3;
        }

        .card:nth-child(4) {
            transform: rotate(10deg);
            z-index: 4;
        }
    }
</style>
