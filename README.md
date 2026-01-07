# 🎰 Phetta Needs Rent Gambling App 🎰

A fully functional gambling app for Farcaster that uses the PNR (Phetta Needs Rent) token with real token transfers!

## Features

- **💰 Buy Tokens**: Purchase PNR tokens directly via Uniswap integration
- **🪙 Coin Flip**: Double or nothing! Bet on heads or tails with real token transfers
- **🎲 Dice Roll**: Pick a number 1-6, win 6x if you're right!
- **🎰 Lucky Slots**: Spin the reels for a chance to win big!
- **🔗 Real Blockchain Integration**: All bets use actual token transfers on Ethereum

## ⚠️ IMPORTANT SETUP REQUIRED

### 1. Configure House Wallet

**CRITICAL**: You must set up a house wallet before the app will work!

1. Open `script.js`
2. Find this line (around line 7):
   ```javascript
   const HOUSE_WALLET = '0x0000000000000000000000000000000000000000';
   ```
3. Replace with your actual wallet address:
   ```javascript
   const HOUSE_WALLET = '0xYourActualWalletAddressHere';
   ```

**What is the house wallet?**
- This is where bet tokens are sent
- This is where winnings are paid from
- Make sure it has enough PNR tokens to pay out winners!

### 2. How Betting Works

1. **User places bet**: PNR tokens are transferred from user to house wallet
2. **Game plays**: Uses block hash for verifiable randomness
3. **If user wins**: Payout function is called (currently requires manual payouts or smart contract)

### 3. Payout System

**Current Implementation**: 
- The `payOut()` function is a placeholder
- In production, you have three options:

**Option A: Manual Payouts** (Simplest)
- Monitor wins and manually send tokens from house wallet
- Not scalable but works for small operations

**Option B: Smart Contract** (Recommended for Production)
- Deploy a gambling contract that holds house funds
- Contract automatically pays out winners
- More secure and verifiable

**Option C: Relayer Service**
- Use a service that monitors events and pays out automatically
- Requires backend infrastructure

## Setup & Deployment

1. **Update House Wallet**:
   - Edit `script.js` and set `HOUSE_WALLET` to your wallet address

2. **Host the files**: Upload all files to a web server:
   - Netlify (recommended)
   - Vercel
   - GitHub Pages
   - Any static hosting service

3. **Update Farcaster Frame Image**:
   - Create or find an image for your gambling app
   - Upload it to your server
   - Update line 7 in `index.html`:
     ```html
     <meta property="fc:frame:image" content="https://your-domain.com/phetta-gamble.png" />
     ```

4. **Deploy**: Once hosted, share the URL on Farcaster as a frame!

## How It Works

### Token Purchasing
- Users can click "Buy PNR with ETH" to open Uniswap
- Or use the direct Uniswap link
- After purchasing, refresh to see updated balance

### Gambling Flow
1. User connects wallet
2. User enters bet amount
3. User's PNR tokens are transferred to house wallet
4. Game uses blockchain block hash for randomness (verifiable!)
5. If user wins, payout is initiated
6. User's balance updates

### Randomness
- Uses Ethereum block hash for verifiable randomness
- More fair than client-side Math.random()
- Can be verified on-chain

## PNR Token Info

- **Contract Address**: `0xffe45fb9d4400904a49f5ac28ba6e74993410b01`
- **Symbol**: PNR
- **Name**: Phetta Needs Rent
- **Network**: Ethereum Mainnet

## Production Considerations

### Security
- ⚠️ Always verify house wallet has enough tokens
- ⚠️ Implement proper slippage protection for swaps
- ⚠️ Use a smart contract for automated payouts
- ⚠️ Add rate limiting to prevent spam

### Smart Contract Option

For production, consider deploying a gambling contract:

```solidity
// Simplified example structure
contract PhettaCasino {
    address public houseWallet;
    IERC20 public pnrToken;
    
    function placeBet(uint256 amount, bytes32 gameHash) external {
        // Transfer tokens from user
        // Store bet
        // Process game
    }
    
    function payoutWinner(address winner, uint256 amount) external {
        // Only callable by contract logic
        // Pay out tokens
    }
}
```

### Testing
- Test on testnet first (Sepolia/Goerli)
- Use test tokens
- Verify all transaction flows work
- Check gas costs

## Farcaster Frame Integration

The app includes Farcaster frame meta tags:
- `fc:frame` - Frame version
- `fc:frame:image` - Preview image
- `fc:frame:button:1` - "🪙 Heads" button
- `fc:frame:button:2` - "🪙 Tails" button  
- `fc:frame:button:3` - "🎰 Roll Dice" button

## Legal & Compliance

⚠️ **IMPORTANT**: 
- Gambling apps are regulated in many jurisdictions
- Ensure compliance with local laws
- Consider adding age verification
- Add responsible gambling warnings
- Check token sale regulations

## Support & Issues

If you encounter issues:
1. Check that house wallet is configured
2. Verify wallet has enough ETH for gas
3. Check that house wallet has PNR tokens for payouts
4. Verify you're on Ethereum mainnet
5. Check browser console for errors

## License

Have fun, but gamble responsibly! 🎉

