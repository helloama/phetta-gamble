// PNR Token Contract Address
const PNR_CONTRACT = '0xffe45fb9d4400904a49f5ac28ba6e74993410b01';

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
    if (typeof window.ethereum !== 'undefined') {
        try {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();
            
            pnrContract = new ethers.Contract(PNR_CONTRACT, ERC20_ABI, signer);
            
            try {
                pnrDecimals = await pnrContract.decimals();
            } catch (e) {
                console.warn('Could not fetch decimals, using 18');
                pnrDecimals = 18;
            }
            
            document.getElementById('connectWallet').textContent = '✅ Connected';
            document.getElementById('walletInfo').classList.remove('hidden');
            
            await updateBalance();
            await fetchTokenData();
        } catch (error) {
            alert('Failed to connect wallet: ' + error.message);
        }
    } else {
        alert('Please install MetaMask or another Ethereum wallet!');
    }
}

// Update PNR balance
async function updateBalance() {
    if (pnrContract && walletAddress) {
        try {
            const balance = await pnrContract.balanceOf(walletAddress);
            const formatted = ethers.utils.formatUnits(balance, pnrDecimals);
            const balanceNum = parseFloat(formatted);
            
            document.getElementById('pnrBalance').textContent = balanceNum.toFixed(2) + ' PNR';
            
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
            
            document.getElementById('portfolioValue').textContent = portfolioValue.toFixed(2) + ' PNR';
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
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
            document.getElementById('tokenPrice').textContent = 
                token.currentPriceUsd ? `$${parseFloat(token.currentPriceUsd).toFixed(6)}` : 'N/A';
            document.getElementById('tokenMarketCap').textContent = 
                token.marketCapUsd ? `$${(parseFloat(token.marketCapUsd) / 1000000).toFixed(2)}M` : 'N/A';
            document.getElementById('tokenVolume').textContent = 
                token.totalVolumeUsd ? `$${(parseFloat(token.totalVolumeUsd) / 1000).toFixed(2)}K` : 'N/A';
        }
    } catch (error) {
        console.error('Error fetching token data:', error);
        document.getElementById('tokenPrice').textContent = 'Error loading';
        document.getElementById('tokenMarketCap').textContent = 'Error loading';
        document.getElementById('tokenVolume').textContent = 'Error loading';
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
        
        marketCard.innerHTML = `
            <div class="market-title">${market.title}</div>
            <div class="market-description">${market.description}</div>
            <div class="market-character">Character: <strong>${market.character}</strong></div>
            <div class="market-stats">
                <div class="market-stat yes-stat">
                    <span class="market-stat-label">YES</span>
                    <span class="market-stat-value">${(yesPrice * 100).toFixed(1)}%</span>
                    <span class="market-stat-shares">${market.yesShares} shares</span>
                </div>
                <div class="market-stat no-stat">
                    <span class="market-stat-label">NO</span>
                    <span class="market-stat-value">${(noPrice * 100).toFixed(1)}%</span>
                    <span class="market-stat-shares">${market.noShares} shares</span>
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
    
    modalTitle.textContent = market.title;
    modalInfo.innerHTML = `
        <p><strong>Character:</strong> ${market.character}</p>
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

// Initialize
document.getElementById('connectWallet').addEventListener('click', connectWallet);
loadPositions();
renderMarkets();
updatePositionsDisplay();

// Auto-connect if already connected
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', () => {
        connectWallet();
    });
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

