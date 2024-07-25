<script>
    import LandingPage from '$lib/component/landing/LandingPage.svelte';
    import "../../app.css";
    import "../../stone.css";
    import {initNear} from '../../lib/utility/near-setup'
    import { onMount } from 'svelte';
    
    onMount(async () => {
        initNear()
    });
    
    
</script>
    
<LandingPage />