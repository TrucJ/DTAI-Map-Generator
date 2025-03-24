// --- Phần Hexmap ---
let radius = parseInt(document.getElementById('radius').value);
const hexSize = 30;
let scale = 1;

const canvas = document.getElementById("hexMap");
const ctx = canvas.getContext("2d");
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;

const tileColors = {
  danger: "red",
  shield: "skyblue",
  gold: "yellow"
};
const tileLabels = {
  danger: "D",
  shield: "S"
};

let selectedCells = {};
let activeTile = null;
let offsetX = 0, offsetY = 0;
let isDragging = false, startDragX = 0, startDragY = 0;
let hasMoved = false;
let touchStartDistance = null;

function getCyclicKeys(cube) {
  let keys = [];
  keys.push(`${cube.q},${cube.r},${cube.s}`);
  keys.push(`${cube.r},${cube.s},${cube.q}`);
  keys.push(`${cube.s},${cube.q},${cube.r}`);
  return [...new Set(keys)];
}

function cubeToAxial(cube) {
  return {q: cube.q, r: cube.r};
}

function axialToPixel(axial) {
  const size = hexSize * scale;
  const x = size * Math.sqrt(3) * (axial.q + axial.r / 2);
  const y = size * 3 / 2 * axial.r;
  return {x, y};
}

function cubeToPixel(cube) {
  return axialToPixel(cubeToAxial(cube));
}

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

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      const cube = {q, r, s};
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

function pixelToAxial(px, py) {
  const x = px - centerX - offsetX;
  const y = py - centerY - offsetY;
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / (hexSize * scale);
  const r = (2 / 3 * y) / (hexSize * scale);
  return {q, r};
}

function axialToCube(axial) {
  return {q: axial.q, r: axial.r, s: -axial.q - axial.r};
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
  return {q: rq, r: rr, s: rs};
}

function pixelToCube(px, py) {
  const axial = pixelToAxial(px, py);
  const cube = axialToCube(axial);
  return cubeRound(cube);
}

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

function updateCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const leftPanel = document.querySelector('.left-panel');
  const width = leftPanel.clientWidth;
  const height = leftPanel.clientHeight;
  // Cập nhật kích thước canvas theo devicePixelRatio
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  // Reset transform trước khi scale
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  // Cập nhật tâm của map dựa trên kích thước mới
  centerX = width / 2;
  centerY = height / 2;

  drawMap();
}

window.addEventListener('load', updateCanvasSize);
window.addEventListener('resize', updateCanvasSize);

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
        const obj = {type: activeTile};
        keys.forEach(key => selectedCells[key] = obj);
      }
    } else if (activeTile === "gold") {
      if (!selectedCells[keys[0]] || selectedCells[keys[0]].type !== "gold") {
        const obj = {type: "gold", count: 1};
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

document.addEventListener("keydown", function (event) {
  // Lấy phím được nhấn dưới dạng chữ thường
  const key = event.key.toLowerCase();
  if (key === "d" || key === "s" || key === "g") {
    // Chuyển đổi phím sang tile type
    let tileType = "";
    if (key === "d") tileType = "danger";
    else if (key === "s") tileType = "shield";
    else if (key === "g") tileType = "gold";

    // Nếu tile đang active đã trùng với tileType, thì unactive (tắt active)
    if (activeTile === tileType) {
      tileWrappers.forEach(wrapper => wrapper.classList.remove('active'));
      activeTile = null;
    } else {
      // Ngược lại, tắt active của các nút khác và active nút tương ứng
      tileWrappers.forEach(wrapper => {
        wrapper.classList.remove('active');
        if (wrapper.getAttribute("data-tile") === tileType) {
          wrapper.classList.add('active');
        }
      });
      activeTile = tileType;
    }
  }
});

let prevRadius = radius;
const confirmCheckbox = document.getElementById('confirmCheckbox');
document.getElementById('radius').addEventListener('change', function () {
  let newRadius = parseInt(this.value);

  // Nếu map size mới nhỏ hơn map size cũ và checkbox "Ask before clear" được chọn
  if (newRadius < prevRadius && confirmCheckbox.checked && Object.keys(selectedCells).length > 0) {
    let confirmed = confirm("Changing the map size will remove cells outside the new boundaries. Do you want to proceed?");
    if (!confirmed) {
      this.value = prevRadius;
      return;
    }
  }
  // Cập nhật map size
  radius = newRadius;

  // Lọc lại các ô đã có, chỉ giữ lại những ô nằm trong vùng mới
  let newSelectedCells = {};
  for (let key in selectedCells) {
    let parts = key.split(",");
    let q = Math.abs(parseInt(parts[0]));
    let r = Math.abs(parseInt(parts[1]));
    let s = Math.abs(parseInt(parts[2]));
    if (Math.max(q, r, s) <= radius) {
      newSelectedCells[key] = selectedCells[key];
    }
  }
  selectedCells = newSelectedCells;
  prevRadius = radius;
  drawMap();
});

const tileWrappers = document.querySelectorAll('.tile-button-wrapper');
tileWrappers.forEach(wrapper => {
  wrapper.addEventListener('click', function () {
    if (this.classList.contains('active')) {
      this.classList.remove('active');
      activeTile = null;
    } else {
      tileWrappers.forEach(w => w.classList.remove('active'));
      this.classList.add('active');
      activeTile = this.getAttribute('data-tile');
    }
  });
});

const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', function () {
  if (Object.keys(selectedCells).length > 0) {
    if (confirmCheckbox.checked) {
      let confirmed = confirm("Are you sure you want to clear the map?");
      if (!confirmed) return;
    }
    let newSelectedCells = {};
    for (let key in selectedCells) {
      if (selectedCells[key].type !== activeTile) {
        newSelectedCells[key] = selectedCells[key];
      }
    }
    selectedCells = newSelectedCells;
    drawMap();
  }
});

const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', function () {
  let mapData = {
    map_radius: radius,
    max_moves: 100,
    cells: []
  };

  Object.keys(selectedCells).forEach(key => {
    let [q, r, s] = key.split(",").map(Number);
    let tile = selectedCells[key];
    let value;

    if (tile.type === "gold") {
      value = tile.count; // Gold tiles store a count
    } else if (tile.type === "danger") {
      value = "D";
    } else if (tile.type === "shield") {
      value = "S";
    }

    mapData.cells.push({q, r, s, value});
  });

  let fileContent = JSON.stringify(mapData, null, 2);
  let blob = new Blob([fileContent], {type: "application/json"});
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "map.json";
  a.click();
});

const randomBtn = document.getElementById('randomBtn');
randomBtn.addEventListener('click', function () {
  if (confirmCheckbox.checked && Object.keys(selectedCells).length > 0) {
    let confirmed = confirm("The map will be cleared. Do you want to proceed?");
    if (!confirmed) return;
  }
  prevSelectedCells = selectedCells;
  selectedCells = {};
  let groups = {};
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const s = -q - r;
      const cube = {q, r, s};
      const keys = getCyclicKeys(cube);
      let canonical = keys.slice().sort().join("|");
      if (!(canonical in groups)) {
        groups[canonical] = keys;
      }
    }
  }
  const groupArray = Object.values(groups);

  // Hold previous shield and danger tiles if gold is active
  if (activeTile === "danger") {
    generateDanger();
  } else if (activeTile === "shield") {
    for (let key in prevSelectedCells) {
      const obj = prevSelectedCells[key];
      if (obj.type === "danger") {
        selectedCells[key] = obj;
      }
    }
    generateShield();
  } else if (activeTile === "gold") {
    for (let key in prevSelectedCells) {
      const obj = prevSelectedCells[key];
      if (obj.type === "danger") {
        selectedCells[key] = obj;
      }
    }
    for (let key in prevSelectedCells) {
      const obj = prevSelectedCells[key];
      if (obj.type === "shield") {
        selectedCells[key] = obj;
      }
    }
    generateGold();
  } else {
    generateDanger();
    generateShield();
    generateGold();
  }

  // Generate danger tiles
  function generateDanger() {
    const dangerCells = new Set();
    for (let i = 0; i < 10; i++) {
      const dangerProb = Math.floor(Math.random() * 0.6) + 0.2;
      groupArray.forEach(group => {
        if (Math.random() < dangerProb) {
          group.forEach(key => dangerCells.add(key));
        }
      });
      if (validateDanger(dangerCells)) {
        break;
      }
      dangerCells.clear();
    }
    console.log(dangerCells);
    dangerCells.forEach(key => selectedCells[key] = {type: "danger"});

    // Check if the danger tiles are valid
    function validateDanger(dangerCells) {
      return checkConnected(dangerCells);
    }

    // Using BFS to check if there are any two non-danger tiles that are not connected
    function checkConnected(dangerCells) {
      const directions = [
        {q: 1, r: -1, s: 0}, {q: 1, r: 0, s: -1}, {q: 0, r: 1, s: -1},
        {q: -1, r: 1, s: 0}, {q: -1, r: 0, s: 1}, {q: 0, r: -1, s: 1}
      ];

      function getNeighbors(cube) {
        return directions.map(dir => {
          const neighbor = {q: cube.q + dir.q, r: cube.r + dir.r, s: cube.s + dir.s};
          if (Math.max(Math.abs(neighbor.q), Math.abs(neighbor.r), Math.abs(neighbor.s)) <= radius) {
            return `${neighbor.q},${neighbor.r},${neighbor.s}`;
          }
          return null;
        }).filter(key => key !== null);
      }

      const visited = new Set();
      const queue = [];

      // Find the first non-danger tile to start BFS
      for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        oke = false;
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          const key = `${q},${r},${s}`;
          if (!dangerCells.has(key)) {
            queue.push(key);
            visited.add(key);
            oke = true;
            break;
          }
        }
        if (oke) break;
      }

      while (queue.length > 0) {
        const currentKey = queue.shift();
        const [q, r, s] = currentKey.split(",").map(Number);
        const currentCube = {q, r, s};
        const neighbors = getNeighbors(currentCube);
        for (let neighbor of neighbors) {
          if (!visited.has(neighbor) && !dangerCells.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      // Check if all non-danger tiles are visited
      for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          const key = `${q},${r},${s}`;
          if (!dangerCells.has(key) && !visited.has(key)) {
            return false; // Found a non-danger tile that is not connected
          }
        }
      }

      return true; // All non-danger tiles are connected
    }
  }

  // Generate shield tiles
  function generateShield() {
    const shieldAvailableGroups = groupArray.filter(g => g.length === 3 && !selectedCells.hasOwnProperty(g[0]));
    if (shieldAvailableGroups.length > 0) {
      const shieldGroup = shieldAvailableGroups[Math.floor(Math.random() * shieldAvailableGroups.length)];
      shieldGroup.forEach(key => {
        selectedCells[key] = {type: "shield"};
      });
    }
  }

  // Generate gold tiles to sum up to 300
  function generateGold() {
    const goldProd = 0.2;
    countGold = 0;
    while (countGold < 300) {
      groupArray.forEach(group => {
        if (countGold >= 300 || group.length === 1) {
          return;
        }
        if (selectedCells.hasOwnProperty(group[0]) && selectedCells[group[0]].type !== "gold") return;
        if (Math.random() < goldProd) {
          let count = 0;
          if (selectedCells.hasOwnProperty(group[0])) {
            count += selectedCells[group[0]].count;
          }
          if (count >= 6) return;
          let addedCount = Math.min(Math.floor((300 - countGold) / group.length), Math.floor(Math.random() * (6 - count)) + 1);
          obj = {type: "gold", count: count + addedCount};
          group.forEach(key => selectedCells[key] = obj);
          countGold += addedCount * group.length;
        }
      });
    }
  }

  drawMap();
});

const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadInput');
uploadBtn.addEventListener('click', function () {
  uploadInput.click();
});

uploadInput.addEventListener('change', function () {
  if (this.files.length === 0) return;
  const file = this.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const mapData = JSON.parse(e.target.result);

      if (!mapData.map_radius || !mapData.cells) {
        alert("Invalid file format.");
        return;
      }

      // Update map size
      radius = mapData.map_radius;
      document.getElementById('radius').value = radius;

      // Clear previous selection
      selectedCells = {};

      // Load cells from file
      mapData.cells.forEach(({q, r, s, value}) => {
        let obj;
        if (value === "D") {
          obj = {type: "danger"};
        } else if (value === "S") {
          obj = {type: "shield"};
        } else if (typeof value === "number") {
          obj = {type: "gold", count: value};
        } else {
          return; // Ignore invalid values
        }
        selectedCells[`${q},${r},${s}`] = obj;
      });

      drawMap();
    } catch (error) {
      alert("Error parsing file: " + error.message);
    }
  };

  reader.readAsText(file);
});

function updateCounts() {
  let countDanger = 0, countShield = 0, countGold = 0;
  for (let key in selectedCells) {
    const obj = selectedCells[key];
    if (obj.type === "danger") {
      countDanger++;
    } else if (obj.type === "shield") {
      countShield++;
    } else if (obj.type === "gold") {
      countGold += obj.count;
    }
  }
  document.getElementById("count-danger").textContent = "x " + countDanger;
  document.getElementById("count-shield").textContent = "x " + countShield;
  document.getElementById("count-gold").textContent = "x " + countGold;

  if (Object.keys(selectedCells).length === 0) {
    clearBtn.disabled = true;
  } else {
    clearBtn.disabled = false;
  }
}

drawMap();
