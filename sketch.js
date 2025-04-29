let layers = [];
let container;
let canvas;
let customFont;

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

// UI Elements
let sliders = {};
let toggleButton;
let screenshotButton;
let notification;
let isControlPanelVisible = false;

function preload() {
  // Load font if available, otherwise use default
  try {
    customFont = loadFont('ASSETS/marathon_font.otf');
  } catch (error) {
    console.log('Custom font not loaded, using default font');
    // The sketch will use default font
  }
}

function setup() {
  container = select('#ascii-container');
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(container);

  colorMode(HSL, 360, 100, 100, 100);
  if (customFont) {
    textFont(customFont);
  }
  textAlign(CENTER, CENTER);
  noStroke();
  background(5); // Darker background for better contrast

  setupControls();
  setupScreenshotButton();
  regenerateLayers();
  
  // Canvas click will randomize the art
  canvas.mousePressed(function() {
    // Only randomize if clicked on canvas, not on controls
    if (mouseX > 320 || mouseY > 100) {
      randomizeAll();
    }
  });
  
  // Setup notification
  notification = select('#screenshot-notification');
  notification.style('transform', 'translateX(-50%) translateY(-100px)');
}

function draw() {
  background(0, 50); // Darker background with fade
  
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

// 🔧 SETUP CONTROLS
function setupControls() {
  const panel = select('#control-panel');
  
  // Get toggle button from HTML
  toggleButton = select('#toggleButton');
  toggleButton.mousePressed(toggleControlPanel);

  sliders.numLayers = createControlGroup('General', panel, 'Layers', 2, 10, numLayers, 1);

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

function setupScreenshotButton() {
  // Get screenshot button from HTML
  screenshotButton = select('#screenshotButton');
  screenshotButton.mousePressed(takeScreenshot);
}

function takeScreenshot() {
  // Hide controls temporarily for clean screenshot
  const controlPanel = select('#control-panel');
  const uiControls = select('.ui-controls');
  
  // Store visibility state
  const wasPanelVisible = !controlPanel.hasClass('hidden');
  
  // Hide UI elements
  controlPanel.addClass('hidden');
  uiControls.style('display', 'none');
  
  // Wait a frame to ensure UI is hidden
  setTimeout(() => {
    // Take the screenshot
    saveCanvas('ascii_art', 'png');
    
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

function createTitle(title, parent) {
  const heading = createElement('h3', title);
  heading.parent(parent);
  heading.class('control-title');
}

function createControlGroup(groupName, parent, label, min, max, value, step) {
  createTitle(groupName, parent);
  return createControl(parent, label, min, max, value, step);
}

function createControl(parent, labelText, min, max, value, step) {
  const wrapper = createDiv();
  wrapper.parent(parent);
  wrapper.class('control-group');

  const label = createElement('label', labelText);
  label.parent(wrapper);
  label.class('control-label');

  const slider = createSlider(min, max, value, step);
  slider.parent(wrapper);
  slider.class('control-slider');

  return slider;
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

  regenerateLayers();
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
    this.chars = ['3', '2', ' ', 'b', 'c', 'd', 'g', 'a', '1', '4', ' '];

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

  update() {
    this.cols = floor(width / this.symbolSize);
    this.rows = floor(height / this.symbolSize);
    this.t += globalAnimationSpeed;
  }

  display() {
    let layerAlpha = map(sin(this.fadeOffset + millis() * this.fadeSpeed), -1, 1, 20, 100);

    let parallaxStrength = 100 * (1 - this.depth);
    let offsetX = map(mouseX, 0, width, -parallaxStrength, parallaxStrength);
    let offsetY = map(mouseY, 0, height, -parallaxStrength, parallaxStrength);

    push();
    translate(width / 2 + offsetX, height / 2 + offsetY);
    scale(this.scaleFactor);
    translate(-width / 2, -height / 2);

    tint(255, layerAlpha);

    textSize(this.symbolSize * 0.8);

    for (let y = 0; y < this.rows / 2; y++) {
      for (let x = 0; x < this.cols / 2; x++) {
        if (this.inAnimatedRectangleCutout(x, y)) continue;
        if (this.inAnimatedBlobCutout(x, y)) continue;

        let nx = (x + this.seed * 1000) * this.noiseScale;
        let ny = (y + this.seed * 1000) * this.noiseScale;
        let n = noise(nx, ny, this.t);

        n = adjustContrast(n, contrast);

        let index = floor(n * (this.chars.length - 1));
        let c = this.chars[index];

        let col = color((hueBase + n * 60 + this.seed * 30) % 360, sat, bright * n);
        fill(col);

        this.drawChar(c, x, y);
        this.drawChar(c, this.cols - 1 - x, y);
        this.drawChar(c, x, this.rows - 1 - y);
        this.drawChar(c, this.cols - 1 - x, this.rows - 1 - y);
      }
    }
    pop();
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