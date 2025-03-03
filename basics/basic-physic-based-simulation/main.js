'use strict';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  dx: 3,
  dy: 2,
  gravity: 0.5,
  friction: 0.99,
  bounce: 0.7,
  isDragging: false,
  offsetX: 0,
  offsetY: 0,
};

const update = () => {
  ctx.clearRect(0,0, canvas.width, canvas.height);

  if(!ball.isDragging){
    // Apply gravity and velocity
    ball.dy += ball.gravity;
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Floor collision
    if(ball.y + ball.radius >= canvas.height) {
      ball.y = canvas.height - ball.radius;
      ball.dy *= -ball.bounce;
      ball.dx *= ball.friction;
    }

    // Ceiling collision
    if(ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.dy *= -ball.bounce;
    }

    // Walls collision
    if(ball.x + ball.radius >= canvas.width || ball.x - ball.radius <= 0) ball.dx *= -ball.bounce;
  }
  
  // Draw ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.closePath();

  requestAnimationFrame(update);
}

// Handle mouse events
canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const dist = Math.hypot(ball.x - clickX, ball.y - clickY);

  if (dist <= ball.radius){
    // Clicked on the ball -> Start dragging
    ball.isDragging = true;
    ball.offsetX = clickX - ball.x;
    ball.offsetY = clickY - ball.y;
    ball.dx = 0;
    ball.dy = 0;
  } else {
    // Clicked outside the ball -> Teleport ball to clicked position
    ball.x = clickX;
    ball.y = clickY;
    ball.dx = 0;
    ball.dx = 0;
  }
});

canvas.addEventListener("mousemove", (event) => {
  if(ball.isDragging){
    const rect = canvas.getBoundingClientRect();
    ball.x = event.clientX - rect.left - ball.offsetX;
    ball.y = event.clientY - rect.top - ball.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  if(ball.isDragging) {
    ball.isDragging = false;

    // Give it a little movement after release
    ball.dx = (Math.random() - 0.5) * 10;
    ball.dy = -Math.random() * 10;
  }
});

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const dist = Math.hypot(ball.x - clickX, ball.y - clickY);

  if(dist <= ball.radius) {
    // Clicked on the ball -> Give it a speed boost
    ball.dx += (Math.random() - 0.5) * 10;
    ball.dy -= Math.random() * 10;
  }
});

update();
