// PNR Token Contract Address (Phetta Needs Rent)
const PNR_CONTRACT = '0xffe45fb9d4400904a49f5ac28ba6e74993410b01';

// Uniswap V3 Router for direct swaps
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

// House wallet address - Your Vibecoins wallet
const HOUSE_WALLET = '0x934aB548ac4e71608671b463755992EDEe7dbDBF';

// Vibecoin GraphQL API
const VIBECOIN_API = 'https://vibecoin.up.railway.app/graphql';

// ERC20 ABI
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint amount) returns (bool)",
    "function approve(address spender, uint amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];

let provider;
let signer;
let walletAddress;
let pnrContract;
let pnrDecimals = 18;

// User positions: { marketId: { side: 'yes'|'no', amount: number, shares: number } }
let userPositions = {};

// Player state - tracks streaks, traits, stats
let playerState = {
    totalBets: 0,
    totalWonPNR: 0,
    totalLostPNR: 0,
    streak: 0,
    bestStreak: 0,
    traits: [],           // ['Boba\'s Whisper', 'Sheldon\'s Insight', ...]
    achievements: [],     // Achievement IDs unlocked
    emotionIndex: {
        dreamstate: 0,
        anxiety: 0,
        gooberJoy: 0
    }
};

// Market sorting/filtering state
let marketSort = 'time'; // 'time' | 'volume' | 'odds'
let marketFilter = 'all'; // 'all' | 'sprint' | 'journey' | 'epoch'

// Price history for markets (for movement indicators)
let marketPriceHistory = {};

// Achievements system
const ACHIEVEMENTS = {
    'first_bet': { name: 'First Bet', desc: 'Place your first bet', icon: '🎯' },
    'streak_3': { name: 'Hot Streak', desc: 'Win 3 in a row', icon: '🔥' },
    'streak_5': { name: 'On Fire', desc: 'Win 5 in a row', icon: '🔥🔥' },
    'streak_10': { name: 'Unstoppable', desc: 'Win 10 in a row', icon: '🔥🔥🔥' },
    'big_bet': { name: 'High Roller', desc: 'Place a bet of 500+ PNR', icon: '💰' },
    'jackpot_winner': { name: 'Dreamstate Champion', desc: 'Win the Dreamstate Jackpot', icon: '🎰' },
    'trader': { name: 'Active Trader', desc: 'Place 10 bets', icon: '📊' },
    'whale': { name: 'Whale', desc: 'Place 50 bets', icon: '🐋' },
    'all_traits': { name: 'Trait Master', desc: 'Unlock all traits', icon: '🎁' }
};

// Dreamstate Jackpot - progressive pool
let dreamstateJackpot = {
    poolPNR: 0,
    lastWinner: null,
    lastWinMarketId: null
};

// Recent events feed for social proof
let recentEvents = [];

// Character Oracle lines - cryptic commentary
const ORACLE_LINES = {
    'boba-v-sheldon': {
        win: [
            'Boba nods approvingly. Tapioca sees you.',
            'Sheldon scribbles a new note on the map of Gooberland… with your name on it.',
            'The Hidden Milk Moon glimmers. You\'ve earned its attention.',
            'Boba\'s whisper echoes: "You understand the rhythm."'
        ],
        lose: [
            'Boba slurps quietly. The Milk Moon remains hidden.',
            'Sheldon stares into space. "Interesting choice," he mutters.',
            'The Whisper Code remains encrypted. Try again.',
            'Boba shakes his head. "Not this time, friend."'
        ]
    },
    'beach-dreams': {
        win: [
            'Quack passes you the kush. You\'ve transcended.',
            'The beach islands welcome you. Interdimensional consciousness achieved.',
            'Phetta gives you a knowing nod. You\'re in the vibe.',
            'Reality bends. You see the truth now.'
        ],
        lose: [
            'Quack just passes out. No transcendence today.',
            'The beach islands remain mundane. Try again later.',
            'Phetta shrugs. "Maybe next time, friend."',
            'Reality stays rigid. The kush wasn\'t enough.'
        ]
    },
    'time-bend': {
        win: [
            'Lucy smiles. Tuesday is now a shade of purple.',
            'Time bends around you. You\'ve broken causality.',
            'The Dream Emulation power recognizes you.',
            'Tuesday waves hello. It\'s definitely purple now.'
        ],
        lose: [
            'Lucy frowns. Tuesday remains Tuesday.',
            'Time stays linear. Causality holds.',
            'The Dream Emulation fades. Try again.',
            'Tuesday stays gray. No purple today.'
        ]
    },
    'default': {
        win: [
            'The Phettaverse approves. You\'ve chosen wisely.',
            'Reality shifts in your favor. The odds were with you.',
            'A character nods. You\'re on the right path.',
            'The prediction aligns. You see the truth.'
        ],
        lose: [
            'The Phettaverse shakes its head. Not this time.',
            'Reality resists. The odds were against you.',
            'A character shrugs. "Better luck next time."',
            'The prediction diverges. Try again.'
        ]
    }
};

// Character data with images and bios from emotionull.art
const CHARACTER_DATA = {
    'Phetta': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/phetta-transparent.png',
        bio: 'The purple rat protagonist of the Phettaverse, known for their laid-back attitude and quest for cheese.'
    },
    'Quack': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/quack-transparent.png',
        bio: 'A fascinating frog/duck-like creature discovered on the beach islands. Has developed an obsession with smoking large amounts of luscious kush and relaxing with best friend Phetta.'
    },
    'Lucy': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/lucy-transparent.png',
        bio: 'A truly bizarre creature created from unusual substances discovered in the depths of the phettaverse. Power: Dream Emulation. Onset: 30-40 Minutes. Bends and twists time and space.'
    },
    '2Faced': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/2faced-transparent.png',
        bio: 'Notorious for pulling fast ones on unsuspecting individuals - at least twice in a single sitting. Enjoys racing through the Phettaverse woods in speedy running slippers.'
    },
    'Cloudy': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/cloudy-transparent.png',
        bio: 'Carries power orbs that give him the unique power of controlling the environment, primarily clouds. Once an average alien, a dark and twisted night caused a new world to begin.'
    },
    'Gummy': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/gummy-transparent.png',
        bio: 'One of the most peaceful and gentle mushroom-based creatures in the Phettaverse. Exudes a calm aura that brings comfort and harmony, unlike other mushrooms that distort reality.'
    },
    'Beatstar': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/beatstar-transparent.png',
        bio: 'The DJ who has attracted a large number of people! While in his tech suit, he has the power to pump up the bass and truly get the party started.'
    },
    'Chef': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/chef-transparent.png',
        bio: 'The Ramen Shop owner that resides in the Phettaverse City. This squid-like creature seems to have been 3D printed... Possibly Phetta 3D printed them in his past.'
    },
    'Jazz Ants': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/jazz-ants-transparent.png',
        bio: 'Originally starring on April 19, 2021, Jazz Ants have a history in the Phettaverse. Recently moved and reactivated by Phetta in their Studio Room.'
    },
    'Robo-Alien': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/robo-alien-transparent.png',
        bio: 'A fast-moving, grooving robotic extraterrestrial that moves at breakneck speed. Kept safe in its mecha suit, has an instantaneous link to the internet and access to all of its power.'
    },
    'Time Creature': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/time-creature-transparent.png',
        bio: 'A creature located in the Clock Realm where time operates in mysterious ways.'
    },
    'Stoned Rabbit': {
        image: 'https://emotionull.art/wp-content/uploads/2024/01/stoned-rabbit-transparent.png',
        bio: 'Previous data was lost during the great awakening of the Phettagotchi. We are actively working to compile and restore this valuable knowledge.'
    }
};

// House fee percentage (2% of each bet goes to house)
const HOUSE_FEE_PERCENT = 0.02;

// Phettaverse Prediction Markets - Weird, surreal, Adult Swim vibes
const MARKETS = [
    {
        id: 'phetta-cheese',
        title: 'Will Phetta find the cheese before the great awakening?',
        description: 'The purple rat is on a quest. Will he discover the legendary cheese stash hidden in the Clock Realm before reality bends?',
        character: 'Phetta',
        type: 'sprint',                 // 'sprint' | 'journey' | 'epoch'
        mood: 'dreamstate',             // 'dreamstate' | 'anxiety' | 'gooberJoy'
        storyArc: 'boba-v-sheldon',     // used for traits/oracle
        yesShares: 450,
        noShares: 550,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (15 * 60 * 1000), // 15 minutes from now
        createdAt: Date.now()
    },
    {
        id: 'quack-kush',
        title: 'Will Quack smoke enough kush to transcend dimensions?',
        description: 'Quack has been chain-smoking on the beach islands. Will he achieve interdimensional consciousness or just pass out?',
        character: 'Quack',
        type: 'journey',
        mood: 'gooberJoy',
        storyArc: 'beach-dreams',
        yesShares: 320,
        noShares: 680,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (30 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'lucy-time-bend',
        title: 'Will Lucy bend time so hard that Tuesday becomes a color?',
        description: 'Lucy\'s Dream Emulation power is escalating. Scientists predict Tuesday might become a shade of purple. Will it happen?',
        character: 'Lucy',
        type: 'journey',
        mood: 'dreamstate',
        storyArc: 'time-bend',
        yesShares: 280,
        noShares: 720,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (45 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: '2faced-double-cross',
        title: 'Will 2Faced successfully double-cross themselves?',
        description: 'With four eyes watching, 2Faced is attempting the ultimate meta-scam: scamming themselves. Can they pull it off twice?',
        character: '2Faced',
        type: 'sprint',
        mood: 'anxiety',
        storyArc: 'default',
        yesShares: 600,
        noShares: 400,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (20 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'cloudy-weather-control',
        title: 'Will Cloudy use his power orbs to make it rain plushies?',
        description: 'Cloudy controls the environment. Will he use this power to create a plushie rainstorm in Phettaverse City?',
        character: 'Cloudy',
        type: 'journey',
        mood: 'dreamstate',
        storyArc: 'default',
        yesShares: 380,
        noShares: 620,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (25 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'gummy-reality-distortion',
        title: 'Will Gummy remain peaceful while other mushrooms distort reality?',
        description: 'Unlike other mushroom creatures, Gummy is chill. But will the chaos around him finally break his zen?',
        character: 'Gummy',
        type: 'epoch',
        mood: 'dreamstate',
        storyArc: 'default',
        yesShares: 750,
        noShares: 250,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (60 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'beatstar-party',
        title: 'Will Beatstar\'s bass drop create a new dimension?',
        description: 'Beatstar is DJing in his tech suit. The bass is getting intense. Will it literally tear a hole in spacetime?',
        character: 'Beatstar',
        type: 'sprint',
        mood: 'gooberJoy',
        storyArc: 'default',
        yesShares: 420,
        noShares: 580,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (35 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'chef-3d-print',
        title: 'Did Phetta 3D print Chef in a past timeline?',
        description: 'Chef is a squid-like ramen shop owner. Evidence suggests Phetta might have 3D printed them. Will we find proof?',
        character: 'Chef',
        type: 'journey',
        mood: 'anxiety',
        storyArc: 'default',
        yesShares: 500,
        noShares: 500,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (40 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'jazz-ants-return',
        title: 'Will the Jazz Ants return to the Studio Room and drop a new album?',
        description: 'They\'ve been reactivated. Will they create the greatest jazz album in Phettaverse history?',
        character: 'Jazz Ants',
        type: 'journey',
        mood: 'gooberJoy',
        storyArc: 'default',
        yesShares: 550,
        noShares: 450,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (50 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'robo-alien-internet',
        title: 'Will Robo-Alien use the internet to become self-aware and order pizza?',
        description: 'He has instant internet access. Will he achieve consciousness and order a pizza to the Phettaverse?',
        character: 'Robo-Alien',
        type: 'sprint',
        mood: 'anxiety',
        storyArc: 'default',
        yesShares: 480,
        noShares: 520,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (18 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'time-creature-clock-realm',
        title: 'Will the Time Creature make time go backwards in the Clock Realm?',
        description: 'Time is weird there already. Will it get so weird that causality breaks and effects happen before causes?',
        character: 'Time Creature',
        type: 'epoch',
        mood: 'dreamstate',
        storyArc: 'default',
        yesShares: 350,
        noShares: 650,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (22 * 60 * 1000),
        createdAt: Date.now()
    },
    {
        id: 'stoned-rabbit-awakening',
        title: 'Will Stoned Rabbit remember what happened during the great awakening?',
        description: 'Data was lost. Will Stoned Rabbit recover memories of the event that changed everything?',
        character: 'Stoned Rabbit',
        type: 'epoch',
        mood: 'anxiety',
        storyArc: 'default',
        yesShares: 290,
        noShares: 710,
        resolved: false,
        resolution: null,
        endsAt: Date.now() + (28 * 60 * 1000),
        createdAt: Date.now()
    }
];

// Load markets from localStorage (preserve timers)
function loadMarkets() {
    const saved = localStorage.getItem('phettamarketMarkets');
    if (saved) {
        try {
            const savedMarkets = JSON.parse(saved);
            // Merge saved data with current markets
            savedMarkets.forEach(savedMarket => {
                const market = MARKETS.find(m => m.id === savedMarket.id);
                if (market) {
                    market.yesShares = savedMarket.yesShares || market.yesShares;
                    market.noShares = savedMarket.noShares || market.noShares;
                    market.resolved = savedMarket.resolved || false;
                    market.resolution = savedMarket.resolution || null;
                    market.endsAt = savedMarket.endsAt || market.endsAt;
                }
            });
        } catch (e) {
            console.error('Error loading markets:', e);
        }
    }
}

// Save markets to localStorage
function saveMarkets() {
    localStorage.setItem('phettamarketMarkets', JSON.stringify(MARKETS));
}

// Load positions from localStorage
function loadPositions() {
    const saved = localStorage.getItem('phettamarketPositions');
    if (saved) {
        try {
            userPositions = JSON.parse(saved);
            updatePositionsDisplay();
        } catch (e) {
            console.error('Error loading positions:', e);
        }
    }
}

// Save positions to localStorage
function savePositions() {
    localStorage.setItem('phettamarketPositions', JSON.stringify(userPositions));
}

// Load player state from localStorage
function loadPlayerState() {
    const saved = localStorage.getItem('phettamarketPlayer');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            playerState = { ...playerState, ...parsed };
        } catch (e) {
            console.error('Error loading player state:', e);
        }
    }
}

// Save player state to localStorage
function savePlayerState() {
    localStorage.setItem('phettamarketPlayer', JSON.stringify(playerState));
}

// Load jackpot from localStorage
function loadJackpot() {
    const saved = localStorage.getItem('phettamarketJackpot');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            dreamstateJackpot = { ...dreamstateJackpot, ...parsed };
        } catch (e) {
            console.error('Error loading jackpot:', e);
        }
    }
}

// Save jackpot to localStorage
function saveJackpot() {
    localStorage.setItem('phettamarketJackpot', JSON.stringify(dreamstateJackpot));
}

// Load events from localStorage
function loadEvents() {
    const saved = localStorage.getItem('phettamarketEvents');
    if (saved) {
        try {
            recentEvents = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading events:', e);
        }
    }
}

// Save events to localStorage
function saveEvents() {
    localStorage.setItem('phettamarketEvents', JSON.stringify(recentEvents));
}

// Log event to feed
function logEvent(evt) {
    recentEvents.unshift({ ...evt, ts: Date.now() });
    recentEvents = recentEvents.slice(0, 50); // Keep last 50 events
    saveEvents();
    renderEventFeed();
}

// Connect wallet
async function connectWallet() {
    // Check if ethers is loaded
    if (typeof ethers === 'undefined') {
        alert('Ethers.js library is not loaded. Please refresh the page.');
        console.error('Ethers.js not found');
        return;
    }
    
    if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask or another Ethereum wallet!\n\nYou can get MetaMask at: https://metamask.io/');
        return;
    }
    
    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Get signer
        signer = provider.getSigner();
        walletAddress = await signer.getAddress();
        
        // Create contract instance
        pnrContract = new ethers.Contract(PNR_CONTRACT, ERC20_ABI, signer);
        
        // Get decimals
        try {
            pnrDecimals = await pnrContract.decimals();
        } catch (e) {
            console.warn('Could not fetch decimals, using 18', e);
            pnrDecimals = 18;
        }
        
            // Update UI
            document.getElementById('connectWallet').textContent = '✅ Connected';
            document.getElementById('connectWallet').disabled = false;
            document.getElementById('walletInfo').classList.remove('hidden');
            
            // Update balances
            await updateBalance();
            await fetchTokenData();
            
            // Auto-refresh balance every 30 seconds
            if (window.balanceInterval) {
                clearInterval(window.balanceInterval);
            }
            window.balanceInterval = setInterval(() => {
                updateBalance();
            }, 30000);
            
            console.log('Wallet connected:', walletAddress);
    } catch (error) {
        console.error('Wallet connection error:', error);
        let errorMsg = 'Failed to connect wallet';
        
        if (error.code === 4001) {
            errorMsg = 'Connection rejected. Please approve the connection request.';
        } else if (error.code === -32002) {
            errorMsg = 'Connection request already pending. Please check your wallet.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        alert(errorMsg);
        document.getElementById('connectWallet').disabled = false;
    }
}

// Update PNR balance
async function updateBalance() {
    if (typeof ethers === 'undefined') {
        console.warn('Ethers not loaded, cannot update balance');
        return;
    }
    
    if (!pnrContract || !walletAddress) {
        return;
    }
    
    try {
        const balance = await pnrContract.balanceOf(walletAddress);
        const formatted = ethers.utils.formatUnits(balance, pnrDecimals);
        const balanceNum = parseFloat(formatted);
        
        const balanceEl = document.getElementById('pnrBalance');
        if (balanceEl) {
            balanceEl.textContent = balanceNum.toFixed(2) + ' PNR';
        }
        
        // Calculate portfolio value (sum of all position values)
        let portfolioValue = 0;
        for (const [marketId, position] of Object.entries(userPositions)) {
            const market = MARKETS.find(m => m.id === marketId);
            if (market && !market.resolved) {
                const totalShares = market.yesShares + market.noShares;
                const price = position.side === 'yes' 
                    ? market.yesShares / totalShares 
                    : market.noShares / totalShares;
                portfolioValue += position.shares * price;
            }
        }
        
        const portfolioEl = document.getElementById('portfolioValue');
        if (portfolioEl) {
            portfolioEl.textContent = portfolioValue.toFixed(2) + ' PNR';
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

// Fetch token data from Vibecoin API
async function fetchTokenData() {
    try {
        const query = `
            query GetToken {
                token(id: "${PNR_CONTRACT}") {
                    currentPriceUsd
                    marketCapUsd
                    totalVolumeUsd
                    name
                    symbol
                }
            }
        `;
        
        const response = await fetch(VIBECOIN_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (data.data && data.data.token) {
            const token = data.data.token;
            const priceEl = document.getElementById('tokenPrice');
            const marketCapEl = document.getElementById('tokenMarketCap');
            const volumeEl = document.getElementById('tokenVolume');
            
            if (priceEl) {
                priceEl.textContent = token.currentPriceUsd 
                    ? `$${parseFloat(token.currentPriceUsd).toFixed(6)}` 
                    : 'N/A';
            }
            if (marketCapEl) {
                marketCapEl.textContent = token.marketCapUsd 
                    ? `$${(parseFloat(token.marketCapUsd) / 1000000).toFixed(2)}M` 
                    : 'N/A';
            }
            if (volumeEl) {
                volumeEl.textContent = token.totalVolumeUsd 
                    ? `$${(parseFloat(token.totalVolumeUsd) / 1000).toFixed(2)}K` 
                    : 'N/A';
            }
        } else {
            // Fallback if token not found in Vibecoin API
            const priceEl = document.getElementById('tokenPrice');
            if (priceEl) priceEl.textContent = 'Check Uniswap';
        }
    } catch (error) {
        console.error('Error fetching token data:', error);
        const priceEl = document.getElementById('tokenPrice');
        const marketCapEl = document.getElementById('tokenMarketCap');
        const volumeEl = document.getElementById('tokenVolume');
        if (priceEl) priceEl.textContent = 'Error loading';
        if (marketCapEl) marketCapEl.textContent = 'Error loading';
        if (volumeEl) volumeEl.textContent = 'Error loading';
    }
}

// Render markets with filtering and sorting
function renderMarkets() {
    const marketsList = document.getElementById('marketsList');
    marketsList.innerHTML = '';
    
    // Filter markets
    let filteredMarkets = MARKETS.filter(market => {
        if (marketFilter === 'all') return true;
        return market.type === marketFilter;
    });
    
    // Sort markets
    filteredMarkets = [...filteredMarkets].sort((a, b) => {
        if (marketSort === 'time') {
            return a.endsAt - b.endsAt; // Soonest first
        } else if (marketSort === 'volume') {
            const volA = a.yesShares + a.noShares;
            const volB = b.yesShares + b.noShares;
            return volB - volA; // Highest volume first
        } else if (marketSort === 'odds') {
            const oddsA = Math.abs((a.yesShares / (a.yesShares + a.noShares)) - 0.5);
            const oddsB = Math.abs((b.yesShares / (b.yesShares + b.noShares)) - 0.5);
            return oddsA - oddsB; // Closest to 50/50 first
        }
        return 0;
    });
    
    filteredMarkets.forEach(market => {
        const totalShares = market.yesShares + market.noShares;
        const yesPrice = market.yesShares / totalShares;
        const noPrice = market.noShares / totalShares;
        
        const marketCard = document.createElement('div');
        marketCard.className = 'market-card';
        marketCard.onclick = () => openMarketModal(market);
        
        const volume = Math.floor((market.yesShares + market.noShares) / 10); // Simplified volume calc
        const charData = CHARACTER_DATA[market.character] || { image: '', bio: '' };
        const timeLeft = market.resolved ? 'RESOLVED' : formatTimeLeft(market.endsAt);
        const timeClass = market.resolved ? 'timer-resolved' : (Date.now() >= market.endsAt - 60000 ? 'timer-ending' : 'timer-active');
        
        // Price movement indicator
        const movement = getPriceMovement(market.id);
        const movementIcon = movement ? (movement.direction === 'up' ? '📈' : '📉') : '';
        const movementClass = movement ? (movement.direction === 'up' ? 'price-up' : 'price-down') : '';
        
        marketCard.innerHTML = `
            <div class="market-header-top">
                <div class="market-volume">💰 ${volume}K Vol.</div>
                <div class="market-badges">
                    ${market.type ? `<span class="market-type-badge type-${market.type}">${market.type.toUpperCase()}</span>` : ''}
                    ${movementIcon ? `<span class="price-movement ${movementClass}">${movementIcon}</span>` : ''}
                </div>
                <div class="market-timer ${timeClass}">⏱ ${timeLeft}</div>
            </div>
            <div class="market-header">
                <img 
                    src="${charData.image || 'https://emotionull.art/wp-content/uploads/2022/12/punkrockbee-768x768.png'}" 
                    alt="${market.character}" 
                    class="character-image" 
                    onerror="this.onerror=null;this.src='https://emotionull.art/wp-content/uploads/2022/12/punkrockbee-768x768.png';"
                >
                <div class="market-header-text">
                    <div class="market-title">${market.title}</div>
                    <div class="market-character">${market.character}</div>
                </div>
            </div>
            <div class="market-description">${market.description}</div>
            ${charData.bio ? `<div class="character-bio">${charData.bio}</div>` : ''}
            <div class="market-odds">
                <div class="odds-yes">
                    <div class="odds-label">Yes ${movement && movement.direction === 'up' ? '📈' : ''}</div>
                    <div class="odds-percentage">${(yesPrice * 100).toFixed(0)}%</div>
                    <div class="odds-shares">${market.yesShares.toFixed(0)} shares</div>
                </div>
                <div class="odds-no">
                    <div class="odds-label">No ${movement && movement.direction === 'down' ? '📈' : ''}</div>
                    <div class="odds-percentage">${(noPrice * 100).toFixed(0)}%</div>
                    <div class="odds-shares">${market.noShares.toFixed(0)} shares</div>
                </div>
            </div>
            ${market.resolved ? `<div class="market-resolved">🔒 RESOLVED: ${market.resolution.toUpperCase()}</div>` : ''}
        `;
        
        marketsList.appendChild(marketCard);
    });
}

// Open market modal
let currentMarket = null;
function openMarketModal(market) {
    if (market.resolved) {
        alert('This market has already been resolved!');
        return;
    }
    
    currentMarket = market;
    const modal = document.getElementById('marketModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalInfo = document.getElementById('modalMarketInfo');
    
    const charData = CHARACTER_DATA[market.character] || { image: '', bio: '' };
    modalTitle.textContent = market.title;
    modalInfo.innerHTML = `
        <div class="modal-character-header">
            <img 
                src="${charData.image || 'https://emotionull.art/wp-content/uploads/2022/12/punkrockbee-768x768.png'}" 
                alt="${market.character}" 
                class="modal-character-image" 
                onerror="this.onerror=null;this.src='https://emotionull.art/wp-content/uploads/2022/12/punkrockbee-768x768.png';"
            >
            <div>
                <p><strong>Character:</strong> ${market.character}</p>
                ${charData.bio ? `<p class="modal-character-bio">${charData.bio}</p>` : ''}
            </div>
        </div>
        <p>${market.description}</p>
        <div class="modal-odds">
            <div>YES: ${((market.yesShares / (market.yesShares + market.noShares)) * 100).toFixed(1)}%</div>
            <div>NO: ${((market.noShares / (market.yesShares + market.noShares)) * 100).toFixed(1)}%</div>
        </div>
    `;
    
    modal.classList.add('show');
    document.getElementById('betAmount').value = '10';
    document.getElementById('modalStatus').textContent = '';
    document.getElementById('modalStatus').className = 'modal-status';
    
    // Update price history for movement indicators
    updatePriceHistory(market);
}

// Set bet amount from quick button (no auto-focus to avoid scroll jumping)
function setBetAmount(amount) {
    const input = document.getElementById('betAmount');
    if (input) {
        input.value = amount;
        // Visual feedback
        input.style.transform = 'scale(1.05)';
        setTimeout(() => {
            input.style.transform = 'scale(1)';
        }, 200);
    }
}

// Update player stats display
function updatePlayerStats() {
    const statsEl = document.getElementById('playerStats');
    if (!statsEl) return;

    const winRate = playerState.totalBets > 0
        ? (((playerState.totalWonPNR > 0 ? 1 : 0) / playerState.totalBets) * 100).toFixed(1)
        : '0.0';

    statsEl.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Total Bets</div>
            <div class="stat-value">${playerState.totalBets}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Win Streak</div>
            <div class="stat-value ${playerState.streak >= 3 ? 'streak-hot' : ''}">${playerState.streak} 🔥</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Best Streak</div>
            <div class="stat-value">${playerState.bestStreak}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Total Won</div>
            <div class="stat-value">${playerState.totalWonPNR.toFixed(2)} PNR</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Traits Unlocked</div>
            <div class="stat-value">${playerState.traits.length}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Achievements</div>
            <div class="stat-value">${playerState.achievements.length}</div>
        </div>
    `;

    // Update traits list
    const traitsEl = document.getElementById('playerTraits');
    if (traitsEl) {
        if (playerState.traits.length === 0) {
            traitsEl.innerHTML = '<div class="no-traits">No traits unlocked yet. Win 3+ in a row!</div>';
        } else {
            traitsEl.innerHTML = playerState.traits.map(t =>
                `<div class="trait-badge">🎁 ${t}</div>`
            ).join('');
        }
    }

    // Update achievements list
    const achievementsEl = document.getElementById('playerAchievements');
    if (achievementsEl) {
        if (!playerState.achievements || playerState.achievements.length === 0) {
            achievementsEl.innerHTML = '<div class="no-achievements">No achievements yet. Start betting!</div>';
        } else {
            achievementsEl.innerHTML = playerState.achievements.map(achId => {
                const ach = ACHIEVEMENTS[achId];
                return ach ? `<div class="achievement-badge" title="${ach.desc}">${ach.icon} ${ach.name}</div>` : '';
            }).join('');
        }
    }

    // Update emotion index
    updateEmotionIndex();
}

// Update emotion index visualization
function updateEmotionIndex() {
    const indexEl = document.getElementById('emotionIndex');
    if (!indexEl) return;

    const total = playerState.emotionIndex.dreamstate +
                  playerState.emotionIndex.anxiety +
                  playerState.emotionIndex.gooberJoy;

    if (total === 0) {
        indexEl.innerHTML = '<div class="no-emotion-data">No emotion data yet. Start betting!</div>';
        return;
    }

    const dreamPct = (playerState.emotionIndex.dreamstate / total * 100).toFixed(1);
    const anxPct = (playerState.emotionIndex.anxiety / total * 100).toFixed(1);
    const gooberPct = (playerState.emotionIndex.gooberJoy / total * 100).toFixed(1);

    indexEl.innerHTML = `
        <div class="emotion-bar">
            <div class="emotion-label">Dreamstate</div>
            <div class="emotion-progress">
                <div class="emotion-fill dreamstate" style="width: ${dreamPct}%"></div>
            </div>
            <div class="emotion-value">${dreamPct}%</div>
        </div>
        <div class="emotion-bar">
            <div class="emotion-label">Anxiety</div>
            <div class="emotion-progress">
                <div class="emotion-fill anxiety" style="width: ${anxPct}%"></div>
            </div>
            <div class="emotion-value">${anxPct}%</div>
        </div>
        <div class="emotion-bar">
            <div class="emotion-label">Goober Joy</div>
            <div class="emotion-progress">
                <div class="emotion-fill goober" style="width: ${gooberPct}%"></div>
            </div>
            <div class="emotion-value">${gooberPct}%</div>
        </div>
    `;
}

// Update jackpot display
function updateJackpotDisplay() {
    const jackpotEl = document.getElementById('dreamstateJackpot');
    if (!jackpotEl) return;

    jackpotEl.innerHTML = `
        <div class="jackpot-amount">${dreamstateJackpot.poolPNR.toFixed(2)} PNR</div>
        <div class="jackpot-label">Dreamstate Jackpot</div>
        ${dreamstateJackpot.lastWinner
            ? `<div class="jackpot-last">Last winner: ${dreamstateJackpot.lastWinner.substring(0, 6)}...${dreamstateJackpot.lastWinner.substring(38)}</div>`
            : '<div class="jackpot-last">No winners yet. 1% chance on any win!</div>'
        }
    `;
}

// Render event feed
function renderEventFeed() {
    const feedEl = document.getElementById('eventFeed');
    if (!feedEl) return;

    if (!recentEvents || recentEvents.length === 0) {
        feedEl.innerHTML = '<div class="no-events">No events yet. Start betting to see activity!</div>';
        return;
    }

    feedEl.innerHTML = recentEvents.slice(0, 20).map(evt => {
        const timeAgo = Math.floor((Date.now() - evt.ts) / 1000);
        const timeStr = timeAgo < 60 ? `${timeAgo}s ago` :
                        timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` :
                        `${Math.floor(timeAgo / 3600)}h ago`;

        let icon = '💸';
        if (evt.type === 'bet') icon = '💸';
        if (evt.type === 'resolution') icon = evt.won ? '✅' : '❌';
        if (evt.type === 'cashout') icon = '💰';
        if (evt.type === 'trait') icon = '🎁';
        if (evt.type === 'jackpot') icon = '🎰';

        return `
            <div class="event-item">
                <span class="event-icon">${icon}</span>
                <span class="event-text">${evt.user || 'Anonymous'} ${getEventText(evt)}</span>
                <span class="event-time">${timeStr}</span>
            </div>
        `;
    }).join('');
}

// Get human-readable event text
function getEventText(evt) {
    switch (evt.type) {
        case 'bet':
            return `bet ${evt.amount} PNR on ${evt.side} - ${evt.market}`;
        case 'resolution':
            return `${evt.won ? 'won' : 'lost'} on ${evt.market} (${evt.result})`;
        case 'cashout':
            return `cashed out ${evt.amount} PNR from ${evt.market}`;
        case 'trait':
            return `unlocked trait: ${evt.trait}`;
        case 'jackpot':
            return `won DREAMSTATE JACKPOT: ${evt.amount} PNR!`;
        default:
            return 'did something';
    }
}

// Track price history for movement indicators
function updatePriceHistory(market) {
    if (!marketPriceHistory[market.id]) {
        marketPriceHistory[market.id] = [];
    }
    
    const totalShares = market.yesShares + market.noShares;
    const yesPrice = market.yesShares / totalShares;
    
    marketPriceHistory[market.id].push({
        price: yesPrice,
        timestamp: Date.now()
    });
    
    // Keep last 10 price points
    if (marketPriceHistory[market.id].length > 10) {
        marketPriceHistory[market.id].shift();
    }
}

// Get price movement indicator
function getPriceMovement(marketId) {
    const history = marketPriceHistory[marketId];
    if (!history || history.length < 2) return null;
    
    const current = history[history.length - 1].price;
    const previous = history[history.length - 2].price;
    const change = current - previous;
    
    if (Math.abs(change) < 0.001) return null; // No significant change
    
    return {
        direction: change > 0 ? 'up' : 'down',
        change: Math.abs(change * 100)
    };
}

// Set market filter
function setMarketFilter(filter) {
    marketFilter = filter;
    renderMarkets();
}

// Set market sort
function setMarketSort(sort) {
    marketSort = sort;
    renderMarkets();
}

// Close modal
document.querySelector('.close').onclick = function() {
    document.getElementById('marketModal').classList.remove('show');
    currentMarket = null;
};

window.onclick = function(event) {
    const modal = document.getElementById('marketModal');
    if (event.target === modal) {
        modal.classList.remove('show');
        currentMarket = null;
    }
};

// Place bet
async function placeBet(side) {
    if (typeof ethers === 'undefined') {
        alert('Ethers.js library is not loaded. Please refresh the page.');
        return;
    }
    
    if (!signer) {
        alert('Please connect your wallet first!');
        return;
    }
    
    if (!currentMarket) {
        alert('No market selected!');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('betAmount').value);
    if (!betAmount || betAmount <= 0) {
        alert('Please enter a valid bet amount!');
        return;
    }
    
    const statusEl = document.getElementById('modalStatus');
    statusEl.className = 'modal-status pending';
    statusEl.textContent = '💸 Processing bet...';
    
    try {
        // Calculate house fee (2% of bet) - this goes to house wallet
        const houseFee = betAmount * HOUSE_FEE_PERCENT;
        const betAfterFee = betAmount - houseFee;
        
        // Transfer full bet amount to house (house keeps the fee, rest goes to pool)
        const betAmountWei = ethers.utils.parseUnits(betAmount.toString(), pnrDecimals);
        const balance = await pnrContract.balanceOf(walletAddress);
        
        if (balance.lt(betAmountWei)) {
            throw new Error('Insufficient PNR balance');
        }
        
        const tx = await pnrContract.transfer(HOUSE_WALLET, betAmountWei);
        statusEl.textContent = `💸 Transaction sent: ${tx.hash.substring(0, 10)}... (Fee: ${houseFee.toFixed(2)} PNR)`;
        
        await tx.wait();
        
        // Calculate shares received based on current odds (after fee is deducted from pool)
        const totalShares = currentMarket.yesShares + currentMarket.noShares;
        const price = side === true 
            ? currentMarket.yesShares / totalShares 
            : currentMarket.noShares / totalShares;
        
        // Prevent division by zero
        if (price <= 0 || totalShares === 0) {
            throw new Error('Invalid market price');
        }
        
        // Shares = bet amount (after fee) / price
        // The fee (houseFee) stays with house, only betAfterFee goes into the market pool
        const sharesReceived = betAfterFee / price;
        
        // Update market shares (only the bet amount after fee goes into the pool)
        if (side === true) {
            currentMarket.yesShares += sharesReceived;
        } else {
            currentMarket.noShares += sharesReceived;
        }
        
        saveMarkets();
        
        // Save user position
        if (!userPositions[currentMarket.id]) {
            userPositions[currentMarket.id] = { side: side ? 'yes' : 'no', amount: 0, shares: 0 };
        }
        
        if (userPositions[currentMarket.id].side === (side ? 'yes' : 'no')) {
            userPositions[currentMarket.id].amount += betAmount;
            userPositions[currentMarket.id].shares += sharesReceived;
        } else {
            // User is betting opposite side - this is simplified
            userPositions[currentMarket.id].amount += betAmount;
            userPositions[currentMarket.id].shares += sharesReceived;
        }
        
        savePositions();
        
        // Update player state
        playerState.totalBets++;
        if (currentMarket.mood) {
            playerState.emotionIndex[currentMarket.mood] = (playerState.emotionIndex[currentMarket.mood] || 0) + 1;
        }
        savePlayerState();
        
        // Check achievements
        checkAchievements('bet', { amount: betAmount });
        
        // Visual feedback - bet animation
        showBetAnimation(betAmount, side ? 'YES' : 'NO');
        
        // Add portion to Dreamstate Jackpot (5% of bet after fee)
        const jackpotContribution = betAfterFee * 0.05;
        dreamstateJackpot.poolPNR += jackpotContribution;
        saveJackpot();
        
        // Log event
        logEvent({
            type: 'bet',
            market: currentMarket.title,
            character: currentMarket.character,
            side: side ? 'YES' : 'NO',
            amount: betAmount.toFixed(2),
            user: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Anonymous'
        });
        
        statusEl.className = 'modal-status success';
        statusEl.textContent = `✅ Bet placed! You received ${sharesReceived.toFixed(2)} shares at ${(price * 100).toFixed(1)}% (House fee: ${houseFee.toFixed(2)} PNR)`;
        
    // Update price history
    updatePriceHistory(currentMarket);
    
    // Update displays
    renderMarkets();
    updatePositionsDisplay();
    updateBalance();
    updatePlayerStats();
    updateJackpotDisplay();
        
        // Close modal after 2 seconds
        setTimeout(() => {
            document.getElementById('marketModal').classList.remove('show');
            currentMarket = null;
        }, 2000);
        
    } catch (error) {
        console.error('Bet error:', error);
        statusEl.className = 'modal-status error';
        statusEl.textContent = `❌ Error: ${error.message}`;
    }
}

// Update positions display with real-time values and cash out buttons
function updatePositionsDisplay() {
    const positionsList = document.getElementById('positionsList');
    
    const allPositions = Object.entries(userPositions).filter(([marketId, position]) => {
        return position && position.shares > 0;
    });
    
    if (allPositions.length === 0) {
        positionsList.innerHTML = '<p class="empty-state">No active positions. Place a bet to get started!</p>';
        return;
    }
    
    positionsList.innerHTML = '';
    
    allPositions.forEach(([marketId, position]) => {
        const market = MARKETS.find(m => m.id === marketId);
        if (!market) return;
        
        const totalShares = market.yesShares + market.noShares;
        let value, profit, profitPercent;
        
        if (market.resolved) {
            // Market resolved - calculate final payout (with house edge on winners)
            const won = position.side === market.resolution;
            if (won) {
                const winningShares = market.resolution === 'yes' ? market.yesShares : market.noShares;
                let basePayout = position.shares * (totalShares / winningShares);
                // Apply house edge so winners get slightly less than fair value
                const HOUSE_EDGE_CASHOUT = 0.9; // 10% cut on resolved payout
                value = basePayout * HOUSE_EDGE_CASHOUT;
                profit = value - position.amount;
                profitPercent = ((profit / position.amount) * 100);
            } else {
                // Loser gets 0
                value = 0;
                profit = -position.amount;
                profitPercent = -100;
            }
        } else {
            // Market active - current value based on odds, with slight time-based decay for vibes
            const price = position.side === 'yes' 
                ? market.yesShares / totalShares 
                : market.noShares / totalShares;
            let fairValue = position.shares * price;

            // Time-based drift: as we approach endsAt, displayed value drifts slightly down
            const now = Date.now();
            const lifeSpan = Math.max(market.endsAt - market.createdAt, 1);
            const elapsed = Math.min(Math.max(now - market.createdAt, 0), lifeSpan);
            const progress = elapsed / lifeSpan; // 0 -> 1
            // Drift factor from 1.0 down to ~0.9 near expiry
            const DRIFT_MIN = 0.9;
            const driftFactor = 1 - (1 - DRIFT_MIN) * Math.pow(progress, 1.2);

            value = fairValue * driftFactor;
            profit = value - position.amount;
            profitPercent = ((profit / position.amount) * 100);
        }
        
        const positionCard = document.createElement('div');
        const won = market.resolved && position.side === market.resolution;
        const lost = market.resolved && position.side !== market.resolution;
        
        positionCard.className = `position-card ${won ? 'position-won' : lost ? 'position-lost' : ''}`;
        
        const timeLeft = market.resolved ? 'Resolved' : formatTimeLeft(market.endsAt);
        const statusBadge = market.resolved 
            ? `<span class="status-badge ${won ? 'badge-won' : 'badge-lost'}">${won ? '✅ WON' : '❌ LOST'}</span>`
            : `<span class="status-badge badge-active">⏱ ${timeLeft}</span>`;
        
        positionCard.innerHTML = `
            <div class="position-info">
                <div class="position-header">
                    <div class="position-title">${market.title}</div>
                    ${statusBadge}
                </div>
                <div class="position-details">
                    ${position.side.toUpperCase()} • ${position.shares.toFixed(2)} shares • 
                    ${market.resolved ? `Result: ${market.resolution.toUpperCase()}` : `${((position.side === 'yes' ? market.yesShares : market.noShares) / totalShares * 100).toFixed(1)}% odds`}
                </div>
                <div class="position-stats">
                    <span class="stat-item">Invested: ${position.amount.toFixed(2)} PNR</span>
                    <span class="stat-item ${profit >= 0 ? 'profit' : 'loss'}">
                        ${profit >= 0 ? '+' : ''}${profit.toFixed(2)} PNR (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(1)}%)
                    </span>
                </div>
            </div>
            <div class="position-right">
                <div class="position-value ${profit >= 0 ? 'value-profit' : 'value-loss'}">
                    ${value.toFixed(2)} PNR
                </div>
                ${market.resolved && won && value > 0 ? `
                    <button class="btn btn-cashout" onclick="cashOutPosition('${marketId}')">
                        💰 Cash Out
                    </button>
                ` : ''}
            </div>
        `;
        
        positionsList.appendChild(positionCard);
    });
}

// Format time left until market ends
function formatTimeLeft(endsAt) {
    const now = Date.now();
    const diff = endsAt - now;
    
    if (diff <= 0) return 'Ending...';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

// Cash out resolved position
async function cashOutPosition(marketId) {
    if (typeof ethers === 'undefined') {
        alert('Ethers.js library is not loaded. Please refresh the page.');
        return;
    }
    
    if (!signer) {
        alert('Please connect your wallet first!');
        return;
    }
    
    const market = MARKETS.find(m => m.id === marketId);
    const position = userPositions[marketId];
    
    if (!market || !position || !market.resolved) {
        alert('Invalid position or market not resolved yet!');
        return;
    }
    
    const won = position.side === market.resolution;
    if (!won) {
        alert('You lost this bet. Nothing to cash out.');
        return;
    }
    
    // Calculate payout based on final market state
    const totalShares = market.yesShares + market.noShares;
    const winningShares = market.resolution === 'yes' ? market.yesShares : market.noShares;
    
    if (winningShares === 0) {
        alert('Invalid market state. Cannot calculate payout.');
        return;
    }
    
    // Payout = user's shares * (total pool / winning shares), with house edge
    const HOUSE_EDGE_CASHOUT = 0.9; // 10% less than fair value
    const basePayout = position.shares * (totalShares / winningShares);
    const payout = basePayout * HOUSE_EDGE_CASHOUT;
    
    if (payout <= 0) {
        alert('No payout available.');
        return;
    }
    
    try {
        // NOTE: In a real system, you'd need a smart contract that holds house funds
        // and automatically pays out winners. For now, we'll simulate the payout.
        
        // The house wallet would need to send tokens back to the user
        // This requires either:
        // 1. A smart contract that holds funds and auto-pays
        // 2. Manual payouts from house wallet
        // 3. A relayer service
        
        // For demo purposes, we'll track the payout and show it
        const payoutWei = ethers.utils.parseUnits(payout.toFixed(6), pnrDecimals);
        
        // Show confirmation
        const confirmed = confirm(
            `💰 Cash Out ${payout.toFixed(2)} PNR?\n\n` +
            `Your position: ${position.shares.toFixed(2)} shares\n` +
            `Market result: ${market.resolution.toUpperCase()}\n\n` +
            `House edge: 10% applied to final payout.\n\n` +
            `Note: In production, this would automatically transfer from the house wallet. ` +
            `For now, this payout is tracked in your stats.`
        );
        
        if (!confirmed) return;
        
        // Remove position after cashing out
        delete userPositions[marketId];
        savePositions();
        
        // Update displays
        updatePositionsDisplay();
        updateBalance();
        
        // Update player state
        playerState.totalWonPNR += payout;
        playerState.streak++;
        if (playerState.streak > playerState.bestStreak) {
            playerState.bestStreak = playerState.streak;
        }
        savePlayerState();
        
        // Check for trait unlock on win
        checkTraitUnlock(market, true);
        
        // Log event
        logEvent({
            type: 'cashout',
            market: market.title,
            amount: payout.toFixed(2),
            user: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Anonymous'
        });
        
        alert(`✅ Position cashed out! Payout: ${payout.toFixed(2)} PNR\n\nIn production, this would be sent to your wallet automatically.`);
        
        updatePlayerStats();
        
    } catch (error) {
        console.error('Cash out error:', error);
        alert('Error cashing out: ' + error.message);
    }
}

// Check and unlock achievements
function checkAchievements(type, data = {}) {
    const newAchievements = [];
    
    // First bet
    if (type === 'bet' && playerState.totalBets === 1 && !playerState.achievements.includes('first_bet')) {
        newAchievements.push('first_bet');
    }
    
    // Streak achievements
    if (playerState.streak === 3 && !playerState.achievements.includes('streak_3')) {
        newAchievements.push('streak_3');
    }
    if (playerState.streak === 5 && !playerState.achievements.includes('streak_5')) {
        newAchievements.push('streak_5');
    }
    if (playerState.streak === 10 && !playerState.achievements.includes('streak_10')) {
        newAchievements.push('streak_10');
    }
    
    // Big bet
    if (type === 'bet' && data.amount >= 500 && !playerState.achievements.includes('big_bet')) {
        newAchievements.push('big_bet');
    }
    
    // Jackpot winner
    if (type === 'jackpot' && !playerState.achievements.includes('jackpot_winner')) {
        newAchievements.push('jackpot_winner');
    }
    
    // Trader achievements
    if (playerState.totalBets === 10 && !playerState.achievements.includes('trader')) {
        newAchievements.push('trader');
    }
    if (playerState.totalBets === 50 && !playerState.achievements.includes('whale')) {
        newAchievements.push('whale');
    }
    
    // All traits
    if (playerState.traits.length >= 9 && !playerState.achievements.includes('all_traits')) {
        newAchievements.push('all_traits');
    }
    
    // Unlock new achievements
    newAchievements.forEach(achId => {
        if (!playerState.achievements.includes(achId)) {
            playerState.achievements.push(achId);
            showAchievementUnlock(achId);
        }
    });
    
    if (newAchievements.length > 0) {
        savePlayerState();
        updatePlayerStats();
    }
}

// Show achievement unlock
function showAchievementUnlock(achId) {
    const achievement = ACHIEVEMENTS[achId];
    if (!achievement) return;
    
    // Create achievement notification
    const achEl = document.createElement('div');
    achEl.className = 'achievement-unlock';
    achEl.innerHTML = `
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
            <div class="achievement-title">Achievement Unlocked!</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
        </div>
    `;
    document.body.appendChild(achEl);
    
    // Animate in
    setTimeout(() => achEl.classList.add('show'), 10);
    
    // Remove after animation
    setTimeout(() => {
        achEl.classList.remove('show');
        setTimeout(() => achEl.remove(), 500);
    }, 3000);
    
    // Confetti effect
    createConfetti(achEl);
}

// Visual effects - Confetti
function createConfetti(element) {
    const colors = ['#9b59b6', '#4ecdc4', '#f39c12', '#e74c3c', '#2ecc71'];
    const count = 30;
    
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
        element.appendChild(confetti);
    }
}

// Show bet animation
function showBetAnimation(amount, side) {
    const animation = document.createElement('div');
    animation.className = 'bet-animation';
    animation.innerHTML = `
        <div class="bet-animation-content">
            <div class="bet-amount-display">${amount} PNR</div>
            <div class="bet-side-display">${side}</div>
        </div>
    `;
    document.body.appendChild(animation);
    
    setTimeout(() => animation.classList.add('show'), 10);
    setTimeout(() => {
        animation.classList.remove('show');
        setTimeout(() => animation.remove(), 500);
    }, 1500);
}

// Show win/loss animation
function showWinLossAnimation(won, amount) {
    const animation = document.createElement('div');
    animation.className = `winloss-animation ${won ? 'win' : 'loss'}`;
    animation.innerHTML = `
        <div class="winloss-content">
            <div class="winloss-icon">${won ? '🎉' : '💔'}</div>
            <div class="winloss-text">${won ? 'WIN!' : 'LOSS'}</div>
            ${amount ? `<div class="winloss-amount">${won ? '+' : '-'}${amount} PNR</div>` : ''}
        </div>
    `;
    document.body.appendChild(animation);
    
    setTimeout(() => animation.classList.add('show'), 10);
    
    if (won) {
        createConfetti(animation);
    }
    
    setTimeout(() => {
        animation.classList.remove('show');
        setTimeout(() => animation.remove(), 500);
    }, 2500);
}

// Process market resolution - update stats, oracle, traits, jackpot
function processMarketResolution(market) {
    // Check if user has a position
    const position = userPositions[market.id];
    if (position) {
        const won = position.side === market.resolution;
        
        // Calculate win/loss amount
        const totalShares = market.yesShares + market.noShares;
        const winningShares = market.resolution === 'yes' ? market.yesShares : market.noShares;
        const payout = won ? position.shares * (totalShares / winningShares) : 0;
        const winLossAmount = won ? payout - position.amount : position.amount;
        
        // Update player state
        if (won) {
            playerState.streak++;
            if (playerState.streak > playerState.bestStreak) {
                playerState.bestStreak = playerState.streak;
            }
            playerState.totalWonPNR += payout;
        } else {
            playerState.streak = 0;
            playerState.totalLostPNR += position.amount || 0;
        }
        savePlayerState();
        
        // Visual feedback
        showWinLossAnimation(won, winLossAmount);
        
        // Trigger Character Oracle
        showOracleMessage(market, won);
        
        // Check for trait unlock
        checkTraitUnlock(market, won);
        
        // Check for jackpot win (rare chance)
        checkJackpotWin(market, won);
        
        // Check achievements
        checkAchievements(won ? 'win' : 'loss', { amount: winLossAmount });
        
        // Log event
        logEvent({
            type: 'resolution',
            market: market.title,
            result: market.resolution.toUpperCase(),
            won: won,
            user: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Anonymous'
        });
    } else {
        // Market resolved but user has no position
        logEvent({
            type: 'resolution',
            market: market.title,
            result: market.resolution.toUpperCase(),
            won: false,
            user: 'Market resolved'
        });
    }
    
    updatePlayerStats();
}

// Show Character Oracle message
function showOracleMessage(market, won) {
    const storyArc = market.storyArc || 'default';
    const lines = ORACLE_LINES[storyArc] || ORACLE_LINES['default'];
    const message = won 
        ? lines.win[Math.floor(Math.random() * lines.win.length)]
        : lines.lose[Math.floor(Math.random() * lines.lose.length)];
    
    // Create oracle notification
    const oracleEl = document.getElementById('oracleMessage');
    if (oracleEl) {
        oracleEl.textContent = message;
        oracleEl.className = `oracle-message ${won ? 'oracle-win' : 'oracle-lose'}`;
        oracleEl.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            oracleEl.style.display = 'none';
        }, 5000);
    }
    
    // Also log to console for debugging
    console.log(`🔮 Oracle (${market.character}): ${message}`);
}

// Check and unlock traits
function checkTraitUnlock(market, won) {
    if (!won) return;
    
    const traitMap = {
        'boba-v-sheldon': {
            streak3: 'Boba\'s Whisper',
            streak5: 'Sheldon\'s Insight',
            streak10: 'Hidden Milk Moon'
        },
        'beach-dreams': {
            streak3: 'Quack\'s Transcendence',
            streak5: 'Beach Island Vibes',
            streak10: 'Interdimensional Kush'
        },
        'time-bend': {
            streak3: 'Lucy\'s Time Fragment',
            streak5: 'Purple Tuesday',
            streak10: 'Dream Emulation Master'
        }
    };
    
    const arcTraits = traitMap[market.storyArc] || {};
    const streak = playerState.streak;
    
    // Check for trait unlocks based on streak
    if (streak >= 10 && !playerState.traits.includes(arcTraits.streak10)) {
        unlockTrait(arcTraits.streak10);
    } else if (streak >= 5 && !playerState.traits.includes(arcTraits.streak5)) {
        unlockTrait(arcTraits.streak5);
    } else if (streak >= 3 && !playerState.traits.includes(arcTraits.streak3)) {
        unlockTrait(arcTraits.streak3);
    }
}

// Unlock a trait
function unlockTrait(traitName) {
    if (!traitName || playerState.traits.includes(traitName)) return;
    
    playerState.traits.push(traitName);
    savePlayerState();
    
    // Show trait unlock notification
    const traitEl = document.getElementById('traitUnlock');
    if (traitEl) {
        traitEl.textContent = `🎁 Trait Unlocked: ${traitName}`;
        traitEl.style.display = 'block';
        setTimeout(() => {
            traitEl.style.display = 'none';
        }, 5000);
    }
    
    logEvent({
        type: 'trait',
        trait: traitName,
        user: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Anonymous'
    });
    
    updatePlayerStats();
}

// Check for jackpot win (rare chance - 1% on win)
function checkJackpotWin(market, won) {
    if (!won || Math.random() > 0.01) return; // 1% chance
    
    // User wins the jackpot!
    const jackpotAmount = dreamstateJackpot.poolPNR;
    dreamstateJackpot.lastWinner = walletAddress;
    dreamstateJackpot.lastWinMarketId = market.id;
    dreamstateJackpot.poolPNR = 0; // Reset pool
    saveJackpot();
    
    // Check achievement
    checkAchievements('jackpot', { amount: jackpotAmount });
    
    // Show jackpot notification
    const jackpotEl = document.getElementById('jackpotWin');
    if (jackpotEl) {
        jackpotEl.innerHTML = `🎰 DREAMSTATE JACKPOT!<br>You won ${jackpotAmount.toFixed(2)} PNR!`;
        jackpotEl.style.display = 'block';
        setTimeout(() => {
            jackpotEl.style.display = 'none';
        }, 8000);
    }
    
    logEvent({
        type: 'jackpot',
        amount: jackpotAmount.toFixed(2),
        market: market.title,
        user: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 'Anonymous'
    });
    
    updateJackpotDisplay();
    updatePlayerStats();
}

// Initialize app - markets should render even without ethers
function initializeApp() {
    console.log('Initializing PhettaMarket...');
    
    // Render markets immediately (doesn't need ethers)
    try {
        loadMarkets(); // Load saved market states (if none, current MARKETS becomes the source of truth)
        loadPositions();
        loadPlayerState();
        loadJackpot();
        loadEvents();
        renderMarkets();
        updatePositionsDisplay();
        updatePlayerStats();
        updateJackpotDisplay();
        renderEventFeed();
        // Persist initial market deadlines so timers survive refresh
        saveMarkets();
        
        // Fetch token data on load (doesn't need wallet)
        fetchTokenData();
        
        console.log('Markets rendered');
    } catch (error) {
        console.error('Error rendering markets:', error);
    }
    
    // Setup wallet button (only works if ethers is loaded)
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', function() {
            if (typeof ethers === 'undefined') {
                alert('Ethers.js library is not loaded. Please refresh the page.');
                console.error('Ethers.js not found');
                return;
            }
            
            connectBtn.disabled = true;
            connectBtn.textContent = 'Connecting...';
            connectWallet().finally(() => {
                if (connectBtn) {
                    connectBtn.disabled = false;
                }
            });
        });
    }
    
    // Setup wallet event listeners
    if (typeof window.ethereum !== 'undefined') {
        // Handle account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // User disconnected
                const btn = document.getElementById('connectWallet');
                if (btn) btn.textContent = 'Connect Wallet';
                const info = document.getElementById('walletInfo');
                if (info) info.classList.add('hidden');
                provider = null;
                signer = null;
                walletAddress = null;
                pnrContract = null;
            } else {
                // Account switched - only reconnect if ethers is loaded
                if (typeof ethers !== 'undefined') {
                    connectWallet();
                }
            }
        });
        
        // Handle chain changes
        window.ethereum.on('chainChanged', (chainId) => {
            // Reload page on chain change
            window.location.reload();
        });
    }
    
    console.log('PhettaMarket initialized');
}

// Copy PNR address to clipboard
function copyAddress() {
    const address = PNR_CONTRACT;
    navigator.clipboard.writeText(address).then(() => {
        const codeEl = document.getElementById('pnrAddress');
        const originalText = codeEl.textContent;
        codeEl.textContent = 'Copied!';
        codeEl.style.color = '#4ecdc4';
        setTimeout(() => {
            codeEl.textContent = originalText;
            codeEl.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Address: ' + address);
    });
}

// Open Vibecoin buy page
function openVibecoinBuy() {
    // Vibecoin uses Uniswap v4 with bonding curve
    // Direct link to buy PNR on Uniswap (Vibecoin tokens trade via Uniswap)
    window.open(`https://app.uniswap.org/#/swap?outputCurrency=${PNR_CONTRACT}`, '_blank');
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

// Market resolution timer - check every second
let lastMarketRender = 0;
setInterval(() => {
    const now = Date.now();
    let needsUpdate = false;
    
    MARKETS.forEach(market => {
        if (!market.resolved && now >= market.endsAt) {
            // Market time expired - resolve it
            market.resolved = true;
            // Coin flip resolution (can be replaced with oracle/weighted logic)
            market.resolution = Math.random() < 0.5 ? 'yes' : 'no';
            needsUpdate = true;
            
            // Process resolution - update player stats, oracle, traits, jackpot
            processMarketResolution(market);
            
            console.log(`Market ${market.id} resolved: ${market.resolution}`);
        }
    });
    
    if (needsUpdate) {
        saveMarkets();
        renderMarkets();
        updatePositionsDisplay();
        lastMarketRender = now;
    }
    
    // Update timers on cards every second (but only re-render markets every 5 seconds to save performance)
    if (now - lastMarketRender > 5000) {
        renderMarkets();
        lastMarketRender = now;
    }
    
    // Always update position display (it's lightweight)
    updatePositionsDisplay();
}, 1000); // Check every second


