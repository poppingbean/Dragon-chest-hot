<script lang="ts">
	import Nav from './Nav.svelte';
	import NFTStoreFront from './NFTStoreFront.svelte';
	import Footer from './Footer.svelte';
    import Welcome from './welcome.svelte';
    // import Scroll from '../scroll/Scroll.svelte';
</script>

<div
	class="leading-normal tracking-normal "

>
	<Nav ariaLabel="navigation" />
	<Welcome />
	<NFTStoreFront />
	<!--- <Scroll /> -->
	
	<Footer />
</div>

<style>
	/* .gradient {
		 background: transparent;
	} */
</style>
