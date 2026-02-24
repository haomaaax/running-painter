# Font Setup Instructions

The text-to-route feature requires a TrueType font (.ttf) file to convert text into path data. Follow these instructions to add a font to your project.

## Quick Setup (Recommended)

### Option 1: Use Roboto Bold (Free, Open Source)

1. Download Roboto Bold from Google Fonts:
   - Go to https://fonts.google.com/specimen/Roboto
   - Click "Download family"
   - Extract the ZIP file
   - Find `Roboto-Bold.ttf` in the `static` folder

2. Copy the font to your project:
   ```bash
   cp ~/Downloads/Roboto/static/Roboto-Bold.ttf public/fonts/
   ```

### Option 2: Use Arial Bold (If available on your system)

**macOS:**
```bash
cp /Library/Fonts/Arial\ Bold.ttf public/fonts/Arial-Bold.ttf
```

**Windows:**
```bash
copy C:\Windows\Fonts\arialbd.ttf public\fonts\Arial-Bold.ttf
```

**Linux:**
```bash
cp /usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf public/fonts/Arial-Bold.ttf
```

### Option 3: Download Free Fonts

Other good free, bold fonts that work well:

1. **Open Sans Bold**
   - https://fonts.google.com/specimen/Open+Sans
   - File: `OpenSans-Bold.ttf`

2. **Montserrat Bold**
   - https://fonts.google.com/specimen/Montserrat
   - File: `Montserrat-Bold.ttf`

3. **Oswald Bold**
   - https://fonts.google.com/specimen/Oswald
   - File: `Oswald-Bold.ttf`

## Installation

Once you have a font file:

1. Create the fonts directory if it doesn't exist:
   ```bash
   mkdir -p public/fonts
   ```

2. Copy your font file to `public/fonts/`:
   ```bash
   cp /path/to/your/font.ttf public/fonts/
   ```

3. Rename it to one of these names (or update the code):
   - `ArialBlack.ttf` (priority 1)
   - `Arial-Bold.ttf` (priority 2)
   - `Roboto-Bold.ttf` (priority 3)

4. Restart the development server if it's running

## Testing

After adding the font:

1. Open the app in your browser
2. Select "Text" mode
3. Enter some text (e.g., "2026")
4. You should see a preview of the text path in the canvas

If you see an error about missing fonts, check:
- The font file is in the correct location (`public/fonts/`)
- The filename matches one of the expected names
- The file is a valid `.ttf` file
- You've restarted the dev server

## Font Requirements

For best results, use fonts that are:
- **Bold or Black weight** - Thicker strokes work better for route generation
- **Sans-serif** - Simpler shapes are easier to recognize as routes
- **No decorative elements** - Avoid cursive, script, or highly stylized fonts

## Troubleshooting

### "No font file found" error

The app tries to load fonts in this order:
1. `/fonts/ArialBlack.ttf`
2. `/fonts/Arial-Bold.ttf`
3. `/fonts/Roboto-Bold.ttf`

Make sure at least one of these files exists.

### Font loads but text doesn't appear

- Try a different font file
- Check browser console for errors
- Verify the text input isn't empty
- Try simpler text (single characters first)

### Text looks weird or distorted

- This is normal! The text is being simplified to ~50-100 points
- Try shorter text (1-4 characters works best)
- Use bolder fonts for better results

## Legal Note

- **System fonts**: Check your OS license before redistributing
- **Google Fonts**: Free and open source, safe to use
- **Commercial fonts**: Ensure you have the right to use them in your project

## Alternative: Use Shapes Only

If you can't or don't want to add a font file:
- Use the "Shape" mode instead
- Pre-designed shapes (heart, star, etc.) work without any font files
- Still provides a fun running route drawing experience!
