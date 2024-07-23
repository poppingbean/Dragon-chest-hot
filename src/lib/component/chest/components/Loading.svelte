<script>
    export let loading = false;
</script>
<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5); /* Grey overlay */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .spinner {
        width: 192px;
        height: 195px;
        position: fixed;
        top: 42%;
        left: 46.5%;
        transform: translate(-50%, -50%);
        animation: spin 5s linear infinite; 
    }

    @media (max-width: 853px) {
        .spinner {
            width: 192px;
            height: 195px;
            top: 40%;
            left: 40%;
        }
    }

    @media (max-width: 768px) {
        .spinner {
            width: 192px;
            height: 195px;
            top: 42%;
            left: 39%;
        }
    }

    @media (max-width: 600px) {
        .spinner {
            width: 128px;
            height: 130px;
            top: 40%;
            left: 40%;
        }
    }
    
    @media (max-width: 420px) {
        .spinner {
            width: 128px;
            height: 130px;
            top: 44%;
            left: 35%;
        }
    }

    @media (max-width: 344px) {
        .spinner {
            width: 128px;
            height: 130px;
            top: 46%;
            left: 32%;
            /* Các điều chỉnh khác nếu cần thiết */
        }
    }

</style>
{#if loading}
<div class="overlay">
    <img src="/chest/img/loadingscreen.png" alt="Loading..." class="spinner" />
  </div>
{/if}