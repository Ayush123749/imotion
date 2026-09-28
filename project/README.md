# iMotion

A clean, browser-based emotion-estimation demo for:
- live facial expression analysis from the camera
- image-based face analysis
- text-based emotion estimation from a user-entered sentence

This project is designed as a polished front-end prototype and portfolio/demo app. It intentionally keeps the scope honest: it estimates visible expression cues and text sentiment, rather than claiming to read a person’s hidden internal emotions.

## Features

- Live camera face detection using `face-api.js`
- Uploaded image analysis for multiple detected faces
- Text analysis with a local heuristic sentiment model
- Responsive dashboard with a modern, professional UI
- Brain-and-robot brand styling
- Local result history with easy removal
- Graceful handling for missing model files or permission denial

## Project structure

```text
project/
├── app.js
├── index.html
├── style.css
├── infomation.md
├── README.md
└── models/   (optional local model folder if you want to host weights locally)
```

## Important note on accuracy

This app is a demo and educational prototype. It estimates expression and language patterns based on visible cues, not a diagnosis of actual internal emotion.

It should not be used as:
- mental health assessment
- medical analysis
- hiring or surveillance decision-making
- any system that claims certainty about a person’s private feelings

## How it works

### 1) Live face analysis
The app requests camera permission, then runs browser-side face detection and expression estimation. It uses `face-api.js` from a CDN or local model folder.

### 2) Image analysis
The user uploads an image and the app detects any visible faces and estimates expression probabilities.

### 3) Text analysis
The app analyzes typed or pasted text using a lightweight local keyword heuristic. It produces a rough emotion estimate and shows the result with a clear confidence label.

## Requirements

- modern browser with camera access support
- JavaScript enabled
- local web server for best compatibility

## Local setup

From the project folder, run:

```bash
python -m http.server 8000
```

Then open in the browser:

```text
http://localhost:8000
```

## Optional model setup

If you want to serve the face model files locally instead of relying on CDN-hosted weights, create a `models` folder in the project root and place the required `face-api.js` model files there.

If the weight files are missing, the app will show a user-friendly error instead of pretending the analysis succeeded.

## Usage

1. Open the app in a browser.
2. Use the Live Face tab to allow camera access.
3. Upload an image in the Image Upload tab.
4. Enter sentence text in the Text Analysis tab.
5. Toggle history if you want to save local results.

## Browser support

Recommended:
- Chrome
- Edge
- Brave

## Deployment notes

This project is a static front-end application and does not require a backend for the core demo features. It can be hosted on:
- GitHub Pages
- Netlify
- Vercel static hosting
- any simple static web host

## License

This project is provided as a demo prototype for learning and portfolio use.

## Troubleshooting

### Camera not working
- confirm browser camera permission is allowed
- ensure no other app is using the camera
- try another browser or camera device

### Face models not loading
- check the `models` folder if you are hosting locally
- verify internet access when using the CDN fallback
- look at the browser console for the exact error

### Text analysis seems basic
- this is intentionally a lightweight heuristic model for demo purposes
- it is designed to estimate tone from phrase patterns, not to perform deep emotional understanding

## Future improvements

- add an actual backend-based sentiment model
- add audio tone analysis with clear consent and privacy notice
- improve emotion confidence display and UI polish
- add stronger accessibility and keyboard navigation support
- add export/share options for result history
