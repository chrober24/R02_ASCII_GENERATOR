let layers = [];
let container;
let canvas;
let customFont;
let usingCustomFont = true; // New variable to track font selection

// Control Variables
let numLayers = 4;

let hueBase = 40;
let sat = 100;
let bright = 75;
let contrast = 1.5;

let noiseScaleMin = 0.05;
let noiseScaleMax = 0.2;

let symbolSizeMin = 20;
let symbolSizeMax = 80;

let blobCutoutMin = 0.2;
let blobCutoutMax = 0.6;

let fadeSpeedMin = 0.003;
let fadeSpeedMax = 0.008;

let globalAnimationSpeed = 0.01; // Speed control

// Custom ASCII characters
let asciiChars = '3 2 bc dga14 '; // Default characters with spaces preserved for formatting

// Character set presets organized by font type
const charPresets = {
  marathon: [
    { name: 'Default', chars: '3 2 bc dga14 ' }
  ],
  monospace: [
    { name: 'Gradient Blocks', chars: '░▒▓' },
    { name: 'Trigrams', chars: '☰☲☱☴☵☶☳☷' },
    { name: 'Block Elements', chars: '▁▂▃▅▆▇▉▊▋█▌▐▍▎▏▕▀▔▬' },
    { name: 'Rounded', chars: '◜◝◞◟◠◡◯' },
    { name: 'Box Drawing', chars: '═║╗╔╚╝╠╣╩╦╬' },
    { name: 'Diagonal Lines', chars: '╱╲╳╴╵╶╷' },
    { name: 'Triangles', chars: '▲▴▶▸►▼▾◀◄◂' },
    { name: 'Squares', chars: '❏❐❑❒' },
    { name: 'Patterns', chars: '▣▤▥▧▦▨▩' }
  ]
};

// Pattern and symmetry options
const symmetryOptions = [
  { name: 'Quad (4-fold)', value: 'quad' },
  { name: 'None', value: 'none' },
  { name: 'Horizontal', value: 'horizontal' },
  { name: 'Vertical', value: 'vertical' },
  { name: 'Radial 6-fold', value: 'radial6' },
  { name: 'Radial 8-fold', value: 'radial8' },
  { name: 'Radial 12-fold', value: 'radial12' },
  { name: 'Diagonal', value: 'diagonal' }
];

const noiseTypeOptions = [
  { name: 'Perlin', value: 'perlin' },
  { name: 'Ridged', value: 'ridged' },
  { name: 'Turbulence', value: 'turbulence' },
  { name: 'Fractal (FBM)', value: 'fbm' },
  { name: 'Worley/Cellular', value: 'worley' },
  { name: 'Domain Warping', value: 'warp' },
  { name: 'Simplex-like', value: 'simplex' }
];

const patternModifierOptions = [
  { name: 'None', value: 'none' },
  { name: 'Wave/Ripple', value: 'wave' },
  { name: 'Spiral/Vortex', value: 'spiral' },
  { name: 'Concentric Rings', value: 'rings' },
  { name: 'Stripes (Horizontal)', value: 'stripes_h' },
  { name: 'Stripes (Vertical)', value: 'stripes_v' },
  { name: 'Stripes (Diagonal)', value: 'stripes_d' },
  { name: 'Checkerboard', value: 'checker' }
];

const gridLayoutOptions = [
  { name: 'Cartesian', value: 'cartesian' },
  { name: 'Polar', value: 'polar' },
  { name: 'Hexagonal', value: 'hexagonal' },
  { name: 'Brick/Offset', value: 'brick' }
];

// Current pattern settings
let currentSymmetry = 'quad';
let currentNoiseType = 'perlin';
let currentModifier = 'none';
let currentGridLayout = 'cartesian';

// UI Elements
let sliders = {};
let toggleButton;
let notification;
let isControlPanelVisible = false;
let fontToggle; // New control for font selection
let charInput; // New control for custom characters
let presetSelect; // Dropdown for character presets
let symmetrySelect; // Dropdown for symmetry options
let noiseTypeSelect; // Dropdown for noise type
let modifierSelect; // Dropdown for pattern modifiers
let gridLayoutSelect; // Dropdown for grid layout
let parallaxEnabled = true; // Track if parallax should be active
let isTakingScreenshot = false; // Track if screenshot is in progress

// Recording variables
let captureButton;
let captureModeSelect;
let recordingNotification;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let gifRecorder = null;
let gifFrameInterval = null;
let recordingStartTime = 0;

function preload() {
  // Load font if available, otherwise use default
  try {
    customFont = loadFont('ASSETS/marathon_font.otf');
  } catch (error) {
    console.log('Custom font not loaded, using default font');
    usingCustomFont = false; // Set default font if custom font fails to load
    // The sketch will use default font
  }
}

function setup() {
  container = select('#ascii-container');
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(container);

  colorMode(HSL, 360, 100, 100, 100);
  updateFontSettings(); // Initialize font settings
  textAlign(CENTER, CENTER);
  noStroke();
  background(5); // Darker background for better contrast

  setupControls();
  setupCaptureButton();
  regenerateLayers();
  
  // Canvas click will randomize the art
  canvas.mousePressed(function() {
    // Only randomize if clicked on canvas, not on controls
    if (mouseX > 320 || mouseY > 100) {
      randomizeAll();
    }
  });
  
  // Setup notifications
  notification = select('#screenshot-notification');
  notification.style('transform', 'translateX(-50%) translateY(-100px)');
  
  recordingNotification = select('#recording-notification');
  recordingNotification.style('transform', 'translateX(-50%) translateY(-100px)');
}

function draw() {
  background(0, 50); // Darker background with fade
  
  // Check if parallax should be enabled (not over UI and not taking screenshot)
  parallaxEnabled = !isTakingScreenshot && !isMouseOverUI();
  
  // Draw the art elements
  layers.sort((a, b) => a.symbolSize - b.symbolSize);
  for (let layer of layers) {
    layer.update();
    layer.display();
  }
  
  // Draw subtle gridlines if panel is visible (for design reference)
  if (isControlPanelVisible) {
    drawGridlines();
  }
  
  // Update values live from sliders
  updateValuesFromSliders();
}

function updateValuesFromSliders() {
  // Only update if sliders exist
  if (Object.keys(sliders).length === 0) return;
  
  numLayers = sliders.numLayers.value();
  hueBase = sliders.hueBase.value();
  sat = sliders.sat.value();
  bright = sliders.bright.value();
  contrast = sliders.contrast.value();

  noiseScaleMin = sliders.noiseScaleMin.value();
  noiseScaleMax = sliders.noiseScaleMax.value();

  symbolSizeMin = sliders.symbolSizeMin.value();
  symbolSizeMax = sliders.symbolSizeMax.value();

  blobCutoutMin = sliders.blobCutoutMin.value();
  blobCutoutMax = sliders.blobCutoutMax.value();

  fadeSpeedMin = sliders.fadeSpeedMin.value();
  fadeSpeedMax = sliders.fadeSpeedMax.value();

  globalAnimationSpeed = sliders.globalAnimationSpeed.value();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// New function to update font settings
function updateFontSettings() {
  if (usingCustomFont && customFont) {
    textFont(customFont);
  } else {
    textFont('monospace');
  }
}

// New function to handle font toggle change
function toggleFont() {
  usingCustomFont = !usingCustomFont;
  updateFontSettings();
  fontToggle.html(usingCustomFont ? 'Using Custom Font' : 'Using Monospace');
  updatePresetDropdown();
}

// Function to update the preset dropdown based on current font
function updatePresetDropdown() {
  if (!presetSelect) return;
  
  // Clear existing options by removing and recreating
  presetSelect.elt.innerHTML = '';
  
  // Add default "Select Preset" option
  let defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.text = '-- Select Preset --';
  presetSelect.elt.appendChild(defaultOpt);
  
  // Get presets for current font type
  const presets = usingCustomFont ? charPresets.marathon : charPresets.monospace;
  
  // Add preset options
  for (let preset of presets) {
    let opt = document.createElement('option');
    opt.value = preset.chars;
    opt.text = preset.name;
    presetSelect.elt.appendChild(opt);
  }
}

// Function to handle preset selection
function applyPreset() {
  const selectedChars = presetSelect.value();
  if (selectedChars && selectedChars !== '') {
    charInput.value(selectedChars);
    updateAsciiChars();
  }
}

// New function to handle character input change
function updateAsciiChars() {
  const newChars = charInput.value();
  if (newChars.trim() !== '') {
    asciiChars = newChars;
    // Update all layers with new characters
    for (let layer of layers) {
      layer.updateChars(asciiChars);
    }
  }
}

// 🔧 SETUP CONTROLS
function setupControls() {
  const panel = select('#control-panel');
  
  // Get toggle button from HTML
  toggleButton = select('#toggleButton');
  toggleButton.mousePressed(toggleControlPanel);

  sliders.numLayers = createControlGroup('General', panel, 'Layers', 2, 10, numLayers, 1);

  // Add font selection toggle
  createTitle('Font Settings', panel);
  
  // Font toggle button
  fontToggle = createButton(usingCustomFont ? 'Using Custom Font' : 'Using Monospace');
  fontToggle.parent(panel);
  fontToggle.class('button');
  fontToggle.style('width', '100%');
  fontToggle.style('margin-bottom', '15px');
  fontToggle.mousePressed(toggleFont);
  
  // Character preset dropdown
  const presetLabel = createElement('label', 'Character Presets');
  presetLabel.parent(panel);
  presetLabel.class('control-label');
  presetLabel.style('margin-top', '0');
  presetLabel.style('margin-bottom', '5px');
  
  presetSelect = createSelect();
  presetSelect.parent(panel);
  presetSelect.style('width', '100%');
  presetSelect.style('padding', '8px');
  presetSelect.style('margin-bottom', '15px');
  presetSelect.style('background', 'rgba(40, 40, 40, 0.8)');
  presetSelect.style('border', '1px solid #444');
  presetSelect.style('border-radius', '4px');
  presetSelect.style('color', '#eaeaea');
  presetSelect.style('font-family', "'Courier New', monospace");
  presetSelect.style('font-size', '14px');
  presetSelect.style('cursor', 'pointer');
  presetSelect.changed(applyPreset);
  
  // Initialize preset dropdown options
  updatePresetDropdown();
  
  // Character input for custom ASCII characters
  const charInputLabel = createElement('label', 'Custom ASCII Characters');
  charInputLabel.parent(panel);
  charInputLabel.class('control-label');
  
  charInput = createInput(asciiChars);
  charInput.parent(panel);
  charInput.class('text-input');
  charInput.style('width', '100%');
  charInput.style('padding', '8px');
  charInput.style('margin-bottom', '15px');
  charInput.style('background', 'rgba(40, 40, 40, 0.8)');
  charInput.style('border', '1px solid #444');
  charInput.style('border-radius', '4px');
  charInput.style('color', '#eaeaea');
  
  // Add apply button for character changes
  const applyButton = createButton('Apply Characters');
  applyButton.parent(panel);
  applyButton.class('button');
  applyButton.style('width', '100%');
  applyButton.style('margin-bottom', '20px');
  applyButton.mousePressed(updateAsciiChars);

  // Pattern Settings Section
  createTitle('Pattern Settings', panel);
  
  // Symmetry dropdown
  symmetrySelect = createStyledDropdown(panel, 'Symmetry', symmetryOptions, currentSymmetry);
  symmetrySelect.changed(() => {
    currentSymmetry = symmetrySelect.value();
    regenerateLayers();
  });
  
  // Noise Type dropdown
  noiseTypeSelect = createStyledDropdown(panel, 'Noise Type', noiseTypeOptions, currentNoiseType);
  noiseTypeSelect.changed(() => {
    currentNoiseType = noiseTypeSelect.value();
    regenerateLayers();
  });
  
  // Pattern Modifier dropdown
  modifierSelect = createStyledDropdown(panel, 'Pattern Modifier', patternModifierOptions, currentModifier);
  modifierSelect.changed(() => {
    currentModifier = modifierSelect.value();
    regenerateLayers();
  });
  
  // Grid Layout dropdown
  gridLayoutSelect = createStyledDropdown(panel, 'Grid Layout', gridLayoutOptions, currentGridLayout);
  gridLayoutSelect.changed(() => {
    currentGridLayout = gridLayoutSelect.value();
    regenerateLayers();
  });

  createTitle('Color Settings', panel);
  sliders.hueBase = createControl(panel, 'Hue Base', 0, 360, hueBase, 1);
  sliders.sat = createControl(panel, 'Saturation', 0.1, 100, sat, 1);
  sliders.bright = createControl(panel, 'Brightness', 0.1, 100, bright, 1);
  sliders.contrast = createControl(panel, 'Contrast', 0.5, 3, contrast, 0.01);

  createTitle('Noise Settings', panel);
  sliders.noiseScaleMin = createControl(panel, 'Noise Scale Min', 0.01, 0.2, noiseScaleMin, 0.001);
  sliders.noiseScaleMax = createControl(panel, 'Noise Scale Max', 0.1, 0.5, noiseScaleMax, 0.001);

  createTitle('Scale & Symbol Size', panel);
  sliders.symbolSizeMin = createControl(panel, 'Symbol Size Min', 10, 100, symbolSizeMin, 1);
  sliders.symbolSizeMax = createControl(panel, 'Symbol Size Max', 30, 150, symbolSizeMax, 1);

  createTitle('Cutout Settings', panel);
  sliders.blobCutoutMin = createControl(panel, 'Blob Cutout Min', 0.1, 0.8, blobCutoutMin, 0.01);
  sliders.blobCutoutMax = createControl(panel, 'Blob Cutout Max', 0.2, 1.0, blobCutoutMax, 0.01);

  createTitle('Animation Settings', panel);
  sliders.fadeSpeedMin = createControl(panel, 'Fade Speed Min', 0.001, 0.02, fadeSpeedMin, 0.001);
  sliders.fadeSpeedMax = createControl(panel, 'Fade Speed Max', 0.002, 0.03, fadeSpeedMax, 0.001);
  sliders.globalAnimationSpeed = createControl(panel, 'Animation Speed', 0.001, 0.1, globalAnimationSpeed, 0.001);

  // Create button container
  let buttonContainer = createDiv();
  buttonContainer.parent(panel);
  buttonContainer.class('control-buttons');

  // Add refresh button
  let refreshButton = createButton('🔄 Refresh');
  refreshButton.parent(buttonContainer);
  refreshButton.class('button');
  refreshButton.mousePressed(regenerateLayers);

  // Add randomize button
  let randomizeButton = createButton('🎲 Randomize');
  randomizeButton.parent(buttonContainer);
  randomizeButton.class('button');
  randomizeButton.mousePressed(randomizeAll);
}

// Setup combined capture button
function setupCaptureButton() {
  captureButton = select('#captureButton');
  captureModeSelect = select('#captureMode');
  
  // Update button label when mode changes
  captureModeSelect.changed(updateCaptureButtonLabel);
  
  // Handle capture button click
  captureButton.mousePressed(handleCapture);
}

// Update capture button label based on selected mode
function updateCaptureButtonLabel() {
  const mode = captureModeSelect.value();
  
  if (isRecording) {
    captureButton.html('⬛ Stop');
  } else {
    if (mode === 'screenshot') {
      captureButton.html('📷 Capture');
    } else {
      captureButton.html('🔴 Record');
    }
  }
}

// Handle capture button click based on mode
function handleCapture() {
  const mode = captureModeSelect.value();
  
  if (mode === 'screenshot') {
    takeScreenshot();
  } else {
    // Recording modes (webm or gif)
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
}

function takeScreenshot() {
  // Disable parallax during screenshot
  isTakingScreenshot = true;
  
  // Hide controls temporarily for clean screenshot
  const controlPanel = select('#control-panel');
  const uiControls = select('.ui-controls');
  
  // Store visibility state
  const wasPanelVisible = !controlPanel.hasClass('hidden');
  
  // Hide UI elements
  controlPanel.addClass('hidden');
  uiControls.style('display', 'none');
  
  // Wait a frame to ensure UI is hidden and parallax is centered
  setTimeout(() => {
    // Take the screenshot
    saveCanvas('ascii_art', 'png');
    
    // Re-enable parallax
    isTakingScreenshot = false;
    
    // Show notification
    notification.addClass('notification-visible');
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.removeClass('notification-visible');
    }, 3000);
    
    // Restore UI elements
    uiControls.style('display', 'flex');
    if (wasPanelVisible) {
      controlPanel.removeClass('hidden');
    }
  }, 100);
}

// Toggle recording on/off
function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// Start recording
function startRecording() {
  const format = captureModeSelect.value();
  isRecording = true;
  recordingStartTime = millis();
  
  // Disable parallax during recording for stable output
  isTakingScreenshot = true;
  
  // Update button appearance
  captureButton.html('⬛ Stop');
  captureButton.addClass('recording-active');
  
  // Show recording notification
  recordingNotification.addClass('notification-visible');
  
  // Hide control panel for clean recording (but keep top buttons visible for stop)
  const controlPanel = select('#control-panel');
  controlPanel.addClass('hidden');
  
  if (format === 'webm' || format === 'mp4') {
    startVideoRecording(format);
  } else if (format === 'gif') {
    startGIFRecording();
  }
}

// Stop recording
function stopRecording() {
  const format = captureModeSelect.value();
  isRecording = false;
  
  // Re-enable parallax
  isTakingScreenshot = false;
  
  // Update button appearance
  captureButton.html('🔴 Record');
  captureButton.removeClass('recording-active');
  
  // Hide recording notification
  recordingNotification.removeClass('notification-visible');
  
  if (format === 'webm' || format === 'mp4') {
    stopVideoRecording();
  } else if (format === 'gif') {
    stopGIFRecording();
  }
}

// Video Recording using MediaRecorder API
function startVideoRecording(format) {
  recordedChunks = [];
  
  const canvasElement = document.querySelector('canvas');
  const stream = canvasElement.captureStream(60); // 60 FPS for smoother video
  
  // High bitrate for quality (15 Mbps)
  const bitrate = 15000000;
  
  let options = {};
  let fileExtension = 'webm';
  let mimeType = 'video/webm';
  
  if (format === 'mp4') {
    // Try MP4/H.264 first (best compatibility for editing/sharing)
    const mp4Types = [
      'video/mp4;codecs=avc1.42E01E', // H.264 Baseline
      'video/mp4;codecs=avc1',
      'video/mp4'
    ];
    
    for (let type of mp4Types) {
      if (MediaRecorder.isTypeSupported(type)) {
        options.mimeType = type;
        fileExtension = 'mp4';
        mimeType = 'video/mp4';
        break;
      }
    }
    
    // Fallback to WebM with H.264 if MP4 not supported
    if (!options.mimeType) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        options.mimeType = 'video/webm;codecs=h264';
        fileExtension = 'webm';
        mimeType = 'video/webm';
      }
    }
  } else {
    // WebM format - try VP9 first (better quality), then VP8
    const webmTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    
    for (let type of webmTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        options.mimeType = type;
        break;
      }
    }
  }
  
  // Add high bitrate for quality
  options.videoBitsPerSecond = bitrate;
  
  console.log('Recording with:', options.mimeType, 'at', bitrate/1000000, 'Mbps');
  
  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e) {
    console.error('MediaRecorder error:', e);
    // Final fallback
    mediaRecorder = new MediaRecorder(stream, { videoBitsPerSecond: bitrate });
  }
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };
  
  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: mimeType });
    downloadBlob(blob, `ascii_art_recording.${fileExtension}`);
    recordedChunks = [];
    
    // Show success notification
    showDownloadNotification('Video saved!');
  };
  
  mediaRecorder.start(100); // Collect data every 100ms
}

function stopVideoRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

// GIF Recording using gif.js
let gifWorkerBlobURL = null;

// Pre-fetch the GIF worker script and create a blob URL
async function initGifWorker() {
  try {
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
    const workerCode = await response.text();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    gifWorkerBlobURL = URL.createObjectURL(blob);
    console.log('GIF worker initialized');
  } catch (e) {
    console.error('Failed to initialize GIF worker:', e);
  }
}

// Initialize the worker on page load
initGifWorker();

function startGIFRecording() {
  // Check if GIF library is loaded
  if (typeof GIF === 'undefined') {
    console.error('GIF.js library not loaded');
    alert('GIF recording library not available. Please use WebM format.');
    stopRecording();
    return;
  }
  
  // Check if worker blob URL is ready
  if (!gifWorkerBlobURL) {
    console.error('GIF worker not initialized');
    alert('GIF worker not ready. Please try again or use WebM format.');
    stopRecording();
    return;
  }
  
  gifRecorder = new GIF({
    workers: 2,
    quality: 10,
    width: width,
    height: height,
    workerScript: gifWorkerBlobURL
  });
  
  gifRecorder.on('finished', (blob) => {
    downloadBlob(blob, 'ascii_art_recording.gif');
    
    // Show success notification
    showDownloadNotification('GIF saved!');
  });
  
  // Capture frames at ~15 FPS for GIF (every ~67ms)
  gifFrameInterval = setInterval(() => {
    if (isRecording) {
      const canvasElement = document.querySelector('canvas');
      gifRecorder.addFrame(canvasElement, { copy: true, delay: 67 });
    }
  }, 67);
}

function stopGIFRecording() {
  if (gifFrameInterval) {
    clearInterval(gifFrameInterval);
    gifFrameInterval = null;
  }
  
  if (gifRecorder) {
    // Show processing notification
    recordingNotification.html('Processing GIF...');
    recordingNotification.addClass('notification-visible');
    
    gifRecorder.render();
  }
}

// Download blob helper
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Show download notification
function showDownloadNotification(message) {
  recordingNotification.html(message);
  recordingNotification.style('background', 'rgba(105, 247, 190, 0.9)');
  recordingNotification.style('color', '#121212');
  recordingNotification.addClass('notification-visible');
  
  setTimeout(() => {
    recordingNotification.removeClass('notification-visible');
    // Reset notification styling
    setTimeout(() => {
      recordingNotification.html('Recording...');
      recordingNotification.style('background', 'rgba(255, 82, 82, 0.9)');
      recordingNotification.style('color', '#fff');
    }, 500);
  }, 3000);
}

function toggleControlPanel() {
  const panel = select('#control-panel');
  panel.toggleClass('hidden');
  isControlPanelVisible = !panel.hasClass('hidden');
  
  if (isControlPanelVisible) {
    toggleButton.html('Hide Controls');
  } else {
    toggleButton.html('Show Controls');
  }
}

// Check if mouse is over any UI elements
function isMouseOverUI() {
  // Check if over the UI controls buttons (top-left area)
  const uiControlsElt = document.querySelector('.ui-controls');
  if (uiControlsElt) {
    const rect = uiControlsElt.getBoundingClientRect();
    if (mouseX >= rect.left && mouseX <= rect.right && 
        mouseY >= rect.top && mouseY <= rect.bottom) {
      return true;
    }
  }
  
  // Check if over the control panel (when visible)
  if (isControlPanelVisible) {
    const panelElt = document.querySelector('#control-panel');
    if (panelElt) {
      const rect = panelElt.getBoundingClientRect();
      if (mouseX >= rect.left && mouseX <= rect.right && 
          mouseY >= rect.top && mouseY <= rect.bottom) {
        return true;
      }
    }
  }
  
  return false;
}

function createTitle(title, parent) {
  const heading = createElement('h3', title);
  heading.parent(parent);
  heading.class('control-title');
}

function createControlGroup(groupName, parent, label, min, max, value, step) {
  createTitle(groupName, parent);
  return createControl(parent, label, min, max, value, step);
}

// Helper function to create styled dropdown
function createStyledDropdown(parent, labelText, options, defaultValue) {
  const wrapper = createDiv();
  wrapper.parent(parent);
  wrapper.class('control-group');
  
  const label = createElement('label', labelText);
  label.parent(wrapper);
  label.class('control-label');
  label.style('margin-bottom', '5px');
  label.style('display', 'block');
  
  const dropdown = createSelect();
  dropdown.parent(wrapper);
  dropdown.style('width', '100%');
  dropdown.style('padding', '8px');
  dropdown.style('margin-bottom', '10px');
  dropdown.style('background', 'rgba(40, 40, 40, 0.8)');
  dropdown.style('border', '1px solid #444');
  dropdown.style('border-radius', '4px');
  dropdown.style('color', '#eaeaea');
  dropdown.style('font-family', "'Courier New', monospace");
  dropdown.style('font-size', '14px');
  dropdown.style('cursor', 'pointer');
  
  // Populate options
  for (let opt of options) {
    dropdown.option(opt.name, opt.value);
  }
  
  // Set default value
  dropdown.selected(defaultValue);
  
  return dropdown;
}

function createControl(parent, labelText, min, max, value, step) {
  const wrapper = createDiv();
  wrapper.parent(parent);
  wrapper.class('control-group');

  // Create label row with label and value display
  const labelRow = createDiv();
  labelRow.parent(wrapper);
  labelRow.style('display', 'flex');
  labelRow.style('justify-content', 'space-between');
  labelRow.style('align-items', 'center');
  labelRow.style('margin-bottom', '5px');

  const label = createElement('label', labelText);
  label.parent(labelRow);
  label.class('control-label');

  // Create value display span
  const valueDisplay = createSpan(formatValue(value, step));
  valueDisplay.parent(labelRow);
  valueDisplay.class('value-display');
  valueDisplay.style('font-family', "'Courier New', monospace");
  valueDisplay.style('font-size', '13px');
  valueDisplay.style('color', '#69f7be');
  valueDisplay.style('background', 'rgba(105, 247, 190, 0.1)');
  valueDisplay.style('padding', '2px 8px');
  valueDisplay.style('border-radius', '4px');
  valueDisplay.style('min-width', '50px');
  valueDisplay.style('text-align', 'right');

  const slider = createSlider(min, max, value, step);
  slider.parent(wrapper);
  slider.class('control-slider');
  
  // Store reference to value display and step on the slider for later updates
  slider.valueDisplay = valueDisplay;
  slider.step = step;
  
  // Update value display when slider changes
  slider.input(() => {
    valueDisplay.html(formatValue(slider.value(), step));
  });

  return slider;
}

// Helper function to format slider values appropriately
function formatValue(value, step) {
  if (step >= 1) {
    return Math.round(value).toString();
  } else if (step >= 0.1) {
    return value.toFixed(1);
  } else if (step >= 0.01) {
    return value.toFixed(2);
  } else {
    return value.toFixed(3);
  }
}

// Helper function to update a slider's value display
function updateSliderDisplay(slider) {
  if (slider.valueDisplay) {
    slider.valueDisplay.html(formatValue(slider.value(), slider.step));
  }
}

function regenerateLayers() {
  layers = [];
  for (let i = 0; i < numLayers; i++) {
    layers.push(new ASCIILayer(i));
  }
}

// 🎲 RANDOMIZER FUNCTION
function randomizeAll() {
  sliders.numLayers.value(int(random(2, 10)));

  sliders.hueBase.value(random(0, 360));
  sliders.sat.value(random(50, 100));
  sliders.bright.value(random(40, 100));
  sliders.contrast.value(random(0.8, 2.5));

  sliders.noiseScaleMin.value(random(0.01, 0.1));
  sliders.noiseScaleMax.value(random(0.15, 0.5));
  if (sliders.noiseScaleMin.value() > sliders.noiseScaleMax.value()) {
    let temp = sliders.noiseScaleMin.value();
    sliders.noiseScaleMin.value(sliders.noiseScaleMax.value());
    sliders.noiseScaleMax.value(temp);
  }

  sliders.symbolSizeMin.value(random(10, 50));
  sliders.symbolSizeMax.value(random(60, 150));
  if (sliders.symbolSizeMin.value() > sliders.symbolSizeMax.value()) {
    let temp = sliders.symbolSizeMin.value();
    sliders.symbolSizeMin.value(sliders.symbolSizeMax.value());
    sliders.symbolSizeMax.value(temp);
  }

  sliders.blobCutoutMin.value(random(0.1, 0.6));
  sliders.blobCutoutMax.value(random(0.4, 1.0));
  if (sliders.blobCutoutMin.value() > sliders.blobCutoutMax.value()) {
    let temp = sliders.blobCutoutMin.value();
    sliders.blobCutoutMin.value(sliders.blobCutoutMax.value());
    sliders.blobCutoutMax.value(temp);
  }

  sliders.fadeSpeedMin.value(random(0.001, 0.01));
  sliders.fadeSpeedMax.value(random(0.008, 0.03));
  if (sliders.fadeSpeedMin.value() > sliders.fadeSpeedMax.value()) {
    let temp = sliders.fadeSpeedMin.value();
    sliders.fadeSpeedMin.value(sliders.fadeSpeedMax.value());
    sliders.fadeSpeedMax.value(temp);
  }

  sliders.globalAnimationSpeed.value(random(0.003, 0.08));

  // Randomize pattern settings
  let randomSymmetry = symmetryOptions[floor(random(symmetryOptions.length))];
  currentSymmetry = randomSymmetry.value;
  symmetrySelect.selected(currentSymmetry);
  
  let randomNoiseType = noiseTypeOptions[floor(random(noiseTypeOptions.length))];
  currentNoiseType = randomNoiseType.value;
  noiseTypeSelect.selected(currentNoiseType);
  
  let randomModifier = patternModifierOptions[floor(random(patternModifierOptions.length))];
  currentModifier = randomModifier.value;
  modifierSelect.selected(currentModifier);
  
  let randomGridLayout = gridLayoutOptions[floor(random(gridLayoutOptions.length))];
  currentGridLayout = randomGridLayout.value;
  gridLayoutSelect.selected(currentGridLayout);
  
  // Randomize character preset based on current font
  let presets = usingCustomFont ? charPresets.marathon : charPresets.monospace;
  let randomPreset = presets[floor(random(presets.length))];
  charInput.value(randomPreset.chars);
  asciiChars = randomPreset.chars;
  
  // Update preset dropdown to show selected preset
  presetSelect.selected(randomPreset.chars);

  // Update all slider value displays
  updateAllSliderDisplays();

  regenerateLayers();
}

// Update all slider value displays (called after randomize)
function updateAllSliderDisplays() {
  for (let key in sliders) {
    updateSliderDisplay(sliders[key]);
  }
}

// --------------------
// ✨ Layer Class
// --------------------

class ASCIILayer {
  constructor(seed) {
    this.seed = seed;
    this.t = random(1000);

    this.depth = map(seed, 0, numLayers - 1, 1.5, 0.5);
    this.symbolSize = random(symbolSizeMin, symbolSizeMax) * this.depth;
    this.scaleFactor = this.depth;

    this.noiseScale = random(noiseScaleMin, noiseScaleMax);
    this.updateChars(asciiChars); // Initialize characters

    this.cols = floor(width / this.symbolSize);
    this.rows = floor(height / this.symbolSize);

    this.blobCutoutStrength = random(blobCutoutMin, blobCutoutMax);
    this.rectCutoutCount = int(random(2, 5));
    this.rectangles = [];

    for (let i = 0; i < this.rectCutoutCount; i++) {
      this.rectangles.push({
        baseX: random(this.cols),
        baseY: random(this.rows),
        baseW: random(2, 6),
        baseH: random(2, 6),
        xOffset: random(1000),
        yOffset: random(1000),
        wOffset: random(1000),
        hOffset: random(1000)
      });
    }

    this.fadeSpeed = random(fadeSpeedMin, fadeSpeedMax);
    this.fadeOffset = random(TWO_PI);
  }

  // New method to update characters
  updateChars(chars) {
    // Convert string to array of chars, filter out empty elements
    this.chars = chars.split('').filter(char => char !== '');
    
    // If somehow we end up with no characters, add a default
    if (this.chars.length === 0) {
      this.chars = ['•'];
    }
  }

  update() {
    this.cols = floor(width / this.symbolSize);
    this.rows = floor(height / this.symbolSize);
    this.t += globalAnimationSpeed;
  }

  display() {
    let layerAlpha = map(sin(this.fadeOffset + millis() * this.fadeSpeed), -1, 1, 20, 100);

    let parallaxStrength = 100 * (1 - this.depth);
    let offsetX = 0;
    let offsetY = 0;
    
    // Only apply parallax if enabled
    if (parallaxEnabled) {
      offsetX = map(mouseX, 0, width, -parallaxStrength, parallaxStrength);
      offsetY = map(mouseY, 0, height, -parallaxStrength, parallaxStrength);
    }

    push();
    translate(width / 2 + offsetX, height / 2 + offsetY);
    scale(this.scaleFactor);
    translate(-width / 2, -height / 2);

    tint(255, layerAlpha);

    textSize(this.symbolSize * 0.8);

    // Generate grid positions based on layout
    let positions = this.generateGridPositions();
    
    for (let pos of positions) {
      let x = pos.x;
      let y = pos.y;
      
      if (this.inAnimatedRectangleCutout(x, y)) continue;
      if (this.inAnimatedBlobCutout(x, y)) continue;

      // Apply modifier to coordinates
      let modifiedCoords = this.applyModifier(x, y);
      
      // Get noise value based on noise type
      let n = this.getNoiseValue(modifiedCoords.x, modifiedCoords.y);
      n = adjustContrast(n, contrast);

      let index = floor(n * (this.chars.length - 1));
      let c = this.chars[index];

      let col = color((hueBase + n * 60 + this.seed * 30) % 360, sat, bright * n);
      fill(col);

      // Apply symmetry
      this.drawWithSymmetry(c, x, y);
    }
    pop();
  }

  // Generate grid positions based on layout type
  generateGridPositions() {
    let positions = [];
    let halfCols = this.cols / 2;
    let halfRows = this.rows / 2;
    
    switch (currentGridLayout) {
      case 'polar':
        let rings = floor(min(halfCols, halfRows));
        for (let r = 1; r <= rings; r++) {
          let circumference = floor(TWO_PI * r * 1.5);
          for (let a = 0; a < circumference; a++) {
            let angle = (a / circumference) * TWO_PI;
            let px = halfCols + cos(angle) * r;
            let py = halfRows + sin(angle) * r;
            positions.push({ x: px, y: py });
          }
        }
        break;
        
      case 'hexagonal':
        for (let y = 0; y < this.rows; y++) {
          let xOffset = (y % 2) * 0.5;
          for (let x = 0; x < this.cols; x++) {
            positions.push({ x: x + xOffset, y: y * 0.866 });
          }
        }
        break;
        
      case 'brick':
        for (let y = 0; y < this.rows; y++) {
          let xOffset = (y % 2) * 0.5;
          for (let x = 0; x < this.cols; x++) {
            positions.push({ x: x + xOffset, y: y });
          }
        }
        break;
        
      case 'cartesian':
      default:
        // For symmetry modes, only generate the portion we need
        if (currentSymmetry === 'none') {
          for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
              positions.push({ x: x, y: y });
            }
          }
        } else if (currentSymmetry === 'horizontal') {
          for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < halfCols; x++) {
              positions.push({ x: x, y: y });
            }
          }
        } else if (currentSymmetry === 'vertical') {
          for (let y = 0; y < halfRows; y++) {
            for (let x = 0; x < this.cols; x++) {
              positions.push({ x: x, y: y });
            }
          }
        } else {
          // quad, radial, diagonal - use quadrant
          for (let y = 0; y < halfRows; y++) {
            for (let x = 0; x < halfCols; x++) {
              positions.push({ x: x, y: y });
            }
          }
        }
        break;
    }
    
    return positions;
  }

  // Apply pattern modifier to coordinates
  applyModifier(x, y) {
    let centerX = this.cols / 2;
    let centerY = this.rows / 2;
    let dx = x - centerX;
    let dy = y - centerY;
    let dist = sqrt(dx * dx + dy * dy);
    let angle = atan2(dy, dx);
    
    switch (currentModifier) {
      case 'wave':
        let waveAmt = sin(dist * 0.5 + this.t * 2) * 2;
        return { x: x + waveAmt, y: y + waveAmt };
        
      case 'spiral':
        let spiralAngle = angle + dist * 0.1 + this.t;
        let newX = centerX + cos(spiralAngle) * dist;
        let newY = centerY + sin(spiralAngle) * dist;
        return { x: newX, y: newY };
        
      case 'rings':
        return { x: dist, y: dist };
        
      case 'stripes_h':
        return { x: 0, y: y };
        
      case 'stripes_v':
        return { x: x, y: 0 };
        
      case 'stripes_d':
        return { x: x + y, y: 0 };
        
      case 'checker':
        let check = ((floor(x) + floor(y)) % 2) * 100;
        return { x: x + check, y: y + check };
        
      case 'none':
      default:
        return { x: x, y: y };
    }
  }

  // Get noise value based on noise type
  getNoiseValue(x, y) {
    let nx = (x + this.seed * 1000) * this.noiseScale;
    let ny = (y + this.seed * 1000) * this.noiseScale;
    
    switch (currentNoiseType) {
      case 'ridged':
        let ridged = noise(nx, ny, this.t);
        return 1 - abs(ridged * 2 - 1);
        
      case 'turbulence':
        return abs(noise(nx, ny, this.t) * 2 - 1);
        
      case 'fbm':
        let fbm = 0;
        let amp = 1;
        let freq = 1;
        for (let i = 0; i < 4; i++) {
          fbm += noise(nx * freq, ny * freq, this.t) * amp;
          amp *= 0.5;
          freq *= 2;
        }
        return fbm / 2;
        
      case 'worley':
        return this.worleyNoise(nx, ny);
        
      case 'warp':
        let warpX = noise(nx, ny, this.t) * 4;
        let warpY = noise(nx + 100, ny + 100, this.t) * 4;
        return noise(nx + warpX, ny + warpY, this.t);
        
      case 'simplex':
        // Approximate simplex with modified perlin
        let s = noise(nx * 1.2, ny * 1.2, this.t);
        let s2 = noise(nx * 0.8 + 50, ny * 0.8 + 50, this.t * 1.1);
        return (s + s2) / 2;
        
      case 'perlin':
      default:
        return noise(nx, ny, this.t);
    }
  }

  // Simple Worley/Cellular noise implementation
  worleyNoise(x, y) {
    let cellX = floor(x);
    let cellY = floor(y);
    let minDist = 999;
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        let neighborX = cellX + i;
        let neighborY = cellY + j;
        // Use noise to get pseudo-random point in cell
        let pointX = neighborX + noise(neighborX * 100, neighborY * 100, this.seed);
        let pointY = neighborY + noise(neighborX * 100 + 50, neighborY * 100 + 50, this.seed);
        let dist = sqrt(pow(x - pointX, 2) + pow(y - pointY, 2));
        minDist = min(minDist, dist);
      }
    }
    return constrain(minDist, 0, 1);
  }

  // Draw character with symmetry applied
  drawWithSymmetry(c, x, y) {
    let centerX = this.cols / 2;
    let centerY = this.rows / 2;
    
    switch (currentSymmetry) {
      case 'none':
        this.drawChar(c, x, y);
        break;
        
      case 'horizontal':
        this.drawChar(c, x, y);
        this.drawChar(c, this.cols - 1 - x, y);
        break;
        
      case 'vertical':
        this.drawChar(c, x, y);
        this.drawChar(c, x, this.rows - 1 - y);
        break;
        
      case 'quad':
        this.drawChar(c, x, y);
        this.drawChar(c, this.cols - 1 - x, y);
        this.drawChar(c, x, this.rows - 1 - y);
        this.drawChar(c, this.cols - 1 - x, this.rows - 1 - y);
        break;
        
      case 'radial6':
        this.drawRadialSymmetry(c, x, y, 6);
        break;
        
      case 'radial8':
        this.drawRadialSymmetry(c, x, y, 8);
        break;
        
      case 'radial12':
        this.drawRadialSymmetry(c, x, y, 12);
        break;
        
      case 'diagonal':
        this.drawChar(c, x, y);
        this.drawChar(c, y, x); // Swap x and y for diagonal mirror
        this.drawChar(c, this.cols - 1 - x, this.rows - 1 - y);
        this.drawChar(c, this.cols - 1 - y, this.rows - 1 - x);
        break;
    }
  }

  // Draw with radial symmetry
  drawRadialSymmetry(c, x, y, folds) {
    let centerX = this.cols / 2;
    let centerY = this.rows / 2;
    let dx = x - centerX;
    let dy = y - centerY;
    let dist = sqrt(dx * dx + dy * dy);
    let baseAngle = atan2(dy, dx);
    
    for (let i = 0; i < folds; i++) {
      let angle = baseAngle + (TWO_PI / folds) * i;
      let newX = centerX + cos(angle) * dist;
      let newY = centerY + sin(angle) * dist;
      this.drawChar(c, newX, newY);
      
      // Mirror for kaleidoscope effect
      let mirrorAngle = -baseAngle + (TWO_PI / folds) * i;
      let mirrorX = centerX + cos(mirrorAngle) * dist;
      let mirrorY = centerY + sin(mirrorAngle) * dist;
      this.drawChar(c, mirrorX, mirrorY);
    }
  }

  drawChar(c, gridX, gridY) {
    text(c, gridX * this.symbolSize + this.symbolSize / 2, gridY * this.symbolSize + this.symbolSize / 2);
  }

  inAnimatedRectangleCutout(x, y) {
    for (let rect of this.rectangles) {
      let shiftX = noise(rect.xOffset, this.t * 0.2) * 4 - 2;
      let shiftY = noise(rect.yOffset, this.t * 0.2) * 4 - 2;
      let scaleW = 1 + noise(rect.wOffset, this.t * 0.2) * 0.5;
      let scaleH = 1 + noise(rect.hOffset, this.t * 0.2) * 0.5;

      let rx = rect.baseX + shiftX;
      let ry = rect.baseY + shiftY;
      let rw = rect.baseW * scaleW;
      let rh = rect.baseH * scaleH;

      if (x > rx && x < rx + rw && y > ry && y < ry + rh) {
        return true;
      }
    }
    return false;
  }

  inAnimatedBlobCutout(x, y) {
    let nx = (x + this.seed * 500) * 0.08;
    let ny = (y + this.seed * 500) * 0.08;
    let blobVal = noise(nx, ny, this.t * 0.5);
    return blobVal < this.blobCutoutStrength;
  }
}

function adjustContrast(value, amount) {
  value = (value - 0.5) * amount + 0.5;
  return constrain(value, 0, 1);
}

function drawGridlines() {
  stroke(100, 100, 100, 4); // Faint gridlines with low opacity
  for (let x = 0; x < width; x += symbolSizeMin) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += symbolSizeMin) {
    line(0, y, width, y);
  }
}