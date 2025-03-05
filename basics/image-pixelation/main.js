"use strict";
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const selectionRect = document.getElementById('selectionRect');
let originalImage = new Image();
let isSelecting = false;
let selectionMode = false;
let startX, startY, endX, endY;

// Retro 8-bit palette (example colors)
const retroPalette = [
    [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 0],
    [0, 0, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255]
];

// Image upload
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage.src = event.target.result;
            originalImage.onload = function() {
                canvas.width = originalImage.width;
                canvas.height = originalImage.height;
                ctx.drawImage(originalImage, 0, 0);
            }
        }
        reader.readAsDataURL(file);
    }
});

// Toggle selection mode
function toggleSelectionMode() {
    selectionMode = !selectionMode;
    canvas.style.cursor = selectionMode ? 'crosshair' : 'default';
    if (!selectionMode) selectionRect.style.display = 'none';
}

// Selection events
canvas.addEventListener('mousedown', (e) => {
    if (!selectionMode) return;
    isSelecting = true;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isSelecting || !selectionMode) return;
    const rect = canvas.getBoundingClientRect();
    endX = e.clientX - rect.left;
    endY = e.clientY - rect.top;
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    selectionRect.style.left = (rect.left + left) + 'px';
    selectionRect.style.top = (rect.top + top) + 'px';
    selectionRect.style.width = width + 'px';
    selectionRect.style.height = height + 'px';
    selectionRect.style.display = 'block';
});

canvas.addEventListener('mouseup', () => {
    isSelecting = false;
});

// Apply color palette restriction
function restrictColor(r, g, b, palette) {
    if (palette === 'grayscale') {
        const gray = Math.floor((r + g + b) / 3);
        return [gray, gray, gray];
    } else if (palette === 'sepia') {
        const tr = Math.floor(0.393 * r + 0.769 * g + 0.189 * b);
        const tg = Math.floor(0.349 * r + 0.686 * g + 0.168 * b);
        const tb = Math.floor(0.272 * r + 0.534 * g + 0.131 * b);
        return [Math.min(tr, 255), Math.min(tg, 255), Math.min(tb, 255)];
    } else if (palette === 'retro') {
        let closestColor = retroPalette[0];
        let minDist = Infinity;
        for (const color of retroPalette) {
            const dist = Math.sqrt((r - color[0])**2 + (g - color[1])**2 + (b - color[2])**2);
            if (dist < minDist) {
                minDist = dist;
                closestColor = color;
            }
        }
        return closestColor;
    }
    return [r, g, b];
}

// Core pixelation function
function pixelateImage(x = 0, y = 0, width = canvas.width, height = canvas.height) {
    const pixelSize = parseInt(document.getElementById('pixelSize').value);
    const shape = document.getElementById('pixelShape').value;
    const palette = document.getElementById('colorPalette').value;
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py += pixelSize) {
        for (let px = 0; px < width; px += pixelSize) {
            let red = 0, green = 0, blue = 0, alpha = 0, pixelCount = 0;

            // Calculate average color
            for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                    if (shape === 'circle') {
                        const relX = dx - pixelSize / 2;
                        const relY = dy - pixelSize / 2;
                        if (relX * relX + relY * relY > (pixelSize / 2) ** 2) continue;
                    }
                    const index = ((py + dy) * width + (px + dx)) * 4;
                    red += data[index];
                    green += data[index + 1];
                    blue += data[index + 2];
                    alpha += data[index + 3];
                    pixelCount++;
                }
            }

            if (pixelCount === 0) continue;
            red = Math.floor(red / pixelCount);
            green = Math.floor(green / pixelCount);
            blue = Math.floor(blue / pixelCount);
            alpha = Math.floor(alpha / pixelCount);

            // Apply color palette
            [red, green, blue] = restrictColor(red, green, blue, palette);

            // Draw shape
            if (shape === 'square') {
                for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                    for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                        const index = ((py + dy) * width + (px + dx)) * 4;
                        data[index] = red;
                        data[index + 1] = green;
                        data[index + 2] = blue;
                        data[index + 3] = alpha;
                    }
                }
            } else if (shape === 'circle') {
                for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
                    for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
                        const relX = dx - pixelSize / 2;
                        const relY = dy - pixelSize / 2;
                        if (relX * relX + relY * relY <= (pixelSize / 2) ** 2) {
                            const index = ((py + dy) * width + (px + dx)) * 4;
                            data[index] = red;
                            data[index + 1] = green;
                            data[index + 2] = blue;
                            data[index + 3] = alpha;
                        }
                    }
                }
            }
        }
    }
    ctx.putImageData(imageData, x, y);
}

// Pixelate selected area
function pixelateSelectedArea() {
    if (!startX || !endX) return;
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    pixelateImage(Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height));
    selectionRect.style.display = 'none';
    selectionMode = false;
    canvas.style.cursor = 'default';
}

// Animation
function animatePixelation() {
    resetImage();
    let step = 0;
    const maxSteps = 20;
    const initialSize = 2;
    const targetSize = parseInt(document.getElementById('pixelSize').value);

    function animate() {
        if (step > maxSteps) return;
        const size = Math.floor(initialSize + (targetSize - initialSize) * (step / maxSteps));
        document.getElementById('pixelSize').value = size;
        pixelateImage();
        step++;
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// Reset
function resetImage() {
    if (originalImage.src) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0);
        selectionRect.style.display = 'none';
        selectionMode = false;
        canvas.style.cursor = 'default';
    }
}
