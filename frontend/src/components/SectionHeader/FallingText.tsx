/**
 * @file FallingText.tsx
 * @description 文字下落动画组件 - 基于Matter.js物理引擎的文字动画效果
 * @copyright 版权所有 (c) 2025 UIED技术团队
 * @website https://fsuied.com
 * @license MIT
 * @version 1.0.0
 * @reference https://www.reactbits.dev/text-animations/falling-text
 */

import React, { useEffect, useRef, useState } from 'react';
import './FallingText.css';
import Matter from "matter-js";

interface FallingTextProps {
  /** 要显示的文本内容 */
  text: string;
  /** 需要高亮的关键词数组 */
  highlightWords?: string[];
  /** 高亮样式类名 */
  highlightClass?: string;
  /** 颜色映射配置 */
  colorMap?: Record<string, string>;
  /** 触发方式 */
  trigger?: 'hover' | 'click' | 'auto' | 'scroll';
  /** 背景颜色 */
  backgroundColor?: string;
  /** 是否显示线框 */
  wireframes?: boolean;
  /** 重力参数 */
  gravity?: number;
  /** 字体大小 */
  fontSize?: string;
  /** 鼠标约束刚度 */
  mouseConstraintStiffness?: number;
  /** 密度 */
  density?: number;
  /** 空气阻力 */
  frictionAir?: number;
  /** 弹性系数 */
  restitution?: number;
  /** 单词间距 */
  wordSpacing?: string;
}

/**
 * 文字下落动画组件
 * 实现基于Matter.js物理引擎的文字动画效果
 */
const FallingText: React.FC<FallingTextProps> = ({
  text,
  highlightWords = [],
  highlightClass = 'highlighted',
  colorMap = {},
  trigger = 'auto',
  backgroundColor = 'transparent',
  wireframes = false,
  gravity = 1,
  fontSize = '1rem',
  mouseConstraintStiffness = 0.2,
  density = 0.001,
  frictionAir = 0.02,
  restitution = 0.5,
  wordSpacing = '2px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [effectStarted, setEffectStarted] = useState(false);

  useEffect(() => {
    if (!textRef.current) return;
    const words = text.split(" ");
    const newHTML = words
      .map((word) => {
        if (!word.trim()) return ''; // 跳过空字符串
        
        // 首先检查是否在colorMap中有精确匹配
        if (colorMap[word]) {
          return `<span class="word ${colorMap[word]}">${word}</span>`;
        }
        
        // 然后检查部分匹配
        const colorKey = Object.keys(colorMap).find(key => 
          word.includes(key) || key.includes(word)
        );
        
        if (colorKey) {
          return `<span class="word ${colorMap[colorKey]}">${word}</span>`;
        }
        
        // 最后检查默认高亮
        const isHighlighted = highlightWords.some((hw) => 
          word.includes(hw) || hw.includes(word)
        );
        
        return `<span class="word ${isHighlighted ? highlightClass : ""}">${word}</span>`;
      })
      .filter(html => html !== '') // 过滤掉空内容
      .join(" ");
    textRef.current.innerHTML = newHTML;
  }, [text, highlightWords, highlightClass, colorMap]);

  useEffect(() => {
    if (trigger === "auto") {
      setEffectStarted(true);
      return;
    }
    if (trigger === "scroll" && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEffectStarted(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [trigger]);

  useEffect(() => {
    if (!effectStarted) return;

    const {
      Engine,
      Render,
      World,
      Bodies,
      Runner,
      Mouse,
      MouseConstraint
    } = Matter;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect || !containerRef.current || !canvasContainerRef.current || !textRef.current) return;
    
    const width = containerRect.width;
    // 响应式高度设置
    const getResponsiveHeight = () => {
      if (window.innerWidth <= 480) return 200;
      if (window.innerWidth <= 768) return 250;
      return 350;
    };
    const height = getResponsiveHeight();

    if (width <= 0 || height <= 0) {
      return;
    }

    const engine = Engine.create({
      gravity: { x: 0, y: gravity, scale: 0.001 },
    });
    const world = engine.world;
    
    const canvasEle = canvasRef.current;
    const canvasContainerEle = canvasContainerRef.current;
    const containerEle = containerRef.current;
    
    if (!canvasEle || !containerEle || !canvasContainerEle) return;
    
    const render = Render.create({
      element: containerEle,
      engine: engine,
      canvas: canvasEle,
      options: {
        width: containerEle.clientWidth,
        height: height,
        background: 'transparent',
        wireframes: wireframes,
        showSleeping: false,
      },
    });
    
    // 创建边界
    const wallThickness = 50;
    const offset = 5;
    
    // 设置更宽的物理边界以确保文字不会溢出
    const ground = Bodies.rectangle(
      containerEle.clientWidth / 2,
      height + wallThickness / 2 - offset,
      containerEle.clientWidth + wallThickness * 2,
      wallThickness,
      { isStatic: true, render: { visible: false } }
    );
    
    const leftWall = Bodies.rectangle(
      -wallThickness / 2 + offset,
      height / 2,
      wallThickness,
      height * 2,
      { isStatic: true, render: { visible: false } }
    );
    
    const rightWall = Bodies.rectangle(
      containerEle.clientWidth + wallThickness / 2 - offset,
      height / 2,
      wallThickness,
      height * 2,
      { isStatic: true, render: { visible: false } }
    );
    
    World.add(world, [ground, leftWall, rightWall]);

    const wordSpans = textRef.current.querySelectorAll(".word");
    const totalWords = wordSpans.length;
    
    // 计算每个单词占据的区域大小，使分布更均匀
    const gridCols = Math.ceil(Math.sqrt(totalWords));
    const gridRows = Math.ceil(totalWords / gridCols);
    const cellWidth = containerEle.clientWidth / gridCols;
    const cellHeight = height / gridRows;

    const wordBodies = Array.from(wordSpans).map((elem, index) => {
      const rect = elem.getBoundingClientRect();
      
      // 确定网格位置
      const gridX = index % gridCols;
      const gridY = Math.floor(index / gridCols);
      
      // 添加一点随机偏移，使分布不那么机械
      const randomOffsetX = (Math.random() - 0.5) * (cellWidth * 0.5);
      const randomOffsetY = (Math.random() - 0.5) * (cellHeight * 0.5);
      
      // 计算初始位置
      const x = (gridX + 0.5) * cellWidth + randomOffsetX;
      const y = (gridY + 0.5) * cellHeight + randomOffsetY;

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        render: { fillStyle: "transparent" },
        restitution: restitution,
        frictionAir: frictionAir,
        friction: 0.2,
        density: density,
        chamfer: { radius: 5 },
      });

      // 给予随机初始速度，但幅度较小
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      });
      
      // 给予轻微的角速度
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
      
      return { elem, body };
    });

    wordBodies.forEach(({ elem, body }) => {
      (elem as HTMLElement).style.position = "absolute";
      (elem as HTMLElement).style.left = `${body.position.x}px`;
      (elem as HTMLElement).style.top = `${body.position.y}px`;
      (elem as HTMLElement).style.transform = "none";
    });

    const mouse = Mouse.create(containerRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false },
      },
    });
    render.mouse = mouse;

    World.add(world, [
      mouseConstraint,
      ...wordBodies.map((wb) => wb.body),
    ]);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    const updateLoop = () => {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        (elem as HTMLElement).style.left = `${x}px`;
        (elem as HTMLElement).style.top = `${y}px`;
        (elem as HTMLElement).style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      Matter.Engine.update(engine);
      requestAnimationFrame(updateLoop);
    };
    updateLoop();

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas && canvasContainerEle.contains(render.canvas)) {
        canvasContainerEle.removeChild(render.canvas);
      }
      World.clear(world, false);
      Engine.clear(engine);
    };
  }, [
    effectStarted,
    gravity,
    wireframes,
    backgroundColor,
    mouseConstraintStiffness,
    density,
    frictionAir,
    restitution
  ]);

  const handleTrigger = () => {
    if (!effectStarted && (trigger === "click" || trigger === "hover")) {
      setEffectStarted(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className="falling-text-container"
      onClick={trigger === "click" ? handleTrigger : undefined}
      onMouseOver={trigger === "hover" ? handleTrigger : undefined}
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        ref={textRef}
        className="falling-text-target"
        style={{
          fontSize: fontSize,
          lineHeight: 1.4,
          wordSpacing: wordSpacing,
        }}
      />
      <div ref={canvasContainerRef} className="falling-text-canvas">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default FallingText; 
