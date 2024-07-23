<script lang="ts">
  import { baitCount, fishBiteTime, progressBarPosition, catchSuccessRate, fishSize } from '../../../../store/fishing';
  import { writable } from 'svelte/store';

  let castAndWait = false;
  let fishing = false;
  let interval: number; // Explicitly declare the type of 'interval'
  let biteTime: number = 0;
  let resultMessage = writable<string>('');
  let successRate = 0;

  const safeZonePercentage: { [key in 'small' | 'medium' | 'large']: number } = {
    small: 30,
    medium: 15,
    large: 5
  };

  function castNet() {
    if (!castAndWait && !fishing && $baitCount > 0) {
      baitCount.update(n => n - 1);
      biteTime = Math.floor(Math.random() * 10) + 6;
      fishBiteTime.set(biteTime);

      if (biteTime <= 8) {
        fishSize.set('small');
      } else if (biteTime <= 12) {
        fishSize.set('medium');
      } else {
        fishSize.set('large');
      }
      castAndWait = true;

      setTimeout(() => {
        startFishing();
      }, biteTime * 1000);
    }
  }

  function startFishing() {
    progressBarPosition.set(50); // Start at the middle of the progress bar
    catchSuccessRate.set(0);
    successRate = 0;
    interval = window.setInterval(movePointer, 40);
    fishing = true;
    castAndWait = false;
  }

  function movePointer() {
    progressBarPosition.update(pos => {
      let newPos = pos + 0.5; // Increase by 0.5 to make sure it matches the 4-second movement
      if (newPos > 100) {
        newPos = 100;
        clearInterval(interval);
        fishing = false;
        resultMessage.set('The fish escaped!');
      }
      return newPos;
    });

    catchSuccessRate.update(rate => {
      const fishSizeValue = $fishSize as 'small' | 'medium' | 'large';
      const safeZone = safeZonePercentage[fishSizeValue] / 2;
      const middleOfProgressBar = 50; // Center of progress bar
      const pointerWidth = 7; // Assuming pointer width is 4% of progress bar
      const pointerMiddle = $progressBarPosition + pointerWidth / 2;
      const safeZoneStart = middleOfProgressBar - safeZone;
      const safeZoneEnd = middleOfProgressBar + safeZone;

      if (pointerMiddle >= safeZoneStart && pointerMiddle <= safeZoneEnd) {
        successRate += 0.5; // Increment success rate as a percentage
        if (successRate >= 100) {
          clearInterval(interval);
          fishing = false;
          resultMessage.set('You caught the fish!');
        }
      }
      return successRate;
    });
  }

  function pullNet() {
    progressBarPosition.update(pos => {
      let newPos = pos - 4;
      if (newPos < 0) {
        newPos = 0;
      }
      return newPos;
    });
  }

  $: if (fishing) {
    setTimeout(() => {
      clearInterval(interval);
      interval = window.setInterval(movePointer, 40);
    }, biteTime * 1000);
  }
</script>

<div class="container">
  <button on:click="{fishing ? pullNet : castNet}">
    {fishing ? 'Pull Net' : 'Cast Net'}
  </button>
  <div class="info">
    <p>Success Rate: {$catchSuccessRate}%</p>
    <p>{$resultMessage}</p>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
  }
  button {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .info {
    text-align: center;
  }
</style>
