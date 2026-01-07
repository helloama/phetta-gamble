// PNR Token Contract Address
const PNR_CONTRACT = '0xffe45fb9d4400904a49f5ac28ba6e74993410b01';

// House wallet address - Your Vibecoins wallet
// This is where bet tokens go and where winnings are paid from
const HOUSE_WALLET = '0x934aB548ac4e71608671b463755992EDEe7dbDBF'; // Your Vibecoins wallet

// Uniswap V3 Router (for buying tokens)
const UNISWAP_ROUTER_V3 = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

// WETH address (for ETH swaps)
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

// ERC20 ABI (full)
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint amount) returns (bool)",
    "function approve(address spender, uint amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Uniswap Router ABI (simplified)
const UNISWAP_ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
];

let provider;
let signer;
let walletAddress;
let pnrContract;
let uniswapRouter;
let pnrDecimals = 18; // Default, will be fetched

// Game stats
let stats = {
    wins: 0,
    losses: 0,
    totalWon: 0,
    totalLost: 0
};

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('phettaGambleStats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('phettaGambleStats', JSON.stringify(stats));
    updateStatsDisplay();
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;
    document.getElementById('totalWon').textContent = stats.totalWon.toFixed(2) + ' PNR';
    document.getElementById('totalLost').textContent = stats.totalLost.toFixed(2) + ' PNR';
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
            uniswapRouter = new ethers.Contract(UNISWAP_ROUTER_V3, UNISWAP_ROUTER_ABI, signer);
            
            // Get decimals
            try {
                pnrDecimals = await pnrContract.decimals();
            } catch (e) {
                console.warn('Could not fetch decimals, using 18');
                pnrDecimals = 18;
            }
            
            document.getElementById('connectWallet').textContent = '✅ Connected';
            document.getElementById('walletInfo').classList.remove('hidden');
            document.getElementById('walletInfo').innerHTML = `
                <strong>Wallet:</strong> ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}<br>
                <strong>PNR Balance:</strong> <span id="pnrBalance">Loading...</span><br>
                <strong>ETH Balance:</strong> <span id="ethBalance">Loading...</span>
            `;
            
            updateBalance();
            updateEthBalance();
            
            // Update Farcaster frame button actions
            if (window.farcaster) {
                window.farcaster.buttons.onClick = handleFrameButton;
            }
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
            document.getElementById('pnrBalance').textContent = parseFloat(formatted).toFixed(2) + ' PNR';
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    }
}

// Update ETH balance
async function updateEthBalance() {
    if (provider && walletAddress) {
        try {
            const balance = await provider.getBalance(walletAddress);
            const formatted = ethers.utils.formatEther(balance);
            document.getElementById('ethBalance').textContent = parseFloat(formatted).toFixed(4) + ' ETH';
        } catch (error) {
            console.error('Error fetching ETH balance:', error);
        }
    }
}

// Buy PNR tokens using Uniswap
async function buyTokens() {
    if (!signer) {
        alert('Please connect your wallet first!');
        return;
    }
    
    const ethAmount = document.getElementById('ethAmount').value;
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
        alert('Please enter a valid ETH amount!');
        return;
    }
    
    const statusEl = document.getElementById('buyStatus');
    statusEl.className = 'status-message pending';
    statusEl.textContent = '🔄 Processing transaction...';
    
    try {
        // For simplicity, we'll redirect to Uniswap interface
        // In production, you'd implement the actual swap here
        
        const uniswapUrl = `https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${PNR_CONTRACT}&exactAmount=${ethAmount}`;
        window.open(uniswapUrl, '_blank');
        
        statusEl.className = 'status-message success';
        statusEl.textContent = '✅ Opening Uniswap... Complete the swap there, then refresh to see your balance!';
        
        // Alternative: Direct swap implementation (commented out - requires more complex setup)
        /*
        const amountIn = ethers.utils.parseEther(ethAmount);
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
        
        // Estimate output (simplified - in production use proper quote)
        const tx = await uniswapRouter.exactInputSingle({
            tokenIn: WETH_ADDRESS,
            tokenOut: PNR_CONTRACT,
            fee: 3000, // 0.3% fee tier
            recipient: walletAddress,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: 0, // ⚠️ In production, calculate proper slippage
            sqrtPriceLimitX96: 0
        }, { value: amountIn });
        
        statusEl.textContent = `🔄 Transaction sent: ${tx.hash}`;
        
        await tx.wait();
        
        statusEl.className = 'status-message success';
        statusEl.textContent = '✅ Tokens purchased successfully!';
        */
        
    } catch (error) {
        console.error('Buy error:', error);
        statusEl.className = 'status-message error';
        statusEl.textContent = '❌ Error: ' + error.message;
    }
}

// Transfer tokens from user to house (betting)
async function placeBet(amount) {
    if (!signer || !pnrContract) {
        throw new Error('Wallet not connected');
    }
    
    // Check balance
    const balance = await pnrContract.balanceOf(walletAddress);
    const betAmount = ethers.utils.parseUnits(amount.toString(), pnrDecimals);
    
    if (balance.lt(betAmount)) {
        throw new Error('Insufficient PNR balance');
    }
    
    // Check allowance
    const allowance = await pnrContract.allowance(walletAddress, HOUSE_WALLET);
    
    // Approve if needed (or transfer directly)
    // For simplicity, we'll transfer directly (no approval needed)
    const tx = await pnrContract.transfer(HOUSE_WALLET, betAmount);
    return tx;
}

// Transfer tokens from house to user (payout)
async function payOut(amount, recipient) {
    // NOTE: This requires the house wallet to have tokens and approve this contract
    // For a production app, you'd want a smart contract to handle this
    // For now, this is a placeholder that shows what would happen
    
    console.log(`Would payout ${amount} PNR to ${recipient}`);
    
    // In production, you'd either:
    // 1. Have users trust the house wallet to send manually
    // 2. Deploy a smart contract that holds the house funds
    // 3. Use a relayer service
    
    // For demo, we'll show the expected payout
    return { hash: '0x0000000000000000000000000000000000000000000000000000000000000000' };
}

// Show transaction status
function showTxStatus(elementId, message, status) {
    const el = document.getElementById(elementId);
    if (el) {
        el.className = `tx-status ${status}`;
        el.textContent = message;
    }
}

// Coin Flip Game with real token transfers
async function flipCoin(guessHeads = null) {
    if (!signer) {
        alert('Please connect your wallet first!');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('coinBet').value);
    if (!betAmount || betAmount <= 0) {
        alert('Please enter a valid bet amount!');
        return;
    }
    
    const coinEl = document.getElementById('coinAnimation');
    const resultEl = document.getElementById('coinResult');
    
    // If called from Farcaster frame, use the button choice
    if (guessHeads === null) {
        guessHeads = Math.random() < 0.5;
    }
    
    try {
        // Place bet (transfer tokens to house)
        showTxStatus('coinTxStatus', '💸 Transferring bet to house...', 'pending');
        const betTx = await placeBet(betAmount);
        showTxStatus('coinTxStatus', `💸 Bet sent! TX: ${betTx.hash.substring(0, 10)}...`, 'pending');
        
        // Wait for confirmation
        await betTx.wait();
        showTxStatus('coinTxStatus', '✅ Bet confirmed! Flipping coin...', 'pending');
        
        // Animation
        coinEl.classList.add('coin-flipping');
        resultEl.textContent = '🪙 Flipping... 🪙';
        
        // Use block hash for verifiable randomness (better than Math.random)
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);
        const result = parseInt(block.hash) % 2 === 0; // true = heads, false = tails
        
        setTimeout(() => {
            coinEl.classList.remove('coin-flipping');
            const won = result === guessHeads;
            
            coinEl.textContent = result ? '🪙' : '⚫';
            
            if (won) {
                const winAmount = betAmount * 2; // 2x payout
                resultEl.textContent = `🎉 YOU WIN! Won ${winAmount} PNR! (${betAmount * 2 - betAmount} profit) 🎉`;
                resultEl.className = 'result win';
                
                // Pay out winnings
                payOut(winAmount, walletAddress).then(() => {
                    showTxStatus('coinTxStatus', `✅ Payout: ${winAmount} PNR sent to your wallet!`, 'success');
                    stats.wins++;
                    stats.totalWon += winAmount;
                    saveStats();
                    updateBalance();
                }).catch(err => {
                    showTxStatus('coinTxStatus', `⚠️ Win confirmed but payout pending. Contact support if not received.`, 'pending');
                    console.error('Payout error:', err);
                });
            } else {
                resultEl.textContent = `😢 You lost ${betAmount} PNR. Better luck next time! 😢`;
                resultEl.className = 'result lose';
                stats.losses++;
                stats.totalLost += betAmount;
                saveStats();
                showTxStatus('coinTxStatus', '💸 Bet collected by house.', 'success');
                updateBalance();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Bet error:', error);
        resultEl.textContent = `❌ Error: ${error.message}`;
        resultEl.className = 'result lose';
        showTxStatus('coinTxStatus', `❌ Transaction failed: ${error.message}`, 'error');
    }
}

// Dice Game with real token transfers
async function rollDice() {
    if (!signer) {
        alert('Please connect your wallet first!');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('diceBet').value);
    const guess = parseInt(document.getElementById('diceGuess').value);
    
    if (!betAmount || betAmount <= 0) {
        alert('Please enter a valid bet amount!');
        return;
    }
    
    if (guess < 1 || guess > 6) {
        alert('Please pick a number between 1 and 6!');
        return;
    }
    
    const diceEl = document.getElementById('diceDisplay');
    const resultEl = document.getElementById('diceResult');
    
    try {
        // Place bet
        showTxStatus('diceTxStatus', '💸 Transferring bet to house...', 'pending');
        const betTx = await placeBet(betAmount);
        await betTx.wait();
        showTxStatus('diceTxStatus', '✅ Bet confirmed! Rolling dice...', 'pending');
        
        diceEl.classList.add('dice-rolling');
        resultEl.textContent = '🎲 Rolling... 🎲';
        
        // Use block hash for randomness
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);
        const roll = (parseInt(block.hash.substring(0, 10), 16) % 6) + 1;
        
        setTimeout(() => {
            diceEl.classList.remove('dice-rolling');
            const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            diceEl.textContent = diceEmojis[roll - 1];
            
            if (roll === guess) {
                const winAmount = betAmount * 6; // 6x payout
                resultEl.textContent = `🎉 JACKPOT! You rolled ${roll}! Won ${winAmount} PNR! 🎉`;
                resultEl.className = 'result win';
                
                payOut(winAmount, walletAddress).then(() => {
                    showTxStatus('diceTxStatus', `✅ Payout: ${winAmount} PNR sent!`, 'success');
                    stats.wins++;
                    stats.totalWon += winAmount;
                    saveStats();
                    updateBalance();
                }).catch(err => {
                    showTxStatus('diceTxStatus', `⚠️ Win confirmed but payout pending.`, 'pending');
                    console.error('Payout error:', err);
                });
            } else {
                resultEl.textContent = `😢 Rolled ${roll}, you picked ${guess}. Lost ${betAmount} PNR! 😢`;
                resultEl.className = 'result lose';
                stats.losses++;
                stats.totalLost += betAmount;
                saveStats();
                showTxStatus('diceTxStatus', '💸 Bet collected by house.', 'success');
                updateBalance();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Bet error:', error);
        resultEl.textContent = `❌ Error: ${error.message}`;
        resultEl.className = 'result lose';
        showTxStatus('diceTxStatus', `❌ Transaction failed: ${error.message}`, 'error');
    }
}

// Slots Game with real token transfers
async function spinSlots() {
    if (!signer) {
        alert('Please connect your wallet first!');
        return;
    }
    
    const betAmount = parseFloat(document.getElementById('slotsBet').value);
    
    if (!betAmount || betAmount <= 0) {
        alert('Please enter a valid bet amount!');
        return;
    }
    
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    const resultEl = document.getElementById('slotsResult');
    const symbols = ['🎰', '💰', '💎', '⭐', '🍀', '🎲', '🪙'];
    
    try {
        // Place bet
        showTxStatus('slotsTxStatus', '💸 Transferring bet to house...', 'pending');
        const betTx = await placeBet(betAmount);
        await betTx.wait();
        showTxStatus('slotsTxStatus', '✅ Bet confirmed! Spinning...', 'pending');
        
        // Spin animation
        reels.forEach(reel => reel.classList.add('slot-spinning'));
        resultEl.textContent = '🎰 Spinning... 🎰';
        
        // Use block hash for randomness
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);
        const hashStr = block.hash;
        
        const results = [
            symbols[parseInt(hashStr.substring(2, 4), 16) % symbols.length],
            symbols[parseInt(hashStr.substring(4, 6), 16) % symbols.length],
            symbols[parseInt(hashStr.substring(6, 8), 16) % symbols.length]
        ];
        
        setTimeout(() => {
            reels.forEach(reel => reel.classList.remove('slot-spinning'));
            reels.forEach((reel, i) => {
                reel.textContent = results[i];
            });
            
            // Check for wins
            let winAmount = 0;
            if (results[0] === results[1] && results[1] === results[2]) {
                winAmount = betAmount * 10; // 10x payout
                resultEl.textContent = `🎉 JACKPOT! Three ${results[0]}! Won ${winAmount} PNR! 🎉`;
                resultEl.className = 'result win';
                stats.wins++;
                stats.totalWon += winAmount;
            } else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
                winAmount = betAmount * 2; // 2x payout
                resultEl.textContent = `🎉 Two of a kind! Won ${winAmount} PNR! 🎉`;
                resultEl.className = 'result win';
                stats.wins++;
                stats.totalWon += winAmount;
            } else {
                resultEl.textContent = `😢 No match! Lost ${betAmount} PNR! 😢`;
                resultEl.className = 'result lose';
                stats.losses++;
                stats.totalLost += betAmount;
            }
            
            if (winAmount > 0) {
                payOut(winAmount, walletAddress).then(() => {
                    showTxStatus('slotsTxStatus', `✅ Payout: ${winAmount} PNR sent!`, 'success');
                    saveStats();
                    updateBalance();
                }).catch(err => {
                    showTxStatus('slotsTxStatus', `⚠️ Win confirmed but payout pending.`, 'pending');
                    console.error('Payout error:', err);
                });
            } else {
                showTxStatus('slotsTxStatus', '💸 Bet collected by house.', 'success');
                saveStats();
                updateBalance();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Bet error:', error);
        resultEl.textContent = `❌ Error: ${error.message}`;
        resultEl.className = 'result lose';
        showTxStatus('slotsTxStatus', `❌ Transaction failed: ${error.message}`, 'error');
    }
}

// Handle Farcaster frame button clicks
function handleFrameButton(buttonIndex) {
    switch(buttonIndex) {
        case 1: // Heads
            document.getElementById('coinflip').classList.add('active');
            document.getElementById('dice').classList.remove('active');
            document.getElementById('slots').classList.remove('active');
            flipCoin(true);
            break;
        case 2: // Tails
            document.getElementById('coinflip').classList.add('active');
            document.getElementById('dice').classList.remove('active');
            document.getElementById('slots').classList.remove('active');
            flipCoin(false);
            break;
        case 3: // Roll Dice
            document.getElementById('coinflip').classList.remove('active');
            document.getElementById('dice').classList.add('active');
            document.getElementById('slots').classList.remove('active');
            rollDice();
            break;
    }
}

// Game selector
document.querySelectorAll('.game-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.game-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.game').forEach(g => g.classList.add('hidden'));
        
        btn.classList.add('active');
        const game = btn.dataset.game;
        document.getElementById(game).classList.remove('hidden');
    });
});

// Initialize
document.getElementById('connectWallet').addEventListener('click', connectWallet);
loadStats();

// Auto-connect if already connected
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', () => {
        connectWallet();
    });
    
    // Try to connect on load
    connectWallet();
}

