<script lang="ts">
  import { progressBarPosition, fishSize } from '../../../../store/fishing';
  import { derived } from 'svelte/store';

  type FishSize = 'small' | 'medium' | 'large';

  let position = 0;
  let size: FishSize = 'small';
  progressBarPosition.subscribe(value => position = value);
  fishSize.subscribe(value => size = value as FishSize);

  const safeZonePercentage: Record<FishSize, number> = {
    small: 30,
    medium: 15,
    large: 5
  };

  const escapeZone = (100 - safeZonePercentage[size]) / 2;
  const safeZone = safeZonePercentage[size];
</script>

<div class="progress-container">
  <div class="progress-bar">
    <div class="safe-zone" style="left: {escapeZone}%; width: {safeZone}%"></div>
    <div class="pointer" style="left: {position}%"></div>
  </div>
</div>

<style>
  .progress-container {
    width: 80%;
    height: 20px;
    background-color: #ddd;
    position: relative;
    margin-bottom: 1rem;
  }
  .progress-bar {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .safe-zone {
    position: absolute;
    height: 100%;
    background-color: green;
  }
  .pointer {
    width: 3px;
    height: 100%;
    background-color: red;
    position: absolute;
  }
</style>
