import { writable } from 'svelte/store';

export interface Player {
    keys: number;
    keys_per_claim: number;
    chests: number;
    stone: number;
    iron: number;
    wood: number;
    gift: number;
    time_to_next_key_claimable: number;
    time_to_decease: number;
    token_rewarded: bigint;
    last_token_rewarded: bigint;
    player_hearth: number;
    player_defense: number;
    player_attack: number;
    player_luck: number;
    player_energy: number;
    player_crit: number;
    player_level: number;
    castle_level: number;
    castle_hearth: number;
    castle_defense: number;
    castle_attack: number;
}

export interface AntiProxyDelay {
    called_function: string;
    oldPlayer: Player;
    updatedPlayer: Player;
}
// Create the store
export const currentPlayer = writable<Player>();

// Initial state
const initialPlayerState: Player = {
    keys: 0,
    keys_per_claim: 0,
    chests: 0,
    stone: 0,
    iron: 0,
    wood: 0,
    gift: 0,
    time_to_next_key_claimable: 0,
    time_to_decease: 0,
    token_rewarded: BigInt(0),
    last_token_rewarded: BigInt(0),
    player_hearth: 0,
    player_defense: 0,
    player_attack: 0,
    player_luck: 0,
    player_energy: 0,
    player_crit: 0,
    player_level: 0,
    castle_level: 0,
    castle_hearth: 0,
    castle_defense: 0,
    castle_attack: 0,
};

export const antiProxyDelayData = writable<AntiProxyDelay>({
    called_function: '',
    oldPlayer: initialPlayerState,
    updatedPlayer: initialPlayerState,
});

let oldPlayer: Player = initialPlayerState;
let updatedPlayer: Player = initialPlayerState;

// Set state
export const setPlayer = (thisPlayer: Partial<Player>) => {
    const player: Player = {
        keys: thisPlayer.keys ?? initialPlayerState.keys,
        keys_per_claim: thisPlayer.keys_per_claim ?? initialPlayerState.keys_per_claim,
        chests: thisPlayer.chests ?? initialPlayerState.chests,
        stone: thisPlayer.stone ?? initialPlayerState.stone,
        iron: thisPlayer.iron ?? initialPlayerState.iron,
        wood: thisPlayer.wood ?? initialPlayerState.wood,
        gift: thisPlayer.gift ?? initialPlayerState.gift,
        time_to_next_key_claimable: thisPlayer.time_to_next_key_claimable ?? initialPlayerState.time_to_next_key_claimable,
        time_to_decease: thisPlayer.time_to_decease ?? initialPlayerState.time_to_decease,
        token_rewarded: thisPlayer.token_rewarded ?? initialPlayerState.token_rewarded,
        last_token_rewarded: thisPlayer.last_token_rewarded ?? initialPlayerState.last_token_rewarded,
        player_hearth: thisPlayer.player_hearth ?? initialPlayerState.player_hearth,
        player_defense: thisPlayer.player_defense ?? initialPlayerState.player_defense,
        player_attack: thisPlayer.player_attack ?? initialPlayerState.player_attack,
        player_luck: thisPlayer.player_luck ?? initialPlayerState.player_luck,
        player_energy: thisPlayer.player_energy ?? initialPlayerState.player_energy,
        player_crit: thisPlayer.player_crit ?? initialPlayerState.player_crit,
        player_level: thisPlayer.player_level ?? initialPlayerState.player_level,
        castle_level: thisPlayer.castle_level ?? initialPlayerState.castle_level,
        castle_hearth: thisPlayer.castle_hearth ?? initialPlayerState.castle_hearth,
        castle_defense: thisPlayer.castle_defense ?? initialPlayerState.castle_defense,
        castle_attack: thisPlayer.castle_attack ?? initialPlayerState.castle_attack,
    }

    // Get current state of the player
    let playerData: Player;
    currentPlayer.subscribe(value => playerData = value)();
    
    // Set the new player data
    currentPlayer.set(player);

    // Update antiProxyDelayData with current and updated players
    antiProxyDelayData.update(state => ({
        ...state,
        oldPlayer: playerData,
        updatedPlayer: player
    }));
    console.log(antiProxyDelayData);
};

export const resetPlayer = () => {
    setPlayer(initialPlayerState);
};

// Set called function
export const setCalledFunction = (calledFunction: string) => {
    antiProxyDelayData.update(state => ({
        ...state,
        called_function: calledFunction,
    }));
    console.log('Called function updated:', calledFunction);
};

// Check if called function has valid value
export const isCalledFunctionValid = (): boolean => {
    let calledFunction: any;
    antiProxyDelayData.subscribe(state => calledFunction = state.called_function)();
    return calledFunction !== null && calledFunction !== undefined && calledFunction.trim() !== '';
};

// Utility function to compare players and list changed properties
const hasPlayerChanged = (): { changed: boolean; details: Record<string, { oldValue: any, newValue: any }> } => {
    let result = { changed: false, details: {} };
    const propertiesToCheck = ['keys', 'keys_per_claim', 'chests', 'stone', 'wood', 'iron', 'gift', 'time_to_next_key_claimable', 'token_rewarded', 'last_token_rewarded' ];

    antiProxyDelayData.subscribe(state => {
        const oldPlayer = state.oldPlayer;
        const updatedPlayer = state.updatedPlayer;

        const changes: Record<string, { oldValue: any, newValue: any }> = {};

        for (const key of propertiesToCheck) {
            if (oldPlayer[key as keyof Player] !== updatedPlayer[key as keyof Player]) {
                changes[key] = {
                    oldValue: oldPlayer[key as keyof Player],
                    newValue: updatedPlayer[key as keyof Player],
                };
            }
        }

        result = {
            changed: Object.keys(changes).length > 0,
            details: changes,
        };
    })();

    return result;
};

// Check if player data has changed
export const hasPlayerDataChanged = (): { changed: boolean; details: Record<string, { oldValue: any, newValue: any }> } => {
    return hasPlayerChanged();
};
