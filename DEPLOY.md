# 🚀 Deployment Guide - Vercel & GitHub

## Quick Deploy to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit - Phetta gambling app"
   git remote add origin https://github.com/YOUR_USERNAME/phetta-gamble.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your `phetta-gamble` repository
   - Vercel will auto-detect settings
   - Click "Deploy"

3. **Get your URL:**
   - Vercel will give you a URL like: `phetta-gamble.vercel.app`
   - Or set up custom domain in Vercel settings

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd ~/phetta-gamble
   vercel
   ```

3. **Follow prompts:**
   - Link to existing project or create new
   - Deploy to production

### Option 3: Drag & Drop on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Drag the entire `phetta-gamble` folder to the dashboard
3. Wait for deployment

## Update Farcaster Frame Image

After deployment, update `index.html` line 7:

```html
<meta property="fc:frame:image" content="https://YOUR-VERCEL-URL.vercel.app/phetta-gamble.png" />
```

Then commit and push:
```bash
git add index.html
git commit -m "Update frame image URL"
git push
```

Vercel will auto-deploy your changes!

## Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your domain (e.g., `gamble.yourdomain.com`)
3. Follow DNS instructions
4. Update frame image URL in `index.html`

## Environment Variables (If Needed Later)

If you add environment variables:
1. Vercel Dashboard → Project Settings → Environment Variables
2. Add variables like API keys
3. Access in code with `process.env.VARIABLE_NAME`

## Auto-Deploy on Push

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deployments

## Troubleshooting

- **404 errors**: Check that `vercel.json` routes are correct
- **CORS issues**: Headers are already set in `vercel.json`
- **Build fails**: This is a static site, should always work!

