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

// Phettaverse Prediction Markets - Weird, surreal, Adult Swim vibes
const MARKETS = [
    {
        id: 'phetta-cheese',
        title: 'Will Phetta find the cheese before the great awakening?',
        description: 'The purple rat is on a quest. Will he discover the legendary cheese stash hidden in the Clock Realm before reality bends?',
        character: 'Phetta',
        yesShares: 450,
        noShares: 550,
        resolved: false
    },
    {
        id: 'quack-kush',
        title: 'Will Quack smoke enough kush to transcend dimensions?',
        description: 'Quack has been chain-smoking on the beach islands. Will he achieve interdimensional consciousness or just pass out?',
        character: 'Quack',
        yesShares: 320,
        noShares: 680,
        resolved: false
    },
    {
        id: 'lucy-time-bend',
        title: 'Will Lucy bend time so hard that Tuesday becomes a color?',
        description: 'Lucy\'s Dream Emulation power is escalating. Scientists predict Tuesday might become a shade of purple. Will it happen?',
        character: 'Lucy',
        yesShares: 280,
        noShares: 720,
        resolved: false
    },
    {
        id: '2faced-double-cross',
        title: 'Will 2Faced successfully double-cross themselves?',
        description: 'With four eyes watching, 2Faced is attempting the ultimate meta-scam: scamming themselves. Can they pull it off twice?',
        character: '2Faced',
        yesShares: 600,
        noShares: 400,
        resolved: false
    },
    {
        id: 'cloudy-weather-control',
        title: 'Will Cloudy use his power orbs to make it rain plushies?',
        description: 'Cloudy controls the environment. Will he use this power to create a plushie rainstorm in Phettaverse City?',
        character: 'Cloudy',
        yesShares: 380,
        noShares: 620,
        resolved: false
    },
    {
        id: 'gummy-reality-distortion',
        title: 'Will Gummy remain peaceful while other mushrooms distort reality?',
        description: 'Unlike other mushroom creatures, Gummy is chill. But will the chaos around him finally break his zen?',
        character: 'Gummy',
        yesShares: 750,
        noShares: 250,
        resolved: false
    },
    {
        id: 'beatstar-party',
        title: 'Will Beatstar\'s bass drop create a new dimension?',
        description: 'Beatstar is DJing in his tech suit. The bass is getting intense. Will it literally tear a hole in spacetime?',
        character: 'Beatstar',
        yesShares: 420,
        noShares: 580,
        resolved: false
    },
    {
        id: 'chef-3d-print',
        title: 'Did Phetta 3D print Chef in a past timeline?',
        description: 'Chef is a squid-like ramen shop owner. Evidence suggests Phetta might have 3D printed them. Will we find proof?',
        character: 'Chef',
        yesShares: 500,
        noShares: 500,
        resolved: false
    },
    {
        id: 'jazz-ants-return',
        title: 'Will the Jazz Ants return to the Studio Room and drop a new album?',
        description: 'They\'ve been reactivated. Will they create the greatest jazz album in Phettaverse history?',
        character: 'Jazz Ants',
        yesShares: 550,
        noShares: 450,
        resolved: false
    },
    {
        id: 'robo-alien-internet',
        title: 'Will Robo-Alien use the internet to become self-aware and order pizza?',
        description: 'He has instant internet access. Will he achieve consciousness and order a pizza to the Phettaverse?',
        character: 'Robo-Alien',
        yesShares: 480,
        noShares: 520,
        resolved: false
    },
    {
        id: 'time-creature-clock-realm',
        title: 'Will the Time Creature make time go backwards in the Clock Realm?',
        description: 'Time is weird there already. Will it get so weird that causality breaks and effects happen before causes?',
        character: 'Time Creature',
        yesShares: 350,
        noShares: 650,
        resolved: false
    },
    {
        id: 'stoned-rabbit-awakening',
        title: 'Will Stoned Rabbit remember what happened during the great awakening?',
        description: 'Data was lost. Will Stoned Rabbit recover memories of the event that changed everything?',
        character: 'Stoned Rabbit',
        yesShares: 290,
        noShares: 710,
        resolved: false
    }
];

// Load positions from localStorage
function loadPositions() {
    const saved = localStorage.getItem('phettamarketPositions');
    if (saved) {
        userPositions = JSON.parse(saved);
        updatePositionsDisplay();
    }
}

// Save positions to localStorage
function savePositions() {
    localStorage.setItem('phettamarketPositions', JSON.stringify(userPositions));
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

// Render markets
function renderMarkets() {
    const marketsList = document.getElementById('marketsList');
    marketsList.innerHTML = '';
    
    MARKETS.forEach(market => {
        const totalShares = market.yesShares + market.noShares;
        const yesPrice = market.yesShares / totalShares;
        const noPrice = market.noShares / totalShares;
        
        const marketCard = document.createElement('div');
        marketCard.className = 'market-card';
        marketCard.onclick = () => openMarketModal(market);
        
        const volume = Math.floor((market.yesShares + market.noShares) / 10); // Simplified volume calc
        const charData = CHARACTER_DATA[market.character] || { image: '', bio: '' };
        
        marketCard.innerHTML = `
            <div class="market-volume">💰 ${volume}K Vol.</div>
            <div class="market-header">
                ${charData.image ? `<img src="${charData.image}" alt="${market.character}" class="character-image" onerror="this.style.display='none'">` : ''}
                <div class="market-header-text">
                    <div class="market-title">${market.title}</div>
                    <div class="market-character">${market.character}</div>
                </div>
            </div>
            <div class="market-description">${market.description}</div>
            ${charData.bio ? `<div class="character-bio">${charData.bio}</div>` : ''}
            <div class="market-odds">
                <div class="odds-yes">
                    <div class="odds-label">Yes</div>
                    <div class="odds-percentage">${(yesPrice * 100).toFixed(0)}%</div>
                    <div class="odds-shares">${market.yesShares.toFixed(0)} shares</div>
                </div>
                <div class="odds-no">
                    <div class="odds-label">No</div>
                    <div class="odds-percentage">${(noPrice * 100).toFixed(0)}%</div>
                    <div class="odds-shares">${market.noShares.toFixed(0)} shares</div>
                </div>
            </div>
            ${market.resolved ? '<div class="market-resolved">🔒 RESOLVED</div>' : ''}
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
            ${charData.image ? `<img src="${charData.image}" alt="${market.character}" class="modal-character-image" onerror="this.style.display='none'">` : ''}
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
        // Transfer tokens to house
        const betAmountWei = ethers.utils.parseUnits(betAmount.toString(), pnrDecimals);
        const balance = await pnrContract.balanceOf(walletAddress);
        
        if (balance.lt(betAmountWei)) {
            throw new Error('Insufficient PNR balance');
        }
        
        const tx = await pnrContract.transfer(HOUSE_WALLET, betAmountWei);
        statusEl.textContent = `💸 Transaction sent: ${tx.hash.substring(0, 10)}...`;
        
        await tx.wait();
        
        // Calculate shares received (simplified - in real market this would be more complex)
        const totalShares = currentMarket.yesShares + currentMarket.noShares;
        const price = side === true 
            ? currentMarket.yesShares / totalShares 
            : currentMarket.noShares / totalShares;
        const sharesReceived = betAmount / price;
        
        // Update market
        if (side === true) {
            currentMarket.yesShares += sharesReceived;
        } else {
            currentMarket.noShares += sharesReceived;
        }
        
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
        
        statusEl.className = 'modal-status success';
        statusEl.textContent = `✅ Bet placed! You received ${sharesReceived.toFixed(2)} shares at ${(price * 100).toFixed(1)}%`;
        
        // Update displays
        renderMarkets();
        updatePositionsDisplay();
        updateBalance();
        
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

// Update positions display
function updatePositionsDisplay() {
    const positionsList = document.getElementById('positionsList');
    
    const activePositions = Object.entries(userPositions).filter(([marketId, position]) => {
        const market = MARKETS.find(m => m.id === marketId);
        return market && !market.resolved && position.shares > 0;
    });
    
    if (activePositions.length === 0) {
        positionsList.innerHTML = '<p class="empty-state">No active positions. Place a bet to get started!</p>';
        return;
    }
    
    positionsList.innerHTML = '';
    
    activePositions.forEach(([marketId, position]) => {
        const market = MARKETS.find(m => m.id === marketId);
        const totalShares = market.yesShares + market.noShares;
        const price = position.side === 'yes' 
            ? market.yesShares / totalShares 
            : market.noShares / totalShares;
        const value = position.shares * price;
        
        const positionCard = document.createElement('div');
        positionCard.className = 'position-card';
        positionCard.innerHTML = `
            <div class="position-info">
                <div class="position-title">${market.title}</div>
                <div class="position-details">
                    ${position.side.toUpperCase()} • ${position.shares.toFixed(2)} shares • ${(price * 100).toFixed(1)}% odds
                </div>
            </div>
            <div class="position-value">${value.toFixed(2)} PNR</div>
        `;
        
        positionsList.appendChild(positionCard);
    });
}

// Initialize app - markets should render even without ethers
function initializeApp() {
    console.log('Initializing PhettaMarket...');
    
    // Render markets immediately (doesn't need ethers)
    try {
        loadPositions();
        renderMarkets();
        updatePositionsDisplay();
        
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

// Periodically resolve markets (randomly, for demo purposes)
// In production, this would be done by an oracle or admin
setInterval(() => {
    // Randomly resolve one unresolved market every 5 minutes (for demo)
    const unresolved = MARKETS.filter(m => !m.resolved);
    if (unresolved.length > 0 && Math.random() < 0.1) {
        const market = unresolved[Math.floor(Math.random() * unresolved.length)];
        // Coin flip resolution
        const result = Math.random() < 0.5;
        market.resolved = true;
        market.resolution = result ? 'yes' : 'no';
        
        // Update user positions (payout winners)
        if (userPositions[market.id]) {
            const position = userPositions[market.id];
            if (position.side === market.resolution) {
                // User wins - calculate payout
                const totalShares = market.yesShares + market.noShares;
                const payout = position.shares * (totalShares / (market.resolution === 'yes' ? market.yesShares : market.noShares));
                console.log(`Market ${market.id} resolved ${market.resolution}. Payout: ${payout} PNR`);
            }
        }
        
        renderMarkets();
        updatePositionsDisplay();
    }
}, 300000); // Check every 5 minutes

