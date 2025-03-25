// canvas.js
// Xử lý các hàm liên quan đến canvas: vẽ map, chuyển đổi tọa độ, xử lý sự kiện vẽ, kéo, zoom...

const ctx = canvas.getContext("2d");
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;

// Hàm lấy tọa độ các đỉnh của hexagon
function getHexCornerCoords(cx, cy) {
  const corners = [];
  const size = hexSize * scale;
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    corners.push({
      x: cx + size * Math.cos(angle_rad),
      y: cy + size * Math.sin(angle_rad)
    });
  }
  return corners;
}

// Hàm vẽ một hexagon
function drawHex(cx, cy, label, fillColor) {
  const corners = getHexCornerCoords(cx, cy);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.stroke();
  if (label) {
    ctx.font = "16px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy);
  }
}

// Các hàm chuyển đổi giữa hệ tọa độ cube, axial, pixel
function getCyclicKeys(cube) {
  let keys = [];
  keys.push(`${cube.q},${cube.r},${cube.s}`);
  keys.push(`${cube.r},${cube.s},${cube.q}`);
  keys.push(`${cube.s},${cube.q},${cube.r}`);
  return [...new Set(keys)];
}

function cubeToAxial(cube) {
  return { q: cube.q, r: cube.r };
}

function axialToPixel(axial) {
  const size = hexSize * scale;
  const x = size * Math.sqrt(3) * (axial.q + axial.r / 2);
  const y = size * 3 / 2 * axial.r;
  return { x, y };
}

function cubeToPixel(cube) {
  return axialToPixel(cubeToAxial(cube));
}

function pixelToAxial(px, py) {
  const x = px - centerX - offsetX;
  const y = py - centerY - offsetY;
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / (hexSize * scale);
  const r = (2 / 3 * y) / (hexSize * scale);
  return { q, r };
}

function axialToCube(axial) {
  return { q: axial.q, r: axial.r, s: -axial.q - axial.r };
}

function cubeRound(cube) {
  let rq = Math.round(cube.q);
  let rr = Math.round(cube.r);
  let rs = Math.round(cube.s);
  const q_diff = Math.abs(rq - cube.q);
  const r_diff = Math.abs(rr - cube.r);
  const s_diff = Math.abs(rs - cube.s);
  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs;
  } else if (r_diff > s_diff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }
  return { q: rq, r: rr, s: rs };
}

function pixelToCube(px, py) {
  const axial = pixelToAxial(px, py);
  const cube = axialToCube(axial);
  return cubeRound(cube);
}

// Hàm vẽ toàn bộ map dựa vào biến toàn cục: radius, selectedCells, tileColors, tileLabels, offsetX, offsetY, activeTile
function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      const cube = { q, r, s };
      const pixel = cubeToPixel(cube);
      const px = pixel.x + centerX + offsetX;
      const py = pixel.y + centerY + offsetY;
      const key = `${q},${r},${s}`;
      let tileObj = selectedCells[key];
      let fillColor;
      let label = "";
      if (tileObj) {
        if (tileObj.type === "gold") {
          label = tileObj.count.toString();
        } else {
          label = tileLabels[tileObj.type];
        }
        fillColor = tileColors[tileObj.type];
      } else {
        if (q > 0 && r < 0) {
          fillColor = "mistyrose";
        } else if (r > 0 && s < 0) {
          fillColor = "honeydew";
        } else if (s > 0 && q < 0) {
          fillColor = "aliceblue";
        } else {
          fillColor = "white";
        }
      }
      drawHex(px, py, label, fillColor);
    }
  }
  updateCounts();
}

// Cập nhật kích thước canvas theo kích thước của container
function updateCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const leftPanel = document.querySelector('.left-panel');
  const width = leftPanel.clientWidth;
  const height = leftPanel.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  centerX = width / 2;
  centerY = height / 2;
  drawMap();
}

// Xử lý các sự kiện liên quan đến canvas: kéo, zoom, touch...
canvas.addEventListener("mousedown", function (event) {
  isDragging = true;
  hasMoved = false;
  startDragX = event.clientX;
  startDragY = event.clientY;
  canvas.style.cursor = "grabbing";
});
canvas.addEventListener("mousemove", function (event) {
  if (isDragging) {
    const dx = event.clientX - startDragX;
    const dy = event.clientY - startDragY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      hasMoved = true;
    }
    offsetX += dx;
    offsetY += dy;
    startDragX = event.clientX;
    startDragY = event.clientY;
    drawMap();
  }
});
canvas.addEventListener("mouseup", function () {
  isDragging = false;
  canvas.style.cursor = "grab";
});
canvas.addEventListener("mouseleave", function () {
  isDragging = false;
  canvas.style.cursor = "grab";
});
canvas.addEventListener("wheel", function (event) {
  event.preventDefault();
  if (event.deltaY < 0) {
    scale *= 1.05;
  } else {
    scale /= 1.05;
  }
  drawMap();
});
canvas.addEventListener("touchstart", function (event) {
  if (event.touches.length === 2) {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    touchStartDistance = Math.sqrt(dx * dx + dy * dy);
  }
});
canvas.addEventListener("touchmove", function (event) {
  if (event.touches.length === 2 && touchStartDistance !== null) {
    event.preventDefault();
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const newDistance = Math.sqrt(dx * dx + dy * dy);
    const scaleFactor = newDistance / touchStartDistance;
    scale *= scaleFactor;
    touchStartDistance = newDistance;
    drawMap();
  }
});
canvas.addEventListener("touchend", function (event) {
  if (event.touches.length < 2) {
    touchStartDistance = null;
  }
});

// Sự kiện load và resize trang
window.addEventListener('load', updateCanvasSize);
window.addEventListener('resize', updateCanvasSize);

// Xử lý sự kiện click trên canvas (sử dụng các biến global như activeTile, selectedCells)
canvas.addEventListener("click", function (event) {
  if (hasMoved) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const cube = pixelToCube(clickX, clickY);
  if (Math.max(Math.abs(cube.q), Math.abs(cube.r), Math.abs(cube.s)) <= radius) {
    const keys = getCyclicKeys(cube);
    if (!activeTile) return;
    if (activeTile === "danger" || activeTile === "shield") {
      if (selectedCells[keys[0]] && selectedCells[keys[0]].type === activeTile) {
        keys.forEach(key => delete selectedCells[key]);
      } else {
        const obj = { type: activeTile };
        keys.forEach(key => selectedCells[key] = obj);
      }
    } else if (activeTile === "gold") {
      if (!selectedCells[keys[0]] || selectedCells[keys[0]].type !== "gold") {
        const obj = { type: "gold", count: 1 };
        keys.forEach(key => selectedCells[key] = obj);
      } else {
        let newCount = selectedCells[keys[0]].count + 1;
        if (newCount > 6) {
          keys.forEach(key => delete selectedCells[key]);
        } else {
          selectedCells[keys[0]].count = newCount;
          keys.forEach(key => selectedCells[key] = selectedCells[keys[0]]);
        }
      }
    }
    drawMap();
  }
});

// Cho phép truy cập các hàm từ các file khác nếu cần
window.drawMap = drawMap;
window.updateCanvasSize = updateCanvasSize;
