<script lang="ts">
  import { baitCount, fishBiteTime, progressBarPosition, catchSuccessRate, fishSize } from '../../../store/fishing';
  import ProgressBar from './components/ProgressBar.svelte';
  import FishingButton from './components/FishingButton.svelte';

  let bait = 0;
  baitCount.subscribe(value => bait = value);
</script>

<main>
  <div>Bait count: {bait}</div>
  <ProgressBar />
  <FishingButton />
</main>

<style>
  main {
    align-items: center;
  }
  div {
    margin-bottom: 1rem;
  }
</style>
