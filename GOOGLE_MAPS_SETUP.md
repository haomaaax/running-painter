# Google Maps API Setup Guide

Follow these steps to get your Google Maps API key and set up the Running Route Painter.

## Step 1: Create a Google Cloud Account

1. Go to https://console.cloud.google.com/
2. Sign in with your Google account (or create one)
3. Accept the Terms of Service if prompted

## Step 2: Create a New Project

1. Click the project dropdown at the top of the page
2. Click "NEW PROJECT"
3. Enter project name: **"Running Route Painter"**
4. Click "CREATE"
5. Wait for the project to be created (about 30 seconds)
6. Select your new project from the dropdown

## Step 3: Enable Billing

⚠️ **Important:** Google Maps requires a billing account, BUT you get $200 free credit every month!

1. Go to https://console.cloud.google.com/billing
2. Click "LINK A BILLING ACCOUNT" or "ADD BILLING ACCOUNT"
3. Follow the prompts to add a credit/debit card
4. **Don't worry:** You won't be charged unless you exceed $200/month
5. This app typically uses less than $10/month in development

**Free tier covers:**
- ~28,000 map loads per month
- ~40,000 directions requests per month
- Perfect for testing and personal use!

## Step 4: Enable Required APIs

You need to enable 2 APIs:

### Enable Maps JavaScript API

1. Go to https://console.cloud.google.com/apis/library
2. Search for **"Maps JavaScript API"**
3. Click on "Maps JavaScript API"
4. Click "ENABLE"
5. Wait for it to enable (about 10 seconds)

### Enable Directions API

1. Still in the API Library (https://console.cloud.google.com/apis/library)
2. Search for **"Directions API"**
3. Click on "Directions API"
4. Click "ENABLE"
5. Wait for it to enable

## Step 5: Create API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Click "CREATE CREDENTIALS" at the top
3. Select "API key"
4. Your API key will be created and displayed
5. **COPY THIS KEY** - you'll need it in a moment!
   - It looks like: `AIzaSyC...` (a long string)

## Step 6: Restrict Your API Key (IMPORTANT for Security!)

1. In the dialog that shows your API key, click "EDIT API KEY"
   - Or go back to Credentials page and click on your API key
2. Under "API restrictions":
   - Select "Restrict key"
   - Check only these 2 APIs:
     - ✅ Maps JavaScript API
     - ✅ Directions API
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Click "ADD AN ITEM"
   - Add: `localhost:5173/*`
   - Click "ADD AN ITEM" again
   - Add: `127.0.0.1:5173/*`
4. Click "SAVE"

## Step 7: Set Up Environment Variable

Now add your API key to the project:

1. Open your terminal
2. Navigate to the project directory:
   ```bash
   cd /Users/max_chen/sparkler/running-painter
   ```

3. Create a `.env` file with your API key:
   ```bash
   echo "VITE_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE" > .env
   ```

   **Replace `YOUR_API_KEY_HERE` with your actual API key!**

   Example:
   ```bash
   echo "VITE_GOOGLE_MAPS_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuv" > .env
   ```

4. Verify the file was created:
   ```bash
   cat .env
   ```

   You should see:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...
   ```

## Step 8: Restart the Dev Server

1. Stop the current dev server (Ctrl+C in the terminal where it's running)
2. Start it again:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Step 9: Test the App

1. The map should now load!
2. Allow location access when prompted
3. Try creating a route:
   - Select "Shape" mode
   - Choose "Heart"
   - Distance: 5 km
   - You should see the blue dashed path on the map!

## Troubleshooting

### "This page can't load Google Maps correctly"

**Solution:** Your API key is invalid or not set up correctly
- Check the `.env` file has the correct key
- Make sure you enabled both APIs (Maps JavaScript API and Directions API)
- Restart the dev server after adding the key

### "API key not valid. Please pass a valid API key"

**Solution:** The key format is wrong
- Make sure there are no spaces in the `.env` file
- The format should be: `VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...`
- No quotes around the key
- Restart dev server

### Map shows but says "For development purposes only"

**Solution:** This is normal! It means billing is not fully set up
- Add a billing account in Google Cloud Console
- The watermark will disappear

### "RefererNotAllowedMapError"

**Solution:** Your API key restrictions are too strict
- Go to Google Cloud Console → Credentials
- Edit your API key
- Under "Application restrictions", make sure `localhost:5173/*` is added
- Save and wait a few minutes for changes to propagate

## Cost Monitoring

To avoid unexpected charges:

1. Go to https://console.cloud.google.com/apis/dashboard
2. You can see your API usage here
3. Set up budget alerts:
   - Go to https://console.cloud.google.com/billing
   - Click "Budgets & alerts"
   - Create a budget for $10-20/month
   - You'll get email alerts if you approach this

## Next Steps

Once the map loads successfully:

1. ✅ Try creating a simple route (heart, 5km)
2. ✅ Click "Generate Running Route"
3. ✅ Export as GPX or Google Maps
4. ✅ Go for a run! 🏃‍♂️

## Need Help?

If you're still having issues:
1. Check the browser console for errors (F12 → Console tab)
2. Verify your API key is correct in the `.env` file
3. Make sure both APIs are enabled in Google Cloud Console
4. Wait 5-10 minutes after creating the key (it can take time to activate)

Happy running! 🎉
