'use client'

import { useEffect, useRef } from 'react'

export default function RoutingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };
    window.addEventListener('resize', resize);

    const nodes: Node[] = [];
    const signals: Signal[] = [];
    const timeouts: NodeJS.Timeout[] = [];
    const cols = 14;
    const rows = 10;
    
    class Node {
      x: number; y: number; c: number; r: number;
      constructor(c: number, r: number) {
        this.c = c; this.r = r;
        this.x = 0; this.y = 0;
      }
      update() {
        const cellW = width / (cols - 1);
        const cellH = height / (rows - 1);
        this.x = this.c * cellW;
        this.y = this.r * cellH;
      }
    }

    class Signal {
      currentNode!: Node; targetNode!: Node; progress!: number; speed!: number; active!: boolean;
      constructor() { this.reset(); }
      reset() {
        const rC = Math.floor(Math.random() * (cols-1));
        const rR = Math.floor(Math.random() * (rows-1));
        this.currentNode = nodes[rR * cols + rC];
        const goRight = Math.random() > 0.5;
        if(goRight && rC < cols-2) this.targetNode = nodes[rR * cols + (rC + 1)];
        else if(!goRight && rR < rows-2) this.targetNode = nodes[(rR + 1) * cols + rC];
        else this.targetNode = this.currentNode;
        
        this.progress = 0;
        this.speed = 0.008 + Math.random() * 0.008; 
        this.active = true;
      }
      update() {
        if(!this.active || !this.targetNode || !this.currentNode) return;
        this.progress += this.speed;
        if(this.progress >= 1) {
          if (Math.random() > 0.8) {
             this.active = false;
             timeouts.push(setTimeout(() => this.reset(), 1000 + Math.random()*2000));
          } else {
             this.currentNode = this.targetNode;
             this.progress = 0;
             const neighbors = [];
             if(this.currentNode.c < cols-1) neighbors.push(nodes[this.currentNode.r * cols + (this.currentNode.c+1)]);
             if(this.currentNode.r < rows-1) neighbors.push(nodes[(this.currentNode.r+1) * cols + this.currentNode.c]);
             if(neighbors.length > 0) this.targetNode = neighbors[Math.floor(Math.random() * neighbors.length)];
             else { this.active = false; timeouts.push(setTimeout(() => this.reset(), 500)); }
          }
        }
      }
      draw(ctx: CanvasRenderingContext2D) {
        if(!this.active || !this.targetNode || !this.currentNode) return;
        const x = this.currentNode.x + (this.targetNode.x - this.currentNode.x) * this.progress;
        const y = this.currentNode.y + (this.targetNode.y - this.currentNode.y) * this.progress;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.currentNode.x, this.currentNode.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    function init() {
      nodes.length = 0; signals.length = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          nodes.push(new Node(c, r));
        }
      }
      for(let i=0; i<15; i++) signals.push(new Signal());
    }

    let animationFrameId: number;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      nodes.forEach(node => node.update());
      signals.forEach(sig => sig.update());

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const node = nodes[index];
          if (c < cols - 1) { ctx.moveTo(node.x, node.y); ctx.lineTo(nodes[index + 1].x, nodes[index + 1].y); }
          if (r < rows - 1) { ctx.moveTo(node.x, node.y); ctx.lineTo(nodes[index + cols].x, nodes[index + cols].y); }
        }
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      nodes.forEach(node => {
        ctx.fillRect(node.x - 1.5, node.y - 1.5, 3, 3);
      });

      signals.forEach(sig => sig.draw(ctx));
      animationFrameId = requestAnimationFrame(draw);
    }
    
    init();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      timeouts.forEach(t => clearTimeout(t));
    }
  }, []);

  return <canvas id="routing-canvas" ref={canvasRef}></canvas>
}
