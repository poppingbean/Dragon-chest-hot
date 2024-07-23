<script lang="ts">
    // @ts-nocheck
    import { onMount, onDestroy } from 'svelte';
    import Notification from '$lib/component/chest/components/Notification.svelte';
    import Popup from '$lib/component/hotchest/components/Popup.svelte';
    import Loading from '$lib/component/chest/components/Loading.svelte'
    import { signIn, signOut, initHere, viewFunction, callFunction, viewFunctionFT, callFunctionFT } from '$lib/utility/hot-chest';
    import { walletAccount, bufferResult, performBufferAction, accountId } from '../../../store/wallet-store';
    import { showPopup, closePopup, isLoggedOut } from '../../../store/chestpopup-store';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
    import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
    import { writable } from 'svelte/store';
    import { differenceInSeconds } from 'date-fns';
    import { updated } from '$app/stores';
    import { HereWallet } from "@here-wallet/core";

    
    //Properties for main app
    let noti_message = '';
    let noti_type = '';
    let signedAccountId;
    let loading = false;
    let countDownTimer = 0;
    let playerData : any;
    let accountRegistered : any;
    let here: HereWallet;
    let showUpgrade = false;
    
    //Background Image
    let backgroundImage = '';
    
    //Randomly pick a background image in list backgrounds
    setBackgroundImage();

    onMount(async () => {
        try{
            here = await initHere();
            if(!here) return;
            if(here.isSignedIn) {
                const accounts = await here.getAccounts(); // Ensure accounts are fetched correctly
                if (accounts.length > 0) {
                    walletAccount.set(true);
                    accountId.set(accounts[0].accountId);
                    signedAccountId = accounts[0];
                    if (signedAccountId) {
                        await getPlayer(signedAccountId);
                    }
                    else{
                        resetPlayer();
                    }
                }
            }
        }
        catch (error){
            console.error(error);
            throw error;
        }
    });

    /// Start of Main functions interact with game contract
    // Function to GetPlayer, SetPlayer, ResetPlayer
    const setPlayer = (updatedPlayer: any) => {
        playerData = updatedPlayer;
    }
    const resetPlayer = () => {
        setPlayer(null);
    };
    const getPlayer = async (accountId: string | null | undefined) => {
        if (accountId) { 
            // Gọi hàm viewFunction để lấy thông tin player từ contract
            const aplayer = await viewFunction('get_player', { account_id: accountId });
            if (!aplayer) {
                // Xử lý nếu không có player được trả về
                await handleCreatePlayer(); // Gọi hàm handleCreatePlayer để tạo mới player
            } else {
                setPlayer(aplayer);
            }
            if(playerData && playerData.keys_per_claim < 4) showUpgrade = true;
        }
    };

    //Function to Create New Player
    const handleCreatePlayer = async () => {
        try {
            setLoading(true);
            await callFunction('create_player', {});
            // Get player after calling create player
            const updatedPlayer = await viewFunction('get_player', { account_id: signedAccountId });
            // Update player
            setPlayer(updatedPlayer);
            showNotification('Player created successfully!', 'success');
        } catch (err) {
            const errorMessage = err.message || 'Error create new player';
            console.error(errorMessage, err);
            showNotification(`Error create new player: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };
    //Function to Claim key
    const handleClaimKey = async () => {
        try {
            setLoading(true);
            const result = await callFunction('claim_key', {});
            const updatedPlayer = await viewFunction('get_player', { account_id: signedAccountId });
            // Update player
            setPlayer(updatedPlayer);
            showNotification('Key claimed successfully!', 'success');
        } catch (err) {
            const errorMessage = err.message || 'Error claiming key';
            showNotification(`Error claiming key: ${errorMessage}`, 'error');
        } finally {
            setLoading(false);
        }
    };
    //Function to Open chest
    const handleOpenChest = async () => {
        try {
            setLoading(true);
            const result = await callFunction('open_chest', {});
            if(result && result.status && result.status.SuccessValue) {
                let updatedPlayer = await viewFunction('get_player', { account_id: signedAccountId });
                showPopup("You opened " + atob(result.status.SuccessValue).replace('"',''), true, false, '');
                setPlayer(updatedPlayer);
                showNotification('Chest opened successfully!', 'success');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error opening chest';
            showNotification('Error opening chest: {0}' + errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };
    //Function to Exchange chest
    const handleExchangeChest = async () => {
        try {
            setLoading(true);
            const result = await callFunction('exchange_chest',{});
            const updatedPlayer = await viewFunction('get_player', { account_id: signedAccountId });
            setPlayer(updatedPlayer);
            showNotification('You just exchanged key/ resources to treasure!', 'success');
        } catch (err) {
            const errorMessage = err.message || 'Error exchanging chest';
            showNotification('Error exchanging chest: {0}' + errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    //Function to upgrade countdownTimer
    const handleUpgrade = async () => {
        try {
            setLoading(true);
            showUpgrade = false;
            //Check if exists Keys is more than the needed Keys
            if(playerData.keys < (2 * playerData.keys_per_claim)) {
                showNotification("You don't have enough Keys for upgrading!", "warning");
                setLoading(false);
                return;
            }
            const result = await callFunction('upgrade',{});
            const updatedPlayer = await viewFunction('get_player', { account_id: signedAccountId });
            setPlayer(updatedPlayer);
            if(updatedPlayer.keys_per_claim < 4) {
                showUpgrade = true;
            }
            showNotification('Upgrade successfully!', 'success');
        } catch (err) {
            const errorMessage = err.message || 'Error exchanging chest';
            showNotification('Error exchanging chest: {0}' + errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };
    //Function to swap gift
    const handleSwapGift = async () => {
        try {
            setLoading(true);
            //Firstly, we need to check if account registered or not
            await checkRegisterdAccount();
            if(accountRegistered === null || accountRegistered === undefined){
                const errorMessage = 'Cannot registered account id ' + signedAccountId + '. Please try again after allow popup on your browser!';
                showNotification(errorMessage, 'error');
            }
            else{
                const currentPlayer = await viewFunction('get_player', { account_id: signedAccountId });
                await callFunction('swap_gift',{});
                const updatedPlayer = await viewFunction('get_player', { account_id: signedAccountId });
                setPlayer(updatedPlayer);

                let responseRewardString = comparePlayerState(currentPlayer, updatedPlayer);
                if(responseRewardString.length > 0){
                    showPopup(responseRewardString, true, false, '');
                }

                showNotification('You just opened a gift!', 'success');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error swapping gift';
            setError(errorMessage);
            showNotification('Error swapping gift: {0}' + errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };
    //Function to check if account registered in token contract
    const checkRegisterdAccount = async () => {
        //check if account_id registered
        let storageResult = await viewFunctionFT('storage_balance_of', {account_id: signedAccountId } );
        //Check registered result
        if(storageResult === null || storageResult === undefined){
            try{
                let depositeStorageResult = await callFunctionExternal('storage_deposit',{
                    account_id: signedAccountId,
                    registration_only: true
                },
                '1250000000000000000000'
                );
                setAccountRegistered(depositeStorageResult);
            } catch (err) {
                const errorMessage = err.message || 'Error register account';
                showNotification('Error when register account: ' + errorMessage, 'error');
            }
        }
        else {
            setAccountRegistered(storageResult);
        }
    };
    //Set account registered. If hasn't registered => result = null or result = undefined
    const setAccountRegistered = (result: any) => {
        accountRegistered = result;
    }
    const comparePlayerState = (currentPlayer, updatedPlayer) => {
        const diffKeys = updatedPlayer.keys - currentPlayer.keys;
        if (diffKeys >= 9) {
            return "Congrat!!!!! You just received " + diffKeys + " keys";
        } else {
            const diffTokens = updatedPlayer.token_rewarded - currentPlayer.token_rewarded;
            if (diffTokens >= 0) {
                return "Congrat!!!!! You just received " + (updatedPlayer.last_token_rewarded / 1_000_000_000_000_000_000_000_000) + " $Blackdragon tokens";
            } else {
                return "";
            }
        }
    };

    let sinterval: NodeJS.Timeout;
    $: {
        if (sinterval) {
            clearInterval(sinterval);
        }

        sinterval = setInterval(async () =>  {
            let updatedPlayer = await viewFunction('get_player', { account_id: signedAccountId });
            setPlayer(updatedPlayer);
        }, 5000);
    };
    /// End of Main functions

    /// Under construction Features
    const handleCastleConstruct = () => {
        showPopup('Castle building feature is under construction!',true,false,'');
    };
  
    const handlePvP = () => {
        showPopup('PVP feature is under construction!',true,false,'');
    };
    ///

    // Function to update the notification message and type dynamically
    function showNotification(msg, msgType) {
        noti_message = msg;
        noti_type = msgType;

        // Automatically clear the notification after 5 seconds
        setTimeout(() => {
            noti_message = '';
            noti_type = '';
        }, 5000);
    }
    
    function showUserPopup() {
        showPopup('', true, true, signedAccountId);
    }

    function setBackgroundImage() {
        const backgrounds = [
            '/chest/img/background_01.jpg',
            '/chest/img/background_02.jpg',
            '/chest/img/background_03.jpg',
            '/chest/img/background_04.jpg',
            '/chest/img/background_05.jpg',
        ];

        // random Index of backgrounds
        const randomIndex = Math.floor(Math.random() * backgrounds.length);
        backgroundImage = backgrounds[randomIndex];
    }
    
    function setLoading(value) {
        loading = value;
    }

    const login = async () => {
        await signIn();
        const accounts = await here.getAccounts();
        if (accounts.length > 0) {
            walletAccount.set(true);
            accountId.set(accounts[0]);
            signedAccountId = accounts[0];
            if (signedAccountId) {
                await getPlayer(signedAccountId);
            }
        }
    }

    const logout = async () => {
        walletAccount.set(false);
        accountId.set('');
        signedAccountId = ''; // Reset signedAccountId
    }

    // Subscribe to the isLoggedOut store
    onMount(() => {
        let unsubscribe = isLoggedOut.subscribe(value => {
            if (value) {
                logout();
            }
        });

        // Unsubscribe when the component is destroyed
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    });

    /// Start of Countdown and timing functions
    // Hàm chuyển đổi từ nano giây thành chuỗi định dạng dd-MM-yyyy HH:mm:ss và tính toán thời gian đếm ngược
    function countdownTimerFromNanoSeconds(timeInNanoSeconds) {
        const totalSeconds = Math.floor(timeInNanoSeconds / 1_000_000_000);
        const milliseconds = (timeInNanoSeconds % 1_000_000_000) / 1_000_000; // Chuyển đổi phần còn lại của nano giây sang mili giây

        // Tạo đối tượng Date từ số giây
        const dateObj = new Date(totalSeconds * 1000 + milliseconds);
        let tempSeconds = 0;
        // Tính toán thời gian còn lại từ hiện tại đến dateObj
        const now = new Date();
        if (dateObj > now) {
            tempSeconds = differenceInSeconds(dateObj, now);
        }
        const remainingSeconds = tempSeconds;
        return remainingSeconds;
    }

    // Hàm chuyển đổi số giây thành chuỗi HH:mm:ss
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        // Định dạng chuỗi với padding số 0
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(remainingSeconds).padStart(2, '0');

        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    };

    let interval: NodeJS.Timeout;
    $: {
        if (interval) {
            clearInterval(interval);
        }

        const initialNextKeyTime = playerData?.time_to_next_key_claimable || 0;
        const remainingSeconds = countdownTimerFromNanoSeconds(initialNextKeyTime);
        countDownTimer = remainingSeconds;

        interval = setInterval(() => {
            if (playerData && countDownTimer > 0) {
                countDownTimer = countDownTimer - 1;
            } else {
                countDownTimer = 0;
            }
        }, 1000);
    };

    onMount(() => {
        return () => {
            clearInterval(interval);
        };
    });
    /// End of countdown and timing functions
</script>

{#if !signedAccountId}
    <div class="screen" style="background-image: url('{backgroundImage}');">
        <div class="user_info">
            <button class="login_button" on:click={login} disabled={loading}>
            <FontAwesomeIcon icon={faSignInAlt} class="login_button_icon"/> Log in 
        </button>
        </div>
    </div>
{/if}
{#if signedAccountId}
    <div class="screen" style="background-image: url('{backgroundImage}');">
        <Notification {noti_message} {noti_type} />

        <Popup on:logout={logout} />

        <Loading {loading} />

        <div class="user_info">
            <img src="/chest/img/dragon-head.png" alt="Player" class={'user_icon'} on:mouseup={() => showUserPopup()} />
        </div>
        
        <div class={'dragon_container'}>
            {#if countDownTimer > 0}
                    <div class={'dragon_shadow'}>
                    </div>
                    <img src="/chest/img/blackdragon_sleep_02.png" alt="Dragon" class={'dragon'} />
                    <img src="/chest/img/cloud_blackdragon.png" alt="Dragon" class={'cloud'} />
                    <div class={'centeredContent'}>
                        <div class={'time_remaining'}>{formatTime(countDownTimer)}</div>
                        {#if showUpgrade}
                        <button class={'upgrade_button'} on:click={handleUpgrade}>
                            <img src="/chest/img/upgrade_button.png" alt="Upgrade" />
                        </button>
                    {/if}
                    </div>
            {:else}
                    <div class={'dragon_shadow'}>
                    </div>
                    <img src="/chest/img/blackdragon_sleep_01.png" alt="Dragon" class={'dragon'} />
                    <img src="/chest/img/cloud_blackdragon.png" alt="Dragon" class={'cloud'} />
                    <div class={'centeredContent'}>
                        <button class={'claim_button'} on:click={handleClaimKey} disabled={loading}>
                            Claim Key
                        </button>
                    </div>
            {/if}
        </div>

        <div class={'resources'}>
            {#if playerData}
                <div class={'resource'}>
                    <div class={'resource_icon'}>
                    <img src="/chest/img/stone.png" class={'resource_icon'} alt="Stone" />
                    <span class={'resource_amount'}>{playerData.stone}</span>
                    </div>
                </div>
                <div class={'resource'}>
                    <div class={'resource_icon'}>
                    <img src="/chest/img/iron.png" class={'resource_icon'} alt="Iron" />
                    <span class={'resource_amount'}>{playerData.iron}</span>
                    </div>
                </div>
                <div class={'resource'}>
                    <div class={'resource_icon'}>
                    <img src="/chest/img/wood.png" class={'resource_icon'} alt="Wood" />
                    <span class={'resource_amount'}>{playerData.wood}</span>
                    </div>
                </div>
            {/if}
        </div>

        <div class={'items'}>
            {#if playerData}
                <div class={'item'}>
                    <div class={'item_icon'} on:mouseup={handleExchangeChest}  disabled={loading}>
                    <img src="/chest/img/keys.png" alt="Key" class={'item_icon'} />
                    <span class={'item_amount'}>{playerData.keys}</span>
                    </div>
                </div>
                <div class={'item'}>
                    <div class={'item_icon'} on:mouseup={handleOpenChest} disabled={loading}>
                    <img src="/chest/img/chests.png" alt="Chests" class={'item_icon'} />
                    <span class={'item_amount'}>{playerData.chests}</span>
                    </div>
                </div>
                <div class={'item'}>
                    <div class={'item_icon'} on:mouseup={handleSwapGift} disabled={loading}>
                    <img src="/chest/img/gift_box.png" alt="Gift" class={'item_icon'} />
                    <span class={'item_amount'}>{playerData.gift}</span>
                    </div>
                </div>
            {/if}
        </div>

        <div class={'features'}>
            <button class={'featureButton'} on:click={() => handleCastleConstruct()}>
              <img src="/chest/img/castle_construct.png" alt="Castle Construct" class={'featureImage'} />
            </button>
            <button class={'featureButton'} on:click={() => handlePvP()}>
              <img src="/chest/img/pvp.png" alt="PvP" class={'featureImage'} />
            </button>
          </div>
    </div>
{/if}

<style>
    .screen {
        position: relative;
        width: 90rem;
        max-width: 792px;
        height: 100%;
        background-size: cover;
        background-position: center;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        background-color: rgba(255, 255, 255, 0.8);
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .user_info {
        position: absolute; /* Vị trí tuyệt đối */
        top: 20px; /* Khoảng cách từ đỉnh trang */
        left: 20px; /* Khoảng cách từ mép trái */
        display: flex;
        align-items: center;
        z-index: 10; /* Thứ tự hiển thị */
    }

    .user_icon {
        width: 128px; /* Chiều rộng biểu tượng người dùng */
        height: 128px; /* Chiều cao biểu tượng người dùng */
        border-radius: 50%; /* Bo góc thành hình tròn */
        margin-right: 10px; /* Khoảng cách giữa biểu tượng và tên người dùng */
    }

    .login_button:hover {
        color: #4cfa08; 
    }

    .dragon_container {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        bottom: 30px;
        width: 300px; /* Add width to ensure it spans the parent container */
        height: auto; /* Add height to ensure it has enough space */
    }
    
    @keyframes float {
        0% {
            transform: translateY(0px);
        }
        50% {
            transform: translateY(-10px); /* Di chuyển lên */
        }
        100% {
            transform: translateY(0px);
        }
    }
    .dragon {
        width: 100%; 
        height: auto; 
        position: absolute; 
        animation: float 3s ease-in-out infinite; 
        bottom: 10%; 
    }
    .cloud {
        position: absolute;
        width: 100%;
        height: auto;
        justify-content: center;
        top: -550px; 
        left: 0;
        z-index: 0; 
    }
    .centeredContent {
        position: absolute;
        top: -425px;
        left: 135px;
        justify-content: center;
        transform: translate(-50%, -50%);
        font-size: 1.7em;
        text-align: center;
    }
    .dragon_shadow {
        position: absolute; 
        bottom: calc(10% - 15px); 
        width: 200px; 
        height: 30px; 
        background: rgba(0, 0, 0, 0.8); 
        border-radius: 50%; 
        filter: blur(8px); 
    }
    .claim_button {
        background-color: #FF4500;
        color: white;
        border: none;
        padding: 10px 20px;
        cursor: pointer;
        font-size: 1.8rem;
        border-radius: 5px;
    }

    .claim_button:disabled {
        background-color: grey;
    }

    
    .resources {
        position: absolute;
        top: calc(20px + 200px); 
        left: 20px; 
        display: flex;
        justify-content: left;
        flex-direction: column; /* Hiển thị các resource dọc theo cột */
    }

    .resource {
        display: flex;
        align-items: center;
        margin-bottom: 20px; /* Khoảng cách giữa các nguyên liệu */
    }

    .resource_icon {
        position: relative; 
        margin-right: 10px; /* Khoảng cách giữa biểu tượng và số lượng */
    }
    
    .resource_amount {
        position: absolute;
        bottom: 10px; /* Đặt số lượng ở giữa một nửa bên dưới */
        left: 50%; /* Đặt số lượng ở giữa */
        transform: translateX(-50%); /* Để căn giữa chính xác */
        font-size: 1.4rem; /* Kích thước chữ số lượng */
        color: #FF4500; /* Màu sắc của số lượng */
        padding: 2px 8px; /* Đệm cho số lượng */
        border-radius: 4px; /* Bo góc cho số lượng */
    }

    .items {
        position: absolute;
        top: calc(20px + 200px); /* Vị trí dưới username */
        right: -15px; /* Điều chỉnh khoảng cách từ phải sang */
        display: flex;
        justify-content: right;
        flex-direction: column; /* Sắp xếp các item theo chiều dọc */
        align-items: flex-end; /* Căn chỉnh theo chiều dọc bên phải */
    }

    .item {
        display: flex;
        align-items: center;
        margin-bottom: 20px; /* Khoảng cách giữa các item */
    }

    .item_icon {
        position: relative;
        margin-right: 10px; /* Khoảng cách giữa biểu tượng và số lượng */
    }

    .item_amount {
        position: absolute;
        bottom: 10px; /* Đặt số lượng ở giữa một nửa bên dưới */
        left: 50%; /* Đặt số lượng ở giữa */
        transform: translateX(-50%); /* Để căn giữa chính xác */
        font-size: 1.4rem; /* Kích thước chữ số lượng */
        color: #FF4500; /* Màu sắc của số lượng */
        padding: 2px 8px; /* Đệm cho số lượng */
        border-radius: 4px; /* Bo góc cho số lượng */
    }

    .features {
        display: flex;
        flex-direction: row;
        position: absolute;
        top: 0; /* Adjusts the position below resources */
        right: 0;
        margin-top: 10px; /* Adjust the margin as needed */
        margin-right: 10px; /* Adjust the margin as needed */
    }

    .featureButton {
        background: none;
        border: none;
        padding: 10px;
        cursor: pointer;
        margin: 0 10px; /* Add space between buttons */
    }

    .featureImage {
        width: auto; /* Adjust the size as needed */
        height: 128px; /* Adjust the size as needed */
    }

    
    .upgrade_button {
        background-color: transparent; /* No background for image button */
        border: none;
        padding: 0;
        cursor: pointer;
        margin-left: 10px; /* Adjust the space between buttons if needed */
    }

    .upgrade_button img {
        width: auto; /* Adjust size as needed */
        height: 2.6rem;
        display: block;
    }

    @media (max-width: 853px) {
        .screen {
            width: 100%;
            height: 100%;
        }
        .dragon_container {
            bottom: 10px;
        }
    }
    @media (max-width: 768px) {
        .screen {
            width: 100%;
            height: 100%;
        }

        .user_icon {
            width: 96px; 
            height: auto;
        }

        .dragon_container {
            bottom: 50px;
        }
    }

    @media (max-width: 600px) {
        .screen {
            width: 100%;
            height: 100%;
        }

        .user_icon {
            width: 96px; 
            height: auto;
        }

        .dragon_container {
            bottom: 100px; 
        }

        .dragon {
            width: 200px; 
        }

        .dragon_shadow {
            width: 150px; 
        }

        .featureImage {
            width: auto; /* Adjust the size as needed */
            height: 96px; /* Adjust the size as needed */
        }

        .cloud {
            width: 250px;
            top: -380px; 
            left: 50px;
        }
        
        .centeredContent {
            position: absolute;
            top: -280px;
            left: 160px;
            transform: translate(-50%, -50%);
            text-align: center;
        }
        
        .claim_button {
            background-color: #FF4500;
            color: white;
            border: none;
            padding: 5px 25px 5px 25px;
            cursor: pointer;
            font-size: 1.2rem;
            border-radius: 5px;
        }
    }

    @media (max-width: 533px) {
        .dragon_container {
            bottom: 150px; /* Giảm khoảng cách từ dưới lên cho dragon_container */
        }
    }

    @media (max-width: 420px) {
        .screen {
            width: 100%;
            height: 100%;
        }
        
        .user_icon {
            width: 64px; /* Chiều rộng biểu tượng người dùng */
            height: auto; /* Chiều cao biểu tượng người dùng */
            border-radius: 50%; /* Bo góc thành hình tròn */
            margin-right: 10px; /* Khoảng cách giữa biểu tượng và tên người dùng */
        }
        .claim_button {
            background-color: #FF4500;
            color: white;
            border: none;
            padding: 5px 25px 5px 25px;
            cursor: pointer;
            font-size: 0.8rem;
            border-radius: 5px;
        }
        .dragon_container{
            bottom: 100px;
        }
        .dragon {
            width: 10rem; 
            height: auto; 
            position: absolute; 
            animation: float 3s ease-in-out infinite; 
            bottom: 10%; 
        }
        .cloud {
            width: 10rem;
            top: -280px; /* Điều chỉnh vị trí đám mây so với rồng */
            left: 80px;
        }
        
        .centeredContent {
            top: -215px;
            left: 150px;
            font-size: 1.2em;
        }
        .resource {
            width: 5rem;
        }
        .item{
            width: 5.5rem;
        }
        .resource_icon {
            position: relative; 
            margin-right: 10px; /* Khoảng cách giữa biểu tượng và số lượng */
        }
        .resource_amount {
            bottom: 0; /* Đặt số lượng ở giữa một nửa bên dưới */
        }
        .item_icon {
            position: relative;
            margin-right: 20px; /* Khoảng cách giữa biểu tượng và số lượng */
        }

        .item_amount {
            bottom: 0; /* Đặt số lượng ở giữa một nửa bên dưới */
        }
        
        .featureImage {
            width: auto; /* Adjust the size as needed */
            height: 64px; /* Adjust the size as needed */
            margin: 0; /* Add space between buttons */
            padding: 0; /* Add space between buttons */
        }
        .featureButton {
            background: none;
            border: none;
            padding: 5px;
            cursor: pointer;
            margin: 0 5px; /* Add space between buttons */
        }
        .upgrade_button {
            background-color: transparent; /* No background for image button */
            border: none;
            padding: 0;
            cursor: pointer;
            margin-left: 3px; /* Adjust the space between buttons if needed */
        }
        .upgrade_button img {
            width: auto; /* Adjust size as needed */
            height: 1rem;
            display: block;
        }
        .claim_button {
            background-color: #FF4500;
            color: white;
            border: none;
            padding: 5px 25px 5px 25px;
            cursor: pointer;
            font-size: 1rem;
            border-radius: 5px;
        }
    }

    @media (max-width: 383px) {
        .screen {
            width: 100%;
            height: 100%;
        }
        
        .user_icon {
            width: 64px; /* Chiều rộng biểu tượng người dùng */
            height: auto; /* Chiều cao biểu tượng người dùng */
            border-radius: 50%; /* Bo góc thành hình tròn */
            margin-right: 10px; /* Khoảng cách giữa biểu tượng và tên người dùng */
        }
        .claim_button {
            background-color: #FF4500;
            color: white;
            border: none;
            padding: 5px 25px 5px 25px;
            cursor: pointer;
            font-size: 1.2rem;
            border-radius: 5px;
        }
        .dragon_container{
            bottom: 100px;
        }
        .dragon {
            width: 10rem; 
            height: auto; 
            position: absolute; 
            animation: float 3s ease-in-out infinite; 
            bottom: 10%; 
        }
        .cloud {
            width: 10rem;
            top: -280px; /* Điều chỉnh vị trí đám mây so với rồng */
            left: 80px;
        }
        
        .centeredContent {
            top: -215px;
            left: 150px;
            font-size: 1.2em;
        }
        .resource {
            width: 5rem;
        }
        .item{
            width: 5.5rem;
        }
        .resource_icon {
            position: relative; 
            margin-right: 10px; /* Khoảng cách giữa biểu tượng và số lượng */
        }
        .resource_amount {
            bottom: 0; /* Đặt số lượng ở giữa một nửa bên dưới */
        }
        .item_icon {
            position: relative;
            margin-right: 20px; /* Khoảng cách giữa biểu tượng và số lượng */
        }

        .item_amount {
            bottom: 0; /* Đặt số lượng ở giữa một nửa bên dưới */
        }
        
        .featureImage {
            width: auto; /* Adjust the size as needed */
            height: 64px; /* Adjust the size as needed */
            margin: 0; /* Add space between buttons */
            padding: 0; /* Add space between buttons */
        }
        .featureButton {
            background: none;
            border: none;
            padding: 5px;
            cursor: pointer;
            margin: 0 5px; /* Add space between buttons */
        }
        .upgrade_button {
            background-color: transparent; /* No background for image button */
            border: none;
            padding: 0;
            cursor: pointer;
            margin-left: 3px; /* Adjust the space between buttons if needed */
        }
        .upgrade_button img {
            width: auto; /* Adjust size as needed */
            height: 1rem;
            display: block;
        }
    }
</style>
