'use strict';

let debug = false;

const webcamWidth = 960;
const webcamHeight = 720;

const eyeBoxScale = 0.45;
const eyeScoreThreshold = 0.2;

let video;
let poseNet;
let poses = [];
let eyes = [];

class Eye {
  constructor(img, x, y, size) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.size = size;
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
      // Find eye position and distance between
      const leftEye = poses[i].pose.keypoints[1];
      const rightEye = poses[i].pose.keypoints[2];
      const eyeDist = dist(
        leftEye.position.x,
        leftEye.position.y,
        rightEye.position.x,
        rightEye.position.y,
      ) * eyeBoxScale;

      // If we're pretty sure those are eyes
      if (leftEye.score >= eyeScoreThreshold && rightEye.score >= eyeScoreThreshold) {
        // Get left eye
        eyes.push(new Eye(
          get(
            leftEye.position.x - (eyeDist / 2),
            leftEye.position.y - (eyeDist / 2),
            eyeDist,
            eyeDist,
          ),
          leftEye.position.x,
          leftEye.position.y,
          eyeDist
        ));

        // Get right eye
        eyes.push(new Eye(
          get(
            rightEye.position.x - (eyeDist / 2),
            rightEye.position.y - (eyeDist / 2),
            eyeDist,
            eyeDist,
          ),
          rightEye.position.x,
          rightEye.position.y,
          eyeDist
        ));
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

    // Draw all pairs of eyes found
    for (let i = 0; i < eyes.length; i++) {
      let eye = eyes[i];
      if (eye.img.width > 0) {
        image(
          eye.img,
          eye.x - (eye.size / 2),
          eye.y - (eye.size / 2),
          eye.size,
          eye.size,
        );
      }
      if (debug) {
        stroke(255, 0, 0);
        noFill();
        rect(
          eye.x - (eye.size / 2),
          eye.y - (eye.size / 2),
          eye.size,
          eye.size,
        );
      }
    }
  }
}
