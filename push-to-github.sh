#!/bin/bash

# Script to push Phetta Gambling App to GitHub

echo "🚀 Preparing to push to GitHub..."
echo ""

# Check if remote already exists
if git remote | grep -q "origin"; then
    echo "✅ Remote 'origin' already exists"
    git remote -v
else
    echo "📝 Please create a new repository on GitHub first:"
    echo "   1. Go to https://github.com/new"
    echo "   2. Name it 'phetta-gamble' (or any name you like)"
    echo "   3. Don't initialize with README (we already have one)"
    echo "   4. Copy the repository URL"
    echo ""
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/phetta-gamble.git): " REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo "✅ Remote added: $REPO_URL"
    else
        echo "❌ No URL provided. Exiting."
        exit 1
    fi
fi

echo ""
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Go to https://vercel.com"
    echo "   2. Sign up/Login with GitHub"
    echo "   3. Click 'New Project'"
    echo "   4. Import your repository"
    echo "   5. Deploy!"
    echo ""
else
    echo "❌ Push failed. Make sure:"
    echo "   - You have a GitHub account"
    echo "   - You created the repository"
    echo "   - You have access to push"
fi

