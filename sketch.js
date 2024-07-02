// to do
// - layout and scaling for wheels, spokes
// - layout and positioning for the bars
// - cosmetics: buttons / slider etc.
// 

let numWheels = 11;

let playingSources = [];
let clearButton;

let rightarrowButton;
let leftarrowButton;

let angle = 0;
let numSpokes = 32;
let spokeVisible = [];
for (let i = 1; i <= numWheels; i++) {
  spokeVisible[i] = [];
  for (let j = 0; j < numSpokes; j++) {
    spokeVisible[i][j] = false;
  }
}

let angleSlider;
let durationSlider;
let scaleFactor = 0.7; // Scale factor to reduce size if needed (not used here)
let selectedWheel = 1; // Track wheel (1 to 11)

let timeouts = [];
let isPlaying = false;
let playButton;

let startTime, endTime, duration, isAnimating = false;
let startAngle, endAngle;
let slowDownFactor = 32.0; // Factor to slow down the animation - scales fine

let barColors = []; // bar colours array

// sample sets
let loadedInstrumentSetBuffers = {};
let individualInstrumentArray = new Array(37).fill(1);

// clickable buttons for instruments
let debounceTimer;
let debounceTimerArray; 
let buttonSize = 20; // Example size of the button
let ellipseButtons = [];
let ellipseColors = [
  [255,228,209],   // Red
  [203,237,209],   // Green
  [187,234,255]    // Blue
];

// Audio
// BufferLoader class to handle loading audio files
let audioBuffers = [];
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let bufferLoader;

// BufferLoader class to handle loading audio files
function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  let loader = this;

  request.onload = function() {
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          console.error('Error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length) {
          loader.onload(loader.bufferList);
        }
      },
      function(error) {
        console.error('decodeAudioData error for ' + url, error);
      }
    );
  };

  request.onerror = function() {
    console.error('BufferLoader: XHR error for ' + url);
  };

  request.send();
};

BufferLoader.prototype.load = function() {
  for (let i = 0; i < this.urlList.length; ++i) {
    this.loadBuffer(this.urlList[i], i);
  }
};

function preload() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  loadAudioSet(individualInstrumentArray);
}

// Function to load audio set based on individualInstrumentArray
function loadAudioSet(individualInstrumentArray) {
  let filePathsToLoad = [];
  let bufferIndicesToLoad = [];

  for (let i = 0; i < 37; i++) {
    let setNumber = individualInstrumentArray[i];
    let instrumentSet = '';

    if (setNumber === 1) {
      instrumentSet = 'comb';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
      instrumentSet = 'guitar';
    } else {
      console.error(`Invalid set number ${setNumber} at index ${i}`);
      return;
    }

    let filePath = `${instrumentSet}/${i}.mp3`;
    filePathsToLoad.push(filePath);
    bufferIndicesToLoad.push(i);
  }

  if (filePathsToLoad.length > 0) {
    bufferLoader = new BufferLoader(
      audioContext,
      filePathsToLoad,
      (newBufferList) => finishedLoading(newBufferList, bufferIndicesToLoad)
    );
    bufferLoader.load();
  } else {
    // If no files need to be loaded, call finishedLoading with an empty array
    finishedLoading([], []);
  }
}

function finishedLoading(newBufferList, bufferIndicesToLoad) {
  for (let i = 0; i < newBufferList.length; i++) {
    let bufferIndex = bufferIndicesToLoad[i];
    audioBuffers[bufferIndex] = newBufferList[i];

    let setNumber = individualInstrumentArray[bufferIndex];
    let instrumentSet = '';
    if (setNumber === 1) {
      instrumentSet = 'comb';
    } else if (setNumber === 2) {
      instrumentSet = 'piano';
    } else if (setNumber === 3) {
      instrumentSet = 'guitar';
    }

    let filePath = `${instrumentSet}/${bufferIndex}.mp3`;
    loadedInstrumentSetBuffers[filePath] = newBufferList[i];
  }

  // Remove entries from loadedInstrumentSetBuffers that were not loaded in this batch
  if (newBufferList.length > 0) {
    let filePathsLoaded = newBufferList.map((buffer, index) => {
      let bufferIndex = bufferIndicesToLoad[index];
      let setNumber = individualInstrumentArray[bufferIndex];
      let instrumentSet = '';
      if (setNumber === 1) {
        instrumentSet = 'comb';
      } else if (setNumber === 2) {
        instrumentSet = 'piano';
      } else if (setNumber === 3) {
        instrumentSet = 'guitar';
      }
      return `${instrumentSet}/${bufferIndex}.mp3`;
    });

    for (let filePath in loadedInstrumentSetBuffers) {
      if (!filePathsLoaded.includes(filePath)) {
        delete loadedInstrumentSetBuffers[filePath];
      }
    }
  }
}

let majorPentatonic = {
  0: 0,
  1: 2,
  2: 4,
  3: 7,
  4: 9,
  5: 12,
  6: 14,
  7: 16,
  8: 19,
  9: 21,
  10: 24,
  11: 26,
  12: 28,
  13: 31,
  14: 33,
  15: 36
}

let minorPentatonic = {
  0: 0,
  1: 3,
  2: 5,
  3: 7,
  4: 10,
  5: 12,
  6: 15,
  7: 17,
  8: 19,
  9: 22,
  10: 24,
  11: 27,
  12: 29,
  13: 31,
  14: 34,
  15: 36
}

let ionian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 11,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 23,
  14: 24,
  15: 26
}

let dorian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let mixolydian = {
  0: 0,
  1: 2,
  2: 4,
  3: 5,
  4: 7,
  5: 9,
  6: 10,
  7: 12,
  8: 14,
  9: 16,
  10: 17,
  11: 19,
  12: 21,
  13: 22,
  14: 24,
  15: 26
}

let aeolian = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 10,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 22,
  14: 24,
  15: 26
}

let chromatic = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15
}

let harmonicMinor = {
  0: 0,
  1: 2,
  2: 3,
  3: 5,
  4: 7,
  5: 8,
  6: 11,
  7: 12,
  8: 14,
  9: 15,
  10: 17,
  11: 19,
  12: 20,
  13: 23,
  14: 24,
  15: 26
}

let wholeTone = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
  11: 22,
  12: 24,
  13: 26,
  14: 28,
  15: 30
}

let octatonic = {
  0: 0,
  1: 1,
  2: 3,
  3: 4,
  4: 6,
  5: 7,
  6: 9,
  7: 10,
  8: 12,
  9: 13,
  10: 15,
  11: 16,
  12: 18,
  13: 19,
  14: 21,
  15: 22
}

// initial scale mapping (ie the default)
let scaleMappings = majorPentatonic;

function setup() {
  textFont("Arial");
  createCanvas(windowWidth, windowHeight);
  // draw border around the sketch
  graphics = createGraphics(windowWidth, windowHeight);
  graphics.stroke(0, 50); // Set border color
  graphics.strokeWeight(3); // Set border weight
  graphics.noFill(); // Ensure the border is not filled
  graphics.rect(0, 0, windowWidth, windowHeight); // Draw border rect with same size as canvas   
  frameRate(60);
  
  getAudioContext().resume();
  
  clearButton = createImg('images/bin_icon.jpg', '✖');
  clearButton.size(45, 45);
  clearButton.position(windowWidth-50, 30);
  clearButton.mousePressed(clearNotes);  
  
  // play button
  playButton = createImg('images/play_icon.jpg', '▶');   
  playButton.size(45, 45); 
  playButton.position(10, 30);
  playButton.mousePressed(togglePlayback);
  
  rightarrowButton = createImg('images/leftarrow_icon.jpg', '<');
  rightarrowButton.size(45, 45);
  rightarrowButton.position(10, 30 + playButton.height + 15);
  rightarrowButton.mousePressed(rightarrowPressed); 
  
  leftarrowButton = createImg('images/rightarrow_icon.jpg', '>');
  leftarrowButton.size(45, 45);
  leftarrowButton.position(10 + rightarrowButton.width, 30 + playButton.height + 15);
  leftarrowButton.mousePressed(leftarrowPressed);     
  
  // create metro icon for tempo control
  metroImage = createImg('images/metro_icon.jpg', 'tempo');
  metroImage.size(45, 45);
  metroImage.position(10 + playButton.width, 30)

  // duration / speed slider
  durationSlider = createSlider(0.1, 0.4, 0.3, 0);
  durationSlider.position(10 + playButton.width + metroImage.width, 40); 
  
  // slider to rotate wheels
  angleSlider = createSlider(0, TWO_PI, 0, 0.01);
  angleSlider.position(10 + playButton.width + metroImage.width, 60);  
  angleSlider.attribute('hidden', '');  
  
  // increment numWheels
  let addButton = createImg('images/plus_ring.jpg', '+');
  addButton.size(45, 45);
  addButton.position(windowWidth - 55 - addButton.width, 30);
  addButton.mousePressed(() => {
    if (numWheels < 15) {
    numWheels++;
    initializePointsArray();
    }
  });

  let removeButton = createImg('images/minus_ring.jpg', '-');
  removeButton.size(45, 45);
  removeButton.position(windowWidth - 60- removeButton.width - addButton.width, 30);
  removeButton.mousePressed(() => {
    if (numWheels > 3) {
      numWheels--;
      initializePointsArray();
    }
  });  
  
  // dropdown menus for scales and instruments
  // Scale dropdown
  scalesDropdown = createSelect();
  
  // Add options
  scalesDropdown.option('Select a Scale:', ''); // This will be the heading

  scalesDropdown.option('--- Pentatonic ---', 'disabled');
  scalesDropdown.option('Major');
  scalesDropdown.option('Minor');

  scalesDropdown.option('--- Modal ---', 'disabled');
  scalesDropdown.option('Ionian');
  scalesDropdown.option('Dorian');
  scalesDropdown.option('Mixolydian');
  scalesDropdown.option('Aeolian');
  
  scalesDropdown.option('--- Other ---', 'disabled');
  scalesDropdown.option('Chromatic');
  scalesDropdown.option('Harmonic Minor');
  scalesDropdown.option('Whole Tone');
  scalesDropdown.option('Octatonic');
  scalesDropdown.position(windowWidth/2, windowHeight - 25);

  // Set a callback function for when an option is selected
  scalesDropdown.changed(changeScale);
  
  // Instrument dropdown
  instrumentDropdown = createSelect();
  
  // Add options to the dropdown
  instrumentDropdown.option('Select an Instrument:', '');
  instrumentDropdown.option('Comb');
  instrumentDropdown.option('Piano');
  instrumentDropdown.option('Harp');
  
  instrumentDropdown.position(10, windowHeight - 25);
  // Set a callback function for when an option is selected
  instrumentDropdown.changed(changeInstrument);    
  
  // Initialize barColors to default
  for (let i = 0; i < numWheels; i++) {
    barColors[i] = color(0, 60);
  }
}

let lastFrameTime = 0;
function draw() {
  let currentFrameTime = millis();
  if (currentFrameTime - lastFrameTime > 16) { // ~60 FPS  
    background(250);
    image(graphics, 0, 0);
    let circle_thickness = 2;
    strokeWeight(circle_thickness);

    // Define center position
    let centerX = windowWidth / 0.91;
    let centerY = windowHeight / 1.39;

    // Update angle based on animation state
    if (isAnimating) {
      let currentTime_animation = millis();
      if (currentTime_animation >= endTime) {
        // Loop the angle animation
        startTime = currentTime_animation;
        endTime = startTime + duration;
        startAngle = angleSlider.value();
        endAngle = startAngle + TWO_PI;
      }
      let t = (currentTime_animation - startTime) / duration;
      angle = lerp(startAngle, endAngle, t);
      angleSlider.value(angle % TWO_PI); // Update the slider value
    } else {
      angle = angleSlider.value();
    }

    // Draw the wheels in reverse order
    for (let i = numWheels; i >= 1; i--) {
      push();
      // 30 here is the offset position for the wheels
      wheelSpacingX = (windowWidth/numWheels)*0.5;
      wheelSpacingY = (windowHeight/numWheels)*0.5;      
      startingwheelX = windowWidth * 0.2
      startingwheelY = windowHeight * 0.7      
      
      translate(startingwheelX + (i - 1) * wheelSpacingX, startingwheelY - (i - 1) * wheelSpacingY); // Adjusted position for overlap
      if (selectedWheel === i || selectedWheel < 1 || selectedWheel > numWheels) {
        drawWheel(200 * scaleFactor, spokeVisible[i], 190);
      } else {
        drawWheel(200 * scaleFactor, spokeVisible[i], 15);
      }
      pop();
    }

    // Draw transparent bars
    let bar_thickness = 3; // Adjust as needed
    strokeWeight(bar_thickness);
    for (let i = 0; i < numWheels; i++) {
      stroke(barColors[i]);
      strokeWeight(bar_thickness);
      let barOffsetX = 90
      let barOffsetY = -10
      let startX = barOffsetX+startingwheelX + i * wheelSpacingX;
      let startY = barOffsetY+startingwheelY - i * wheelSpacingY;
      let endX = startX + 80 - i * 5; // Adjust the length as needed
      let endY = startY;
      line(startX, startY, endX, endY);
      
      
    // draw the clickable instrument buttons
    let buttonSize = 20; // Example size of the button
    let buttonX = endX;
    let buttonY = endY;
    ellipseButtons.push({ id: i, x: buttonX, y: buttonY, size: buttonSize });
    
    // Adjust color index using scaleMappings
    let originalIndex = scaleMappings[i];
    let colIndex = individualInstrumentArray[originalIndex] - 1;
    
    fill(ellipseColors[colIndex]); // ellipse color
    stroke(barColors[i]); // Stroke color same as bar color
    strokeWeight(0);
    
    // Draw the button (a circle)
    ellipse(buttonX, buttonY, buttonSize, buttonSize);           
    }
  }
}

function drawWheel(diameter, visibleSpokes, alpha) {
  stroke(0, 0, 0, alpha);
  strokeWeight(1.5)
  fill(253, 253, 253, alpha);
  ellipse(0, 0, diameter, diameter);
  
  let spokeExtension = 10 * scaleFactor;
  
  // Draw the spokes
  for (let i = 0; i < numSpokes; i++) {
    let originalX = cos(angle + i * TWO_PI / numSpokes) * (diameter / 2);
    let originalY = sin(angle + i * TWO_PI / numSpokes) * (diameter / 2);    
    
    let x1 = cos(angle + i * TWO_PI / numSpokes) * (diameter / 2 - spokeExtension);
    let y1 = sin(angle + i * TWO_PI / numSpokes) * (diameter / 2 - spokeExtension);
    let x2 = cos(angle + i * TWO_PI / numSpokes) * (diameter / 2 + 25 * scaleFactor);
    let y2 = sin(angle + i * TWO_PI / numSpokes) * (diameter / 2 + 25 * scaleFactor);
    
    if (visibleSpokes[i]) {
      drawSpoke(x1, y1, x2, y2, alpha);
    }
    drawMark(originalX, originalY, alpha); // Draw the mark on the wheel
  }
}

function drawSpoke(x1, y1, x2, y2, alpha) {
  stroke(0, alpha); // Set stroke color and alpha
  fill(0, alpha); // Set fill color and alpha
  
  // Calculate the direction vector of the line
  let dx = x2 - x1;
  let dy = y2 - y1;
  
  // Normalize the direction vector
  let length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    console.error("Zero length vector:", dx, dy);
    return;
  }
  dx /= length;
  dy /= length;
  
  // Calculate the perpendicular vector for the width of the triangle
  let perpX = -dy;
  let perpY = dx;
  
  // Adjust the width to be very thin
  let halfWidth = 1.9; // Adjust this value for desired thinness

  // Calculate the three vertices of the triangle
  let x3 = x1 - perpX * halfWidth;
  let y3 = y1 - perpY * halfWidth;
  let x4 = x1 + perpX * halfWidth;
  let y4 = y1 + perpY * halfWidth;

  // Draw the triangle
  triangle(x3, y3, x4, y4, x2, y2);
}

function drawMark(x, y, alpha) {
  fill(0, 0, 0, alpha);
  noStroke();
  ellipse(x, y, 5 * scaleFactor, 5 * scaleFactor); // Small circle as a mark
}

function mouseClicked() {
  // Check if mouse click is on any of the spokes for the selected wheel
  if (selectedWheel >= 1 && selectedWheel <= numWheels) {
    checkSpokes(startingwheelX + (selectedWheel - 1) * wheelSpacingX, startingwheelY - (selectedWheel - 1) * wheelSpacingY, spokeVisible[selectedWheel]);
  }
}

const touchThreshold = 50; // Adjust this threshold as needed

function touchStarted() {
  if (touches.length > 0) {
    let touchX = touches[0].x;
    let touchY = touches[0].y;
    
    let buttonClicked = false;

    for (let btn of ellipseButtons) {
      let d = dist(touchX, touchY, btn.x, btn.y);
      if (d < btn.size / 1.8) {
        updateIndividualInstrumentArray(btn.id);
        buttonClicked = true;
      }
    }    

    // Check if touch is near any of the spokes for the selected wheel
    if (selectedWheel >= 1 && selectedWheel <= numWheels) {
      let spokeX = 100 + (selectedWheel - 1) * 10;
      let spokeY = 200 - (selectedWheel - 1) * 10;
      let d = dist(touchX, touchY, spokeX, spokeY);

      // Adjust the hit area to make it easier to touch
      if (d <= touchThreshold) {
        checkSpokes(spokeX, spokeY, spokeVisible[selectedWheel]);
      }
    }
  }
}


function checkSpokes(centerX, centerY, visibleSpokes) {
  for (let i = 0; i < numSpokes; i++) {
    let x1 = cos(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2);
    let y1 = sin(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2);
    let x2 = cos(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2 + 50 * scaleFactor);
    let y2 = sin(angle + i * TWO_PI / numSpokes) * (200 * scaleFactor / 2 + 50 * scaleFactor);
    let d = dist(mouseX - centerX, mouseY - centerY, x1, y1); // Distance from mouse to spoke
    if (d < 10) {
      visibleSpokes[i] = !visibleSpokes[i];
      break;
    }
  }
}

function keyPressed() { // idiot
  if (keyCode === LEFT_ARROW) {
    rightarrowPressed()
  }
  if (keyCode === RIGHT_ARROW) {
    leftarrowPressed()
  } 
}

function rightarrowPressed() {
  selectedWheel = max(0, selectedWheel - 1);
  if (selectedWheel <= 0) {
    rightarrowButton.attribute('disabled', 'true');
    rightarrowButton.attribute('src', 'images/leftarrow_disabled_icon.jpg'); 
  }
  if (selectedWheel >=0) {
    leftarrowButton.removeAttribute('disabled');
    leftarrowButton.attribute('src', 'images/rightarrow_icon.jpg'); 
  }
}

function leftarrowPressed() {
  selectedWheel = min(numWheels+1, selectedWheel + 1);
  if (selectedWheel >= numWheels+1) {
    leftarrowButton.attribute('disabled', 'true');
    leftarrowButton.attribute('src', 'images/rightarrow_disabled_icon.jpg'); 
  } else if (selectedWheel >=0) {
    rightarrowButton.removeAttribute('disabled');
    rightarrowButton.attribute('src', 'images/leftarrow_icon.jpg'); 
  }
}

function togglePlayback() {
  if (isPlaying) {
    stopSounds();
  } else {
    playSounds();
    startAngleAnimation();
  }
}

function playSounds() {
  isPlaying = true;
  playButton.attribute('src', 'images/stop_icon.jpg'); // Change back to play icon

  
  // mapping duration (reverse)
  let unmappedDuration = durationSlider.value(); // Convert to milliseconds
  let duration = map(unmappedDuration, 0.1, 0.4, 0.4, 0.1) * 1000
  let currentTime_animation = 0;
  
  durationSlider.attribute('disabled', '');

  // Loop through all spokes regardless of visibility
  for (let i = numSpokes - 1; i >= 0; i--) {
    let timeoutID = setTimeout((spokeIndex) => {
      for (let j = 1; j <= numWheels; j++) {
        if (spokeVisible[j][spokeIndex]) {
          let bufferIndex = scaleMappings[j - 1];
          playSound(bufferIndex);
          flashBar(j - 1); // Flash the corresponding bar (adjust for 0-based index)
        }
      }
    }, currentTime_animation, i);
    timeouts.push(timeoutID);

    currentTime_animation += duration;
  }

  // Set a timeout to loop the playback
  let finalTimeoutID = setTimeout(() => {
    playSounds(); // Restart playback
  }, currentTime_animation);
  timeouts.push(finalTimeoutID);
}

function playSound(index) {
  if (audioBuffers[index]) {
    let source = audioContext.createBufferSource();
    source.buffer = audioBuffers[index];
    let gainNode = audioContext.createGain();
    gainNode.gain.value = 0.25;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(0);
    playingSources.push(source);

    // Clean up old sources
    source.onended = function() {
      let index = playingSources.indexOf(source);
      if (index > -1) {
        playingSources.splice(index, 1);
      }
    };
  }
}

function stopSounds() {
  isPlaying = false;
  playButton.attribute('src', 'images/play_icon.jpg'); // Change back to play icon
  
  durationSlider.removeAttribute('disabled');

  // Clear all timeouts to stop the playback
  for (let i = 0; i < timeouts.length; i++) {
    clearTimeout(timeouts[i]);
  }
  timeouts = [];
  stopAngleAnimation();

  // Stop all currently playing sounds and wait for them to finish
  let promises = playingSources.map(source => new Promise(resolve => {
    source.onended = resolve;
  }));
}

function startAngleAnimation() {
  startTime = millis();
  unmappedDuration = durationSlider.value(); // Convert to milliseconds
  duration = map(unmappedDuration, 0.1, 0.4, 0.4, 0.1) * 1000  
  
  duration = duration * slowDownFactor; // Convert duration to milliseconds and apply slow down factor
  startAngle = angleSlider.value();
  endAngle = startAngle + TWO_PI; // Loop back to the start angle
  isAnimating = true;
}

function stopAngleAnimation() {
  isAnimating = false;
  
  let duration = 1000; // Duration in milliseconds for the reset (adjust as needed)
  let currentAngle = angleSlider.value();
  let step = currentAngle / (duration / 10); // Incremental step for each frame update
  
  // Update angle gradually
  let interval = setInterval(() => {
    currentAngle -= step;
    angle = currentAngle;
    angleSlider.value(currentAngle);
    
    if (currentAngle <= 0) {
      clearInterval(interval); // Stop the interval when angle reaches 0
    }
  }, 1); // Update every 2 milliseconds (adjust as needed)
}

function flashBar(barIndex) {
  // Flash the bar for the selected barIndex
  barColors[barIndex] = color(255, 75); // White color
  // Reset the color back to default after a short delay
  setTimeout(() => {
    barColors[barIndex] = color(0, 60); // Default color
  }, 70); // Adjust the delay as needed
}

function clearNotes() {
  for (let i = 1; i <= numWheels; i++) {
    spokeVisible[i] = [];
    for (let j = 0; j < numSpokes; j++) {
      spokeVisible[i][j] = false;
    }
  }
  instrumentDropdown.selected('Comb');
  individualInstrumentArray = new Array(37).fill(1);      
}


function initializePointsArray() {
  let newSpokeVisible = [];

  for (let i = 1; i <= numWheels; i++) {
    barColors[i] = color(0, 60);
    newSpokeVisible[i] = [];
    if (spokeVisible[i]) {
      // Copy existing spokes data
      for (let j = 0; j < numSpokes; j++) {
        newSpokeVisible[i][j] = spokeVisible[i][j];
      }
    } else {
      // Initialize new wheel spokes as false
      for (let j = 0; j < numSpokes; j++) {
        newSpokeVisible[i][j] = false;
      }
    }
  }

  spokeVisible = newSpokeVisible;
}

function changeInstrument() {
  // Initialise new sample set here
  let selectedInstrument = instrumentDropdown.value();
  if (selectedInstrument !== 'disabled') {
    // Process selected scale
    
    if (selectedInstrument === 'Comb') {
      individualInstrumentArray = new Array(37).fill(1);
    }    
    
    if (selectedInstrument === 'Piano') {
      individualInstrumentArray = new Array(37).fill(2);
    }
    if (selectedInstrument === 'Harp') {
      individualInstrumentArray = new Array(37).fill(3);
    }
    console.log('Selected instrument:', selectedInstrument);
    
    loadAudioSet(individualInstrumentArray);
  }
}

function changeScale() {
  // Handle the change in scale selection here
  let selectedScale = scalesDropdown.value();
  if (selectedScale !== 'disabled') {
    // Process selected scale
    if (selectedScale === 'Major') {// pentatonic
      scaleMappings = majorPentatonic;
    } 
    if (selectedScale === 'Minor') {// pentatonic
      scaleMappings = minorPentatonic;
    }     
    if (selectedScale === 'Ionian') {
      scaleMappings = ionian;
    }
    if (selectedScale === 'Dorian') {
      scaleMappings = dorian;
    }
    if (selectedScale === 'Mixolydian') {
      scaleMappings = mixolydian;
    }
    if (selectedScale === 'Aeolian') {
      scaleMappings = aeolian;
    }
    if (selectedScale === 'Chromatic') {
      scaleMappings = chromatic;
    }
    if (selectedScale === 'Harmonic Minor') {
      scaleMappings = harmonicMinor;
    }    
    if (selectedScale === 'Whole Tone') {
      scaleMappings = wholeTone;
    }
    if (selectedScale === 'Octatonic') {
      scaleMappings = octatonic;
    }
  }
}

function updateIndividualInstrumentArray(indexToUpdate) {
  // Clear previous debounce timer
  clearTimeout(debounceTimerArray);

  // Set a new debounce timer
  debounceTimerArray = setTimeout(() => {
    // Ensure indexToUpdate is within valid range
    if (indexToUpdate >= 0 && indexToUpdate < individualInstrumentArray.length) {
      
      // map the value according to scale dictionary
      indexToUpdate = scaleMappings[indexToUpdate];
      
      
      // Update the value at the specified indexToUpdate
      // Increment the value and constrain it to 1, 2, or 3
      individualInstrumentArray[indexToUpdate] = (individualInstrumentArray[indexToUpdate] % 3) + 1;
      
      // Reload audio set with updated individualInstrumentArray
      loadAudioSet(individualInstrumentArray);
    }
  }, 50); // Adjust debounce delay as needed (e.g., 50 milliseconds)
}