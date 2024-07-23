<script>
    export let noti_message;
    export let noti_type;
  </script>
  <style>
    .notification {
        position: fixed;
        bottom: 50px;
        border-radius: 5px;
        color: white;
        font-size: 16px;
        z-index: 1000;
        justify-content: center;
        transition: opacity 0.5s ease;
      }
      
      .notification.success {
        background-color: #4caf50; /* Green for success */
      }
      
      .notification.error {
        background-color: #f44336; /* Red for error */
      }
      
      .notification.warning {
        background-color: #ff9800; /* Orange for warning */
      }
      
/*  
    @media (max-width: 600px) {
      .notification {
        left: 25%;
      }
    }

    @media (max-width: 768px) {
      .notification {
        left: 50%;
      }
    }

    @media (max-width: 344px) {
      .notification {
        left: 20%;
      }
    }

    @media (max-width: 853px) {
      .notification {
        left: 45%;
      }
    }

    @media (max-width: 420px) {
      .notification {
        left: 18%;
      }
    } */
  </style>
  {#if noti_message}
  <div class={`notification ${noti_type}`}>
    {noti_message}
  </div>
  {/if} 
  