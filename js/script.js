const GAMEBOARD_WIDTH = 512;
const GAMEBOARD_HEIGHT = 512;
const PIPE_GAP = 85;
const GRAVITY = 1.5;
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

const BACKGROUND_IMAGE_SRC = "./images/bg.png";
const BIRD_IMAGE_SRC = "./images/bird.png";
const FOREGROUND_IMAGE_SRC = "./images/fg.png";
const NORTH_PIPE_IMAGE_SRC = "./images/pipeNorth.png";
const SOUTH_PIPE_IMAGE_SRC_SRC = "./images/pipeSouth.png";

const DEFAULT_BIRD_Y = 150;
const DEFAULT_BIRD_X = 10;

function Bird() {
  this.xBird = DEFAULT_BIRD_X;
  this.yBird = DEFAULT_BIRD_Y;
  this.birdImage = new Image();
  this.birdImage.src = BIRD_IMAGE_SRC;
  this.jump = (event) => {
    if (event.which == 38) {
      this.yBird -= 25;
    }
  };

}

function Pipe(cvs) {
  this.northPipeImage = new Image();
  this.northPipeImage.src = NORTH_PIPE_IMAGE_SRC;
  this.southPipeImage = new Image();
  this.southPipeImage.src = SOUTH_PIPE_IMAGE_SRC_SRC;
  this.xPipe = GAMEBOARD_WIDTH;
  this.yPipe =
    Math.random() * this.northPipeImage.height - this.northPipeImage.height;
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
      cvs.height - foregroundImage.height,
      cvs.width,
      foregroundImage.height
    );
    //draw pipes

    for (let i = 0; i < this.pipes.length; i++) {
      this.ctx.drawImage(
        this.pipes[i].northPipeImage,
        this.pipes[i].xPipe,
        this.pipes[i].yPipe
      );
      this.ctx.drawImage(
        this.pipes[i].southPipeImage,
        this.pipes[i].xPipe,
        this.pipes[i].yPipe + this.pipes[i].northPipeImage.height + PIPE_GAP
      );

      //move pipe
      this.pipes[i].xPipe--;

      //add new pipe
      if (this.pipes[i].xPipe == 125) {
        let newPipe = new Pipe();
        this.pipes.push(newPipe);
      }

      //add score
      if (this.pipes[i].xPipe == 5) {
        this.player.score++;
      }

      //check crash
      if (
        //crash the pipe
        (this.bird.xBird + this.bird.birdImage.width >= this.pipes[i].xPipe &&
          this.bird.xBird <=
          this.pipes[i].xPipe + this.pipes[i].northPipeImage.width &&
          (this.bird.yBird <=
            this.pipes[i].yPipe + this.pipes[i].northPipeImage.height ||
            this.bird.yBird + this.bird.birdImage.height >=
            this.pipes[i].yPipe +
            this.pipes[i].northPipeImage.height.PIPE_GAP)) ||
        //crash the ground
        this.bird.yBird + this.bird.birdImage.height >=
        GAMEBOARD_HEIGHT - foregroundImage.height
      ) {
        window.location.reload(true); // reload the page
      }
      //delete passed pipe
      if (this.pipes[i].xPipe < 0) {
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
  let bird = new Bird();
  let pipe = new Pipe(cvs);
  let player = new Player();
  let board = new Board(cvs, bird, pipe, player);
  let isLoaded = false;
  let model = null;
  document.addEventListener("keydown", bird.jump);
  // Load the model.
  handTrack.load(modelParams).then(lmodel => {
    // detect objects in the image.
    model = lmodel;
    handTrack.startVideo(video).then((status) => {
      console.log("video started", status);
      if (status) {
        runDetection()
      }
      
    });
  });
  board.start()

  function runDetection() {
    model.detect(video).then(predictions => {
      console.log("Predictions: ", predictions);
      model.renderPredictions(predictions, videoCanvas, videoContext, video);
      if (predictions.length > 0) {
        console.log("hand found")
        bird.yBird -= 25
        console.log(bird.yBird)
      }
      isLoaded = true
      requestAnimationFrame(runDetection);
    });
  }
}
// //fix bug later regarding score issue




