#!/bin/bash

# Google Maps API Key Setup Script
# This script helps you add your Google Maps API key to the project

echo "🗺️  Google Maps API Key Setup"
echo "================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Your existing .env file was not modified."
        exit 0
    fi
fi

echo ""
echo "Please enter your Google Maps API key:"
echo "(It should look like: AIzaSyC1234567890abcdefghijklmnopqrstuv)"
echo ""
read -p "API Key: " api_key

# Validate that something was entered
if [ -z "$api_key" ]; then
    echo "❌ Error: No API key entered."
    exit 1
fi

# Validate the key format (should start with AIza)
if [[ ! $api_key =~ ^AIza ]]; then
    echo "⚠️  Warning: API key doesn't start with 'AIza'. Are you sure this is correct?"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 0
    fi
fi

# Create the .env file
echo "VITE_GOOGLE_MAPS_API_KEY=$api_key" > .env

echo ""
echo "✅ Success! Your .env file has been created."
echo ""
echo "📝 Contents of .env:"
echo "-------------------"
cat .env
echo "-------------------"
echo ""
echo "🔒 Important: This file contains sensitive information!"
echo "   - It's already in .gitignore (won't be committed to git)"
echo "   - Never share this file or commit it to GitHub"
echo ""
echo "📚 Next steps:"
echo "   1. Make sure you've enabled these APIs in Google Cloud Console:"
echo "      • Maps JavaScript API"
echo "      • Directions API"
echo ""
echo "   2. Restart your dev server:"
echo "      npm run dev"
echo ""
echo "   3. Open http://localhost:5173 in your browser"
echo ""
echo "   4. See GOOGLE_MAPS_SETUP.md for detailed setup instructions"
echo ""
echo "Happy coding! 🎉"
