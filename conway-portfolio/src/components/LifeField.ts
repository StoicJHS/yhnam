type PointerState = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  previousTime: number;
  distanceSinceGlider: number;
  down: boolean;
  erase: boolean;
};

const GLIDER: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 1],
  [2, 2],
];

export class LifeField {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );
  private cells = new Uint8Array();
  private next = new Uint8Array();
  private glow = new Float32Array();
  private columns = 0;
  private rows = 0;
  private cellSize = 8;
  private width = 0;
  private height = 0;
  private pixelRatio = 1;
  private raf = 0;
  private previousFrame = 0;
  private tickAccumulator = 0;
  private quietTicks = 0;
  private disposed = false;
  private pointer: PointerState = {
    x: 0,
    y: 0,
    previousX: 0,
    previousY: 0,
    previousTime: 0,
    distanceSinceGlider: 0,
    down: false,
    erase: false,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false })!;
    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('pointermove', this.handlePointerMove, {
      passive: true,
    });
    window.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('contextmenu', this.preventContextMenu);
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.reducedMotion.addEventListener('change', this.resetTiming);
    this.resize();
  }

  start(): void {
    if (this.raf || this.disposed) return;
    this.previousFrame = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.reducedMotion.removeEventListener('change', this.resetTiming);
  }

  private index(column: number, row: number): number {
    const wrappedColumn = (column + this.columns) % this.columns;
    const wrappedRow = (row + this.rows) % this.rows;
    return wrappedRow * this.columns + wrappedColumn;
  }

  private resize = (): void => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.cellSize =
      this.width < 600 ? 6 : this.width < 1100 ? 7 : 8;
    this.columns = Math.max(24, Math.ceil(this.width / this.cellSize));
    this.rows = Math.max(24, Math.ceil(this.height / this.cellSize));
    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
    this.context.setTransform(
      this.pixelRatio,
      0,
      0,
      this.pixelRatio,
      0,
      0,
    );
    this.cells = new Uint8Array(this.columns * this.rows);
    this.next = new Uint8Array(this.cells.length);
    this.glow = new Float32Array(this.cells.length);
    this.seedInitialField();
    this.render(0);
  };

  private seedInitialField(): void {
    const clusterCount = Math.max(
      5,
      Math.floor((this.columns * this.rows) / 3300),
    );
    for (let cluster = 0; cluster < clusterCount; cluster += 1) {
      const column = Math.floor(Math.random() * this.columns);
      const row = Math.floor(Math.random() * this.rows);
      this.paintCluster(column, row, 4 + Math.floor(Math.random() * 4), 0.34);
    }
    for (let glider = 0; glider < 12; glider += 1) {
      this.seedGlider(
        Math.floor(Math.random() * this.columns),
        Math.floor(Math.random() * this.rows),
        Math.random() * Math.PI * 2,
      );
    }
  }

  private paintCluster(
    centerColumn: number,
    centerRow: number,
    radius: number,
    density: number,
  ): void {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        if (
          x * x + y * y <= radius * radius &&
          Math.random() < density
        ) {
          const target = this.index(centerColumn + x, centerRow + y);
          this.cells[target] = 1;
          this.glow[target] = 1;
        }
      }
    }
  }

  private seedGlider(
    centerColumn: number,
    centerRow: number,
    angle: number,
  ): void {
    const turns =
      ((Math.round(angle / (Math.PI * 0.5)) % 4) + 4) % 4;
    const mirror = Math.cos(angle) < 0;

    for (const [baseX, baseY] of GLIDER) {
      let x = mirror ? 2 - baseX : baseX;
      let y = baseY;
      for (let turn = 0; turn < turns; turn += 1) {
        [x, y] = [2 - y, x];
      }
      const target = this.index(centerColumn + x - 1, centerRow + y - 1);
      this.cells[target] = 1;
      this.glow[target] = 1;
    }
  }

  private paintPointerTrail(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    strength: number,
    erase: boolean,
  ): void {
    const distance = Math.hypot(toX - fromX, toY - fromY);
    const samples = Math.max(1, Math.ceil(distance / (this.cellSize * 0.72)));
    const radius = erase
      ? Math.ceil(2 + strength * 4)
      : Math.ceil(1 + strength * 3.2);

    for (let sample = 0; sample <= samples; sample += 1) {
      const progress = sample / samples;
      const column = Math.floor(
        (fromX + (toX - fromX) * progress) / this.cellSize,
      );
      const row = Math.floor(
        (fromY + (toY - fromY) * progress) / this.cellSize,
      );

      for (let y = -radius; y <= radius; y += 1) {
        for (let x = -radius; x <= radius; x += 1) {
          if (x * x + y * y > radius * radius) continue;
          const target = this.index(column + x, row + y);
          if (erase) {
            this.cells[target] = 0;
            this.glow[target] = this.glow[target]! * 0.35;
          } else if (
            Math.random() <
            (this.pointer.down ? 0.53 : 0.2 + strength * 0.19)
          ) {
            this.cells[target] = 1;
            this.glow[target] = 1;
          }
        }
      }
    }
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const now = performance.now();
    const previousTime = this.pointer.previousTime || now - 16;
    const deltaTime = Math.max(8, now - previousTime);
    const fromX = this.pointer.previousTime ? this.pointer.x : event.clientX;
    const fromY = this.pointer.previousTime ? this.pointer.y : event.clientY;
    const distance = Math.hypot(event.clientX - fromX, event.clientY - fromY);
    const speed = distance / deltaTime;
    const strength = Math.min(
      1,
      (this.pointer.down ? 0.48 : 0.08) + speed * 0.75,
    );
    const erase =
      this.pointer.erase || event.shiftKey || (event.buttons & 2) !== 0;

    this.paintPointerTrail(
      fromX,
      fromY,
      event.clientX,
      event.clientY,
      strength,
      erase,
    );

    this.pointer.distanceSinceGlider += distance;
    if (
      !erase &&
      this.pointer.distanceSinceGlider >
        (this.pointer.down ? 24 : 52)
    ) {
      this.seedGlider(
        Math.floor(event.clientX / this.cellSize),
        Math.floor(event.clientY / this.cellSize),
        Math.atan2(event.clientY - fromY, event.clientX - fromX),
      );
      this.pointer.distanceSinceGlider = 0;
    }

    this.pointer.previousX = fromX;
    this.pointer.previousY = fromY;
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
    this.pointer.previousTime = now;
  };

  private handlePointerDown = (event: PointerEvent): void => {
    if (
      event.target instanceof Element &&
      event.target.closest('a, button')
    ) {
      return;
    }
    this.pointer.down = true;
    this.pointer.erase = event.button === 2 || event.shiftKey;
    this.pointer.x = event.clientX;
    this.pointer.y = event.clientY;
    this.pointer.previousX = event.clientX;
    this.pointer.previousY = event.clientY;
    this.pointer.previousTime = performance.now();
    const column = Math.floor(event.clientX / this.cellSize);
    const row = Math.floor(event.clientY / this.cellSize);
    if (this.pointer.erase) {
      this.paintPointerTrail(
        event.clientX,
        event.clientY,
        event.clientX,
        event.clientY,
        1,
        true,
      );
    } else {
      this.paintCluster(column, row, 5, 0.48);
      for (let index = 0; index < 3; index += 1) {
        this.seedGlider(
          column,
          row,
          Math.random() * Math.PI * 2,
        );
      }
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    void event;
    this.pointer.down = false;
    this.pointer.erase = false;
  };

  private preventContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private step(): void {
    let population = 0;
    let changes = 0;

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const target = this.index(column, row);
        let neighbors = 0;
        for (let y = -1; y <= 1; y += 1) {
          for (let x = -1; x <= 1; x += 1) {
            if (x === 0 && y === 0) continue;
            neighbors += this.cells[this.index(column + x, row + y)]!;
          }
        }

        const alive = this.cells[target] === 1;
        const survives = alive
          ? neighbors === 2 || neighbors === 3
          : neighbors === 3;
        this.next[target] = survives ? 1 : 0;
        if (survives) population += 1;
        if (survives !== alive) {
          changes += 1;
          if (survives) this.glow[target] = 1;
        }
      }
    }

    [this.cells, this.next] = [this.next, this.cells];
    this.next.fill(0);
    this.quietTicks = changes < 3 ? this.quietTicks + 1 : 0;

    const minimumPopulation = Math.max(
      24,
      Math.floor(this.cells.length * 0.0015),
    );
    if (population < minimumPopulation || this.quietTicks > 32) {
      this.injectEdgeGlider();
      this.quietTicks = 0;
    }
  }

  private injectEdgeGlider(): void {
    const side = Math.floor(Math.random() * 4);
    const column =
      side === 0
        ? 2
        : side === 1
          ? this.columns - 3
          : Math.floor(Math.random() * this.columns);
    const row =
      side === 2
        ? 2
        : side === 3
          ? this.rows - 3
          : Math.floor(Math.random() * this.rows);
    const angle = Math.atan2(
      this.rows * 0.5 - row,
      this.columns * 0.5 - column,
    );
    this.seedGlider(column, row, angle);
  }

  private render(deltaSeconds: number): void {
    const context = this.context;
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = '#000';
    context.fillRect(0, 0, this.width, this.height);
    context.globalCompositeOperation = 'lighter';

    const fade = Math.exp(-deltaSeconds * 4.2);
    for (let index = 0; index < this.cells.length; index += 1) {
      const alive = this.cells[index] === 1;
      this.glow[index] = alive
        ? Math.max(this.glow[index]!, 0.58)
        : this.glow[index]! * fade;
      const energy = this.glow[index]!;
      if (energy < 0.018) continue;

      const column = index % this.columns;
      const row = Math.floor(index / this.columns);
      const x = column * this.cellSize;
      const y = row * this.cellSize;
      const inset = alive ? 1 : 1.7;
      const red = Math.round(112 + energy * 104);
      const green = Math.round(185 + energy * 70);
      const blue = 255;

      if (energy > 0.82) {
        context.fillStyle = `rgba(75, 220, 255, ${0.09 * energy})`;
        context.fillRect(
          x - 2,
          y - 2,
          this.cellSize + 4,
          this.cellSize + 4,
        );
      }
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${Math.min(
        0.96,
        energy,
      )})`;
      context.fillRect(
        x + inset,
        y + inset,
        Math.max(1, this.cellSize - inset * 2),
        Math.max(1, this.cellSize - inset * 2),
      );
    }
    context.globalCompositeOperation = 'source-over';
  }

  private frame = (time: number): void => {
    if (this.disposed || document.hidden) return;
    const deltaSeconds = Math.min(0.05, (time - this.previousFrame) / 1000);
    this.previousFrame = time;
    this.tickAccumulator += deltaSeconds;
    const tickInterval = this.reducedMotion.matches ? 0.22 : 0.095;

    while (this.tickAccumulator >= tickInterval) {
      this.step();
      this.tickAccumulator -= tickInterval;
    }
    this.render(deltaSeconds);
    this.raf = requestAnimationFrame(this.frame);
  };

  private resetTiming = (): void => {
    this.tickAccumulator = 0;
    this.previousFrame = performance.now();
  };

  private handleVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else if (!this.disposed) {
      this.resetTiming();
      this.raf = requestAnimationFrame(this.frame);
    }
  };
}
