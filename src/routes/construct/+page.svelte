<script>
    //   import LandingPage from '$lib/component/landing/LandingPage.svelte';
    import "../../app.css";
    import "../../stone.css";
    import {initNear} from '../../lib/utility/near-setup'
    import { onMount } from 'svelte';
    
    onMount(async () => {
        initNear()
    });
    
    
    </script>
    
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #282c34; /* Dark background for a professional look */
            overflow: hidden; /* Prevents scrolling */
        }
    
        .card {
            background-color: #333;
            color: #fff;
            width: 90%;
            max-width: 600px;
            min-width: 300px;
            padding: 1rem;
            text-align: center;
            border-radius: 50% 50% 50% 50%/60% 60% 40% 40%; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), inset 0 5px 10px rgba(255, 255, 255, 0.6); 
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            top: 50%;
            bottom: 50%;
            left: 50%;
            right: 50%;
            margin-top: 10%;
        }
    
        .title {
            font-size: 2.5rem;
            margin-bottom: 20px;
        }
    
        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 20px;
        }
    
        .image {
            width: 42%;
            max-width: 250px;
            height: auto;
            margin-bottom: 1rem;
        }
    
        @media (max-width: 768px) {
            .title {
                font-size: 2rem;
            }
    
            .subtitle {
                font-size: 1.25rem;
                margin-bottom: 10px;
            }
    
            .image {
                width: 60%;
            }
        }
    </style>
    
    <body>
        
        <div class="card">
            <h1 class="title">Under<br/> Construction</h1>
            <p class="subtitle">We're working hard<br/> to bring you<br/>the best experience.</p>
            <p> Stay tuned!</p>
            <img src="blackdragons/Project 152_6.png" alt="Under Construction" class="image" />
        </div>
    </body>