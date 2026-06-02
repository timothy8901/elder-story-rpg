import type { Input } from "../core/Input.js";
import type { Renderer } from "../core/Renderer.js";

export interface DialogueOption {
  label: string;
  /** Invoked on select; return the next node to show, or null to end the talk. */
  run: () => DialogueNode | null;
}

export interface DialogueNode {
  speaker: string;
  text: string;
  options: DialogueOption[];
}

/**
 * A simple keyboard-driven conversation modal. Shows a speaker, a wrapped line
 * of text, and numbered choices; choosing one runs its effect and either
 * advances to the next node or closes. Used for faction recruitment/turn-ins.
 */
export class Dialogue {
  open = false;
  private node: DialogueNode | null = null;
  private cursor = 0;

  start(node: DialogueNode): void {
    this.node = node;
    this.open = true;
    this.cursor = 0;
  }

  close(): void {
    this.open = false;
    this.node = null;
  }

  update(input: Input): void {
    const n = this.node;
    if (!this.open || !n) return;
    const count = n.options.length;
    if (input.anyPressed(["ArrowUp", "KeyW"])) this.cursor = (this.cursor + count - 1) % count;
    if (input.anyPressed(["ArrowDown", "KeyS"])) this.cursor = (this.cursor + 1) % count;
    for (let i = 0; i < count && i < 9; i++) {
      if (input.justPressed("Digit" + (i + 1))) {
        this.select(i);
        return;
      }
    }
    if (input.anyPressed(["Enter", "Space", "KeyE", "KeyJ"])) {
      this.select(this.cursor);
      return;
    }
    if (input.justPressed("Escape")) this.close();
  }

  private select(i: number): void {
    const n = this.node;
    const opt = n?.options[i];
    if (!opt) return;
    const next = opt.run();
    if (next) {
      this.node = next;
      this.cursor = 0;
    } else {
      this.close();
    }
  }

  render(r: Renderer): void {
    const n = this.node;
    if (!this.open || !n) return;
    const W = r.width;
    const H = r.height;
    const x = 40;
    const h = 188;
    const y = H - h - 16;
    const w = W - 80;

    r.fillRectScreen(0, 0, W, H, "rgba(0,0,0,0.35)");
    r.fillRectScreen(x, y, w, h, "rgba(16,20,30,0.97)");
    r.fillRectScreen(x, y, w, 2, "#ffd45e");

    r.text(n.speaker, x + 18, y + 28, "#ffd45e", "bold 15px monospace");
    const lines = wrap(n.text, 88);
    lines.forEach((ln, i) => r.text(ln, x + 18, y + 52 + i * 18, "#e8edf4", "13px monospace"));

    const oy = y + 56 + lines.length * 18 + 8;
    n.options.forEach((o, i) => {
      const sel = i === this.cursor;
      if (sel) r.fillRectScreen(x + 12, oy - 14 + i * 22, w - 24, 20, "rgba(255,212,94,0.16)");
      r.text(`${i + 1}. ${o.label}`, x + 24, oy + i * 22, sel ? "#ffd45e" : "#cfe3ff", "13px monospace");
    });

    r.text("[↑↓] choose   [Enter] select   [Esc] leave", W / 2, y + h - 12, "#7e879a", "11px monospace", "center");
  }
}

/** Greedy word-wrap to a max character count per line. */
function wrap(text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length + word.length + 1 > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
