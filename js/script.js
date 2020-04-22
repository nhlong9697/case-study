const GAMEBOARD_WIDTH = 512;
const GAMEBOARD_HEIGHT = 512;
const FOREGROUND_HEIGHT = 80;
const PIPE_GAP = 150;
const GRAVITY = 1.5;
const JUMP = 25;
const video = document.getElementById("video");
const videoCanvas = document.getElementById("videoCanvas");
const videoContext = videoCanvas.getContext("2d");
const modelParams = {
  flipHorizontal: true, // flip e.g for video
  imageScaleFactor: 0.7, // reduce input image size for gains in speed.
  maxNumBoxes: 20, // maximum number of boxes to detect
  iouThreshold: 0.5, // ioU threshold for non-max suppression
  scoreThreshold: 0.5, // confidence threshold for predictions.
};
const PIPE_DISTANCE = 125;

const BACKGROUND_IMAGE_SRC = "./images/bg.png";
const BIRD_IMAGE_SRC = "./images/bird.png";
const FOREGROUND_IMAGE_SRC = "./images/fg.png";
const NORTH_PIPE_IMAGE_SRC = "./images/pipeNorth.png";
const SOUTH_PIPE_IMAGE_SRC_SRC = "./images/pipeSouth.png";

const DEFAULT_BIRD_Y = 150;
const DEFAULT_BIRD_X = 10;

function Bird(xBird, yBird) {
  this.xBird = xBird;
  this.yBird = yBird;
  this.birdImage = new Image();
  this.birdImage.src = BIRD_IMAGE_SRC;
  this.jump = (event) => {
    if (event.which == 38) {
      this.yBird -= JUMP;
    }
  };
}

function Pipe(cvs) {
  this.northPipeImage = new Image();
  this.northPipeImage.src = NORTH_PIPE_IMAGE_SRC;
  this.southPipeImage = new Image();
  this.southPipeImage.src = SOUTH_PIPE_IMAGE_SRC_SRC;
  this.xSouthPipe = GAMEBOARD_WIDTH;
  this.ySouthPipe =
    Math.random() * (GAMEBOARD_HEIGHT - FOREGROUND_HEIGHT - PIPE_GAP) +
    PIPE_GAP;
  this.xNorthPipe = GAMEBOARD_WIDTH;
  this.yNorthPipe = 0;
}

function Player() {
  this.score = 0;
}

function Board(cvs, bird, pipe, player) {
  this.bird = bird;
  this.pipes = [pipe];
  this.player = player;
  this.ctx = cvs.getContext("2d");
  this.start = () => {
    //draw background
    let backgroundImage = new Image();
    backgroundImage.src = BACKGROUND_IMAGE_SRC;
    this.ctx.drawImage(backgroundImage, 0, 0, cvs.width, cvs.height);

    this.ctx.drawImage(this.bird.birdImage, this.bird.xBird, this.bird.yBird);
    this.bird.yBird += GRAVITY;

    //draw foreground
    let foregroundImage = new Image();
    foregroundImage.src = FOREGROUND_IMAGE_SRC;
    this.ctx.drawImage(
      foregroundImage,
      0,
      cvs.height - FOREGROUND_HEIGHT,
      cvs.width,
      FOREGROUND_HEIGHT
    );
    //draw pipes

    for (let i = 0; i < this.pipes.length; i++) {
      this.ctx.drawImage(
        this.pipes[i].northPipeImage,
        this.pipes[i].xNorthPipe,
        this.pipes[i].yNorthPipe,
        this.pipes[i].northPipeImage.width,
        this.pipes[i].ySouthPipe - PIPE_GAP
      );
      this.ctx.drawImage(
        this.pipes[i].southPipeImage,
        this.pipes[i].xSouthPipe,
        this.pipes[i].ySouthPipe,
        this.pipes[i].southPipeImage.width,
        GAMEBOARD_HEIGHT - this.pipes[i].ySouthPipe - FOREGROUND_HEIGHT
      );

      //move pipe
      this.pipes[i].xNorthPipe--;
      this.pipes[i].xSouthPipe--;

      //add new pipe
      if (this.pipes[i].xNorthPipe == PIPE_DISTANCE) {
        let newPipe = new Pipe();
        this.pipes.push(newPipe);
      }

      //add score
      if (this.pipes[i].xNorthPipe == DEFAULT_BIRD_X) {
        this.player.score++;
      }

      //check crash
      if (
        //crash the pipe
        (this.bird.xBird + this.bird.birdImage.width >=
          this.pipes[i].xNorthPipe &&
          this.bird.xBird <=
            this.pipes[i].xNorthPipe + this.pipes[i].northPipeImage.width &&
          (this.bird.yBird <=
            this.pipes[i].yNorthPipe + this.pipes[i].ySouthPipe - PIPE_GAP ||
            this.bird.yBird + this.bird.birdImage.height >=
              this.pipes[i].yNorthPipe + this.pipes[i].ySouthPipe)) ||
        //crash the ground
        this.bird.yBird + this.bird.birdImage.height >=
          GAMEBOARD_HEIGHT - FOREGROUND_HEIGHT
      ) {
        window.location.reload(true); // reload the page
      }
      //delete passed pipe
      if (this.pipes[i].xNorthPipe < 0) {
        this.pipes.slice(i, 1);
      }
      //draw score
      this.ctx.fillText(
        "Score: " + this.player.score,
        10,
        GAMEBOARD_HEIGHT - 20
      );
    }

    requestAnimationFrame(this.start);
  };
}
function init() {
  let cvs = document.getElementById("canvas");
  let bird = new Bird(DEFAULT_BIRD_X, DEFAULT_BIRD_Y);
  let pipe = new Pipe(cvs);
  let player = new Player();
  let board = new Board(cvs, bird, pipe, player);
  let model = null;
  document.addEventListener("keydown", bird.jump);
  // Load the model.
  handTrack.load(modelParams).then((lmodel) => {
    // detect objects in the image.
    model = lmodel;
    handTrack.startVideo(video).then((status) => {
      console.log("video started", status);
      if (status) {
        runDetection();
      }
    });
  });
  board.start();

  function runDetection() {
    model.detect(video).then((predictions) => {
      console.log("Predictions: ", predictions);
      model.renderPredictions(predictions, videoCanvas, videoContext, video);
      if (predictions.length > 0) {
        console.log("hand found");
        bird.yBird -= JUMP;
        console.log(bird.yBird);
      }
      requestAnimationFrame(runDetection);
    });
  }
}
//fix bug later regarding score issue
