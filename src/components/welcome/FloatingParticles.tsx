import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface FloatingShape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: "circle" | "ring" | "diamond" | "dot-grid";
  parallaxFactor: number;
  driftX: number;
  driftY: number;
}

const FloatingParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: Particle[] = [];
    const shapes: FloatingShape[] = [];
    const particleCount = Math.min(45, Math.floor(window.innerWidth / 25));
    const connectionDistance = 120;
    const mouseRadius = 110;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 2 + 0.6,
        opacity: Math.random() * 0.2 + 0.05,
        hue: 30 + Math.random() * 20,
      });
    }

    const shapeTypes: FloatingShape["type"][] = ["circle", "ring", "diamond", "dot-grid"];
    const numShapes = Math.min(8, Math.floor(window.innerWidth / 150));
    for (let i = 0; i < numShapes; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 30 + Math.random() * 70,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.002,
        opacity: 0.02 + Math.random() * 0.03,
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        parallaxFactor: 0.02 + Math.random() * 0.04,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.08,
      });
    }

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };
    const onScroll = () => { scrollRef.current = window.scrollY; };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("scroll", onScroll);

    const drawShape = (shape: FloatingShape) => {
      ctx.save();
      const parallaxY = scrollRef.current * shape.parallaxFactor;
      ctx.translate(shape.x, shape.y - parallaxY);
      ctx.rotate(shape.rotation);
      ctx.globalAlpha = shape.opacity;

      switch (shape.type) {
        case "circle": {
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, shape.size);
          grad.addColorStop(0, "hsla(37, 92%, 50%, 0.1)");
          grad.addColorStop(0.5, "hsla(45, 96%, 64%, 0.03)");
          grad.addColorStop(1, "hsla(37, 92%, 50%, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, shape.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "ring": {
          ctx.strokeStyle = "hsla(37, 92%, 50%, 0.2)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, shape.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "hsla(45, 96%, 64%, 0.1)";
          ctx.beginPath();
          ctx.arc(0, 0, shape.size * 0.6, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case "diamond": {
          ctx.strokeStyle = "hsla(37, 92%, 50%, 0.15)";
          ctx.lineWidth = 0.6;
          const s = shape.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s, 0);
          ctx.closePath();
          ctx.stroke();
          break;
        }
        case "dot-grid": {
          const gridSize = 4;
          const spacing = shape.size / gridSize;
          ctx.fillStyle = "hsla(37, 92%, 50%, 0.18)";
          const offset = (gridSize * spacing) / 2;
          for (let gx = 0; gx < gridSize; gx++) {
            for (let gy = 0; gy < gridSize; gy++) {
              ctx.beginPath();
              ctx.arc(gx * spacing - offset, gy * spacing - offset, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
        }
      }
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const shape of shapes) {
        shape.rotation += shape.rotationSpeed;
        shape.x += shape.driftX;
        shape.y += shape.driftY;
        if (shape.x < -shape.size) shape.x = canvas.width + shape.size;
        if (shape.x > canvas.width + shape.size) shape.x = -shape.size;
        if (shape.y < -shape.size) shape.y = canvas.height + shape.size;
        if (shape.y > canvas.height + shape.size) shape.y = -shape.size;
        drawShape(shape);
      }

      for (const p of particles) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRadius && dist > 0) {
          const force = (mouseRadius - dist) / mouseRadius * 0.015;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.08;
            ctx.beginPath();
            ctx.strokeStyle = `hsla(37, 92%, 50%, ${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 92%, 55%, ${p.opacity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        grad.addColorStop(0, `hsla(${p.hue}, 96%, 64%, ${p.opacity * 0.2})`);
        grad.addColorStop(1, `hsla(${p.hue}, 96%, 64%, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default FloatingParticles;
