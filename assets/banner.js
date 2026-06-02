/**
 * Renders the "NOT TIM GAMES" studio banner onto #banner — a pixel-art red/black
 * gamepad on a cream field with blocky pixel text. Self-contained (no image
 * asset); drawn once on load. Recreation of the provided logo.
 */
(function () {
  const cv = document.getElementById("banner");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const W = cv.width; // 480
  const H = cv.height; // 250

  const BLACK = "#1c1c1c";
  const BLACK2 = "#343434";
  const RED = "#d8362f";
  const RED2 = "#b3231d";
  const REDHI = "#e7635c";
  const INK = "#141414";

  function rr(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const fillRR = (x, y, w, h, r, c) => { ctx.fillStyle = c; rr(x, y, w, h, r); ctx.fill(); };
  const circle = (x, y, rad, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill(); };

  // ---- Background: cream gradient + faint pixel grid + corner checkers ----
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#f7f3ea");
  g.addColorStop(1, "#e6dfcd");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(120,110,80,0.05)";
  for (let y = 0; y < H; y += 8) for (let x = (y % 16); x < W; x += 16) ctx.fillRect(x, y, 4, 4);

  ctx.fillStyle = "rgba(120,110,80,0.16)";
  const checker = (ox, oy, cols, rows) => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ((r + c) % 2 === 0) ctx.fillRect(ox + c * 6, oy + r * 6, 6, 6);
  };
  checker(6, H - 54, 6, 8);
  checker(W - 42, H - 54, 6, 8);

  // ---- Controller ----
  const cx = 240;
  ctx.save();
  ctx.lineJoin = "round";

  // Grips + bumpers + body (black).
  fillRR(cx - 102, 86, 58, 60, 24, BLACK);
  fillRR(cx + 44, 86, 58, 60, 24, BLACK);
  fillRR(cx - 80, 36, 42, 18, 7, BLACK2);
  fillRR(cx + 38, 36, 42, 18, 7, BLACK2);
  fillRR(cx - 96, 48, 192, 74, 26, BLACK);
  // top sheen
  fillRR(cx - 90, 50, 180, 12, 8, BLACK2);
  // outline
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  rr(cx - 96, 48, 192, 74, 26);
  ctx.stroke();

  // D-pad (black plus with red rim), upper-left.
  const dx = cx - 56, dy = 82;
  fillRR(dx - 9, dy - 22, 18, 44, 4, RED);
  fillRR(dx - 22, dy - 9, 44, 18, 4, RED);
  fillRR(dx - 5, dy - 18, 10, 36, 2, BLACK);
  fillRR(dx - 18, dy - 5, 36, 10, 2, BLACK);

  // Center: red bar + dark screen with red ticks.
  fillRR(cx - 26, 56, 52, 12, 5, RED2);
  fillRR(cx - 24, 56, 52, 5, 5, REDHI);
  fillRR(cx - 24, 70, 48, 18, 3, BLACK2);
  ctx.fillStyle = RED;
  ctx.fillRect(cx - 16, 78, 10, 3);
  ctx.fillRect(cx + 6, 78, 10, 3);

  // Face buttons (red diamond), upper-right.
  const fx = cx + 56, fy = 80;
  const btn = (bx, by) => { fillRR(bx - 9, by - 9, 18, 18, 5, RED); fillRR(bx - 7, by - 7, 14, 6, 3, REDHI); };
  btn(fx, fy - 17);
  btn(fx, fy + 17);
  btn(fx - 17, fy);
  btn(fx + 17, fy);

  // Analog sticks (red ring + black stick).
  const stick = (sx) => { circle(sx, 110, 16, RED2); circle(sx, 110, 13, RED); circle(sx, 110, 10, BLACK); ctx.fillStyle = BLACK2; ctx.beginPath(); ctx.arc(sx - 2, 107, 3, 0, Math.PI * 2); ctx.fill(); };
  stick(cx - 22);
  stick(cx + 22);
  ctx.restore();

  // ---- Pixel-font text: NOT TIM (black) / GAMES (red) ----
  const FONT = {
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  };
  const textWidth = (str, px) => str.length * 6 * px - px;
  const drawText = (str, centerX, top, px, color) => {
    let x = Math.round(centerX - textWidth(str, px) / 2);
    ctx.fillStyle = color;
    for (const ch of str) {
      const rows = FONT[ch] || FONT[" "];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (rows[r][c] === "1") ctx.fillRect(x + c * px, top + r * px, px, px);
      x += 6 * px;
    }
  };
  drawText("NOT TIM", cx, 150, 5, INK);
  drawText("GAMES", cx, 200, 6, RED);
})();
