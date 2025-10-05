# Sound Files Directory

This directory contains the sound files for chat message alerts in the User Interface settings.

## ✅ Available Files

All required sound files are now present:

### Alarm Sounds
1. ✅ `alarm1.mp3` (3.9K) - Alarm sound variant 1
2. ✅ `alarm2.mp3` (35K) - Alarm sound variant 2
3. ✅ `alarm3.mp3` (65K) - Alarm sound variant 3
4. ✅ `alarm4.mp3` (26K) - Alarm sound variant 4
5. ✅ `alarm5.mp3` (57K) - Alarm sound variant 5
6. ✅ `alarm6.mp3` (16K) - Alarm sound variant 6
7. ✅ `alarm7.mp3` (87K) - Alarm sound variant 7
8. ✅ `alarm8.mp3` (70K) - Alarm sound variant 8

### Beep Sounds
1. ✅ `beep1.mp3` (34K) - Beep sound variant 1
2. ✅ `beep2.mp3` (64K) - Beep sound variant 2
3. ✅ `beep3.mp3` (20K) - Beep sound variant 3
4. ✅ `beep4.mp3` (60K) - Beep sound variant 4
5. ✅ `beep5.mp3` (3.5K) - Beep sound variant 5

**Total**: 13 sound files (All present ✅)

## 📁 File Structure

```
/src/resources/sounds/
├── README.md
├── alarm1.mp3
├── alarm2.mp3
├── alarm3.mp3
├── alarm4.mp3
├── alarm5.mp3
├── alarm6.mp3
├── alarm7.mp3
├── alarm8.mp3
├── beep1.mp3
├── beep2.mp3
├── beep3.mp3
├── beep4.mp3
└── beep5.mp3
```

## 🔧 Build Configuration

The sound files are automatically copied to the build directory via `vite.config.js`:

```javascript
viteStaticCopy({
  targets: [
    {
      src: "src/resources/sounds/*.mp3",
      dest: "resources/sounds",
    },
  ],
})
```

This ensures that in production build, files will be available at:
- `/resources/sounds/alarm1.mp3`
- `/resources/sounds/alarm2.mp3`
- etc.

## 🎵 Usage in Code

The sound files are used in `/src/settings/userinterface/UserInterfaceTab.jsx`:

```javascript
const playSound = () => {
  if (chatSound && chatSound !== "No sound") {
    const audio = new Audio(`/resources/sounds/${chatSound}`);
    audio.play();
  }
};
```

## 🧪 Testing

To test the sound files:

1. **Run the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Settings**:
   - Go to Settings → User Interface tab
   
3. **Test sound playback**:
   - Select a sound from "New chat message sound alert" dropdown
   - Click the "Play" button
   - Sound should play immediately

4. **Verify all sounds**:
   ```bash
   # Run the checker script from project root
   ./check-sounds.sh
   ```

## 📊 File Specifications

- **Format**: MP3
- **Duration**: 1-3 seconds (varies by file)
- **Sample Rate**: 44.1 kHz
- **Bit Rate**: 128-192 kbps
- **Total Size**: ~550KB (all 13 files)

## 🔄 PWA Configuration

Sound files are included in the PWA (Progressive Web App) cache via `vite.config.js`:

```javascript
workbox: {
  globPatterns: ["**/*.{js,css,html,woff,woff2,mp3}"],
}
```

This allows sounds to work offline after the first load.

## 🛠️ Maintenance

### Adding New Sounds

1. Place the new `.mp3` file in this directory
2. Update the dropdown options in `UserInterfaceTab.jsx`
3. Run `./check-sounds.sh` to verify
4. Commit the file to the repository

### Replacing Existing Sounds

1. Replace the file in this directory (keep the same filename)
2. Clear browser cache
3. Test the sound with the Play button

## ✅ Status

Last checked: All 13 sound files present and verified ✅

Run `./check-sounds.sh` from project root to verify file status anytime.
