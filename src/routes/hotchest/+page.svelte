<script>
// @ts-nocheck

    import "../../app.css";
    import "../../stone.css";
    import { onMount } from 'svelte';
    
    import Screen from '$lib/component/hotchest/Screen.svelte';

    onMount(async () => {
    });

</script>
<style>
    .root {
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #0a0606;
        overflow: hidden;
        font-family: 'Silkscreen', cursive;
        font-size: 1.4rem;
        color: #FF4500;
    }
    .container {
        width: 100vw;
        height: 96vh;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }
</style>
<div class={'root'}>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <main class={'container'}>
        <Screen />
    </main>
</div>