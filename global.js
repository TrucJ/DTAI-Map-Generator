// global.js
// Các biến và cấu hình toàn cục dùng cho toàn bộ project

// Các biến cấu hình ban đầu
let mapName = parseInt(document.getElementById('map-name').value);
let radius = parseInt(document.getElementById('radius').value);
let move = parseInt(document.getElementById('move').value);
const hexSize = 24;
let scale = 1;
let selectedCells = {};
let activeTile = null;
let offsetX = 0, offsetY = 0;
let isDragging = false, startDragX = 0, startDragY = 0;
let hasMoved = false;
let touchStartDistance = null;

// Các cấu hình về màu sắc và nhãn của các tile
const tileColors = {
  danger: "red",
  shield: "skyblue",
  gold1: "#FFFF66",
  gold2: "#FFFF44",
  gold3: "#FFFF22",
  gold4: "#FFFF00",
  gold5: "#FFEE00",
  gold6: "#FFDD00",
};
const tileLabels = {
  danger: "D",
  shield: "S"
};

// Các biến để lưu các đối tượng DOM dùng chung (nếu cần)
const canvas = document.getElementById("hexMap");
