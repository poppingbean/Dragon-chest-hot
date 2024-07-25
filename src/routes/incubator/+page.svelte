<script>
import Nav from '$lib/component/landing/Nav.svelte';
import Container from './egg.svelte';
// import Background from './background.svelte';
import LeftBox from './leftBox.svelte';
import RightBox from './rightBox.svelte';

</script>

<svelte:head>
<title>DragonVerse Egg Incubator</title>
</svelte:head>

<style>
    body {
        height: 100vh; /* Set the height to the height of the viewport */
        overflow: hidden; /* Hide any content that exceeds the height */
        display: flex; /* Arrange the child elements in a column */
        flex-direction: column; /* Arrange the child elements in a column */
    }

    body {
        -webkit-user-select: none; /* Safari */
        -moz-user-select: none; /* Firefox */
        -ms-user-select: none; /* Internet Explorer/Edge */
        user-select: none; /* Standard syntax */
    }

    .container-box {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: top;
        height: 100%;
        width: 100%;
    }
</style>

<body>
    <Nav />
    <!-- <LeftBox /> -->
    <div class="container-box">
        <Container />
    </div>
    <!-- <RightBox /> -->
</body>