// logic.js
// Xử lý nghiệp vụ: các sự kiện liên quan đến nút, bàn phím, quản lý dữ liệu map,...

// Xử lý sự kiện bàn phím để chuyển đổi tile active
document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  if (key === "d" || key === "s" || key === "g") {
    let tileType = "";
    if (key === "d") tileType = "danger";
    else if (key === "s") tileType = "shield";
    else if (key === "g") tileType = "gold";

    if (activeTile === tileType) {
      tileWrappers.forEach(wrapper => wrapper.classList.remove('active'));
      activeTile = null;
    } else {
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

// Xử lý thay đổi kích thước map khi thay đổi giá trị radius
let prevRadius = radius;
const confirmCheckbox = document.getElementById('confirmCheckbox');
document.getElementById('radius').addEventListener('change', function () {
  let newRadius = parseInt(this.value);
  if (newRadius < prevRadius && confirmCheckbox.checked && Object.keys(selectedCells).length > 0) {
    let confirmed = confirm("Changing the map size will remove cells outside the new boundaries. Do you want to proceed?");
    if (!confirmed) {
      this.value = prevRadius;
      return;
    }
  }
  radius = newRadius;
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

// Xử lý thay đổi số bước tối đa
document.getElementById('move').addEventListener('change', function () {
  move = parseInt(this.value);
  if (move < 0) {
    this.value = 0;
    move = 0;
  }
});

// Xử lý các nút chuyển đổi tile (dựa vào phần tử HTML có class .tile-button-wrapper)
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

// Xử lý nút Clear để xóa các ô đã chọn
const clearBtn = document.getElementById('clearBtn');
clearBtn.addEventListener('click', function () {
  if (Object.keys(selectedCells).length > 0) {
    if (confirmCheckbox.checked) {
      let confirmed = confirm("Are you sure you want to clear the map?");
      if (!confirmed) return;
    }
    if (activeTile) {
      let newSelectedCells = {};
      for (let key in selectedCells) {
        if (selectedCells[key].type != activeTile) {
          newSelectedCells[key] = selectedCells[key];
        }
      }
      selectedCells = newSelectedCells;
    } else {
      selectedCells = {};
    }
    drawMap();
  }
});

// Xử lý nút Download để xuất map ra file JSON
const downloadBtn = document.getElementById('downloadBtn');
downloadBtn.addEventListener('click', function () {
  let mapData = {
    map_radius: radius,
    max_moves: move,
    cells: []
  };
  Object.keys(selectedCells).forEach(key => {
    let [q, r, s] = key.split(",").map(Number);
    let tile = selectedCells[key];
    let value;
    if (tile.type === "gold") {
      value = tile.count;
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

// Xử lý nút Random để tạo map ngẫu nhiên
const randomBtn = document.getElementById('randomBtn');
randomBtn.addEventListener('click', function () {
  if (confirmCheckbox.checked && Object.keys(selectedCells).length > 0) {
    let confirmed = confirm("The map will be cleared. Do you want to proceed?");
    if (!confirmed) return;
  }
  let prevSelectedCells = selectedCells;
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

  // Hàm tạo ô danger
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
    dangerCells.forEach(key => selectedCells[key] = {type: "danger"});

    function validateDanger(dangerCells) {
      return checkConnected(dangerCells);
    }

    function checkConnected(dangerCells) {
      const directions = [
        {q: 1, r: -1, s: 0},
        {q: 1, r: 0, s: -1},
        {q: 0, r: 1, s: -1},
        {q: -1, r: 1, s: 0},
        {q: -1, r: 0, s: 1},
        {q: 0, r: -1, s: 1}
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
      for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        let oke = false;
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
      for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
          const s = -q - r;
          const key = `${q},${r},${s}`;
          if (!dangerCells.has(key) && !visited.has(key)) {
            return false;
          }
        }
      }
      return true;
    }
  }

  // Hàm tạo ô shield
  function generateShield() {
    const shieldAvailableGroups = groupArray.filter(g => g.length === 3 && !selectedCells.hasOwnProperty(g[0]));
    if (shieldAvailableGroups.length > 0) {
      const shieldGroup = shieldAvailableGroups[Math.floor(Math.random() * shieldAvailableGroups.length)];
      shieldGroup.forEach(key => {
        selectedCells[key] = {type: "shield"};
      });
    }
  }

  // Hàm tạo ô gold sao cho tổng giá trị đạt 300
  function generateGold() {
    const goldProd = 0.2;
    let countGold = 0;
    while (countGold < 300) {
      const group = groupArray[Math.floor(Math.random() * groupArray.length)];
      if (countGold >= 300) {
        return;
      }
      if (selectedCells.hasOwnProperty(group[0]) && selectedCells[group[0]].type !== "gold") continue;
      let count = 0;
      if (selectedCells.hasOwnProperty(group[0])) {
        count += selectedCells[group[0]].count;
      }
      if (count >= 6) continue;
      let addedCount = Math.min(Math.round((300 - countGold) / 3), 6 - count, Math.round(Math.random() * 2) + 1);
      if (group.length === 1) {
        addedCount = Math.min(300 - countGold, 6 - count, 3);
      }
      group.forEach(key => selectedCells[key] = {type: "gold", count: count + addedCount});
      countGold += addedCount * group.length;
    }
  }

  drawMap();
});

// Xử lý nút Upload để load file JSON
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
      console.log(mapData.map_radius, mapData.max_moves)
      radius = mapData.map_radius;
      document.getElementById('radius').value = radius;
      move = mapData.max_moves || 100;
      document.getElementById('move').value = move;
      selectedCells = {};
      mapData.cells.forEach(({q, r, s, value}) => {
        let obj;
        if (value === "D") {
          obj = {type: "danger"};
        } else if (value === "S") {
          obj = {type: "shield"};
        } else if (typeof value === "number") {
          obj = {type: "gold", count: value};
        } else {
          return;
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

// Hàm cập nhật số lượng các loại tile và hiển thị lên giao diện
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
  clearBtn.disabled = Object.keys(selectedCells).length === 0;
}
