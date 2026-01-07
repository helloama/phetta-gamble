# ⚡ Quick Start - Deploy to Vercel via GitHub

## Step 1: Push to GitHub

### Option A: Use the script (Easiest)
```bash
cd ~/phetta-gamble
./push-to-github.sh
```

### Option B: Manual commands
```bash
cd ~/phetta-gamble

# 1. Create repo on GitHub first at: https://github.com/new
#    Name it "phetta-gamble" (don't initialize with README)

# 2. Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/phetta-gamble.git

# 3. Push
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`phetta-gamble`)
4. Vercel will auto-detect settings (no changes needed)
5. Click **"Deploy"**

That's it! 🎉 Your app will be live in ~30 seconds.

## Step 3: Update Frame Image URL

After deployment:

1. Copy your Vercel URL (e.g., `phetta-gamble.vercel.app`)
2. Update `index.html` line 7:
   ```html
   <meta property="fc:frame:image" content="https://YOUR-URL.vercel.app/phetta-gamble.png" />
   ```
3. Commit and push:
   ```bash
   git add index.html
   git commit -m "Update frame image URL"
   git push
   ```

Vercel auto-deploys on every push! ✨

## Your Files Are Ready

✅ Git repository initialized  
✅ All files committed  
✅ Vercel config ready  
✅ Ready to push to GitHub  

Just run `./push-to-github.sh` and follow the prompts!

