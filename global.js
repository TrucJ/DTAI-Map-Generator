// global.js
// Các biến và cấu hình toàn cục dùng cho toàn bộ project

// Các biến cấu hình ban đầu
let radius = parseInt(document.getElementById('radius').value);
const hexSize = 30;
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
  gold: "yellow"
};
const tileLabels = {
  danger: "D",
  shield: "S"
};

// Các biến để lưu các đối tượng DOM dùng chung (nếu cần)
const canvas = document.getElementById("hexMap");
