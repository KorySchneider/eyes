'use strict';

const debug = true;

const webcamWidth = 960;
const webcamHeight = 720;

let video;
let poseNet;
let poses = [];
let eyes = [];

let eyeBoxSize = 40;

class Eye {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
  }
}

function modelLoaded() {
  document.querySelector('.message').innerText = '';
  loop();
}

function setup() {
  noLoop(); // Don't start drawing until model is loaded
  frameRate(30);

  createCanvas(webcamWidth, webcamHeight);
  video = createCapture(VIDEO);
  video.size(width, height);

  // Load model and start draw loop when finished
  poseNet = ml5.poseNet(video, 'multiple', modelLoaded);

  // Find poses every frame
  poseNet.on('pose', results => poses = results);

  video.hide(); // Hide video element, only draw canvas

  // Display message if no webcam available
  navigator.mediaDevices.getUserMedia({ video: true }).catch(err => {
    document.querySelector('.message').innerText = 'You need a webcam for this to work'
  });
}

function draw() {
  // Draw video frame image
  image(video, 0, 0, width, height);

  // If poses were detected in current frame
  if (poses) {
    // Find eyes
    eyes = [];
    // For each pose
    for (let i = 0; i < poses.length; i++) {
      // For each eye
      for (let j = 1; j < 3; j++) {
        // Create Eye object for each eye found
        let eye = poses[i].pose.keypoints[j];
        if (eye.score > 0.25) { // Want to be fairly sure it's an eye
          eyes.push(
            new Eye(
              get( // Grab pixels
                eye.position.x - (eyeBoxSize/2),
                eye.position.y - (eyeBoxSize/2),
                eyeBoxSize,
                eyeBoxSize
              ),
              eye.position.x,
              eye.position.y
            )
          );
        }
      }
    }

    // Hide frame once we've used it to find poses
    if (debug) {
      fill(0, 0, 0, 180);
      noStroke();
      rect(0, 0, width, height);
    } else {
      fill(0);
      noStroke();
      rect(0, 0, width, height);
    }

    // Draw all eyes found
    for (let i = 0; i < eyes.length; i++) {
      let eye = eyes[i];
      if (eye.img.pixels) {
        image(
          eye.img,
          eye.x - (eyeBoxSize/2),
          eye.y - (eyeBoxSize/2),
          eyeBoxSize,
          eyeBoxSize
        );
      }
      if (debug) {
        stroke(255, 0, 0);
        noFill();
        rect(
          eye.x - (eyeBoxSize/2),
          eye.y - (eyeBoxSize/2),
          eyeBoxSize,
          eyeBoxSize
        );
      }
    }
  }
}
