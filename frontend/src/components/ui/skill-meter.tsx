"use client";
import React from "react";
import { motion, useTransform, MotionValue } from "framer-motion";

interface SkillMeterProps {
  skill: string;
  score: number;
  scrollProgress?: MotionValue<number>;
  index: number;
}

export function SkillMeter({ skill, score, scrollProgress, index }: SkillMeterProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = useTransform(
    scrollProgress ?? new MotionValue(0),
    [0.5, 0.9],
    [circumference, circumference * (1 - score / 100)]
  );

  const opacity = useTransform(scrollProgress ?? new MotionValue(0), [0.5, 0.6], [0, 1]);
  const scale = useTransform(scrollProgress ?? new MotionValue(0), [0.5, 0.7], [0.8, 1]);

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      style={{ opacity, scale }}
      initial={{ opacity: 0, scale: 0.8 }}
    >
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <filter id={`glow-${index}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />

          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={`url(#gradient-${index})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            filter={`url(#glow-${index})`}
            initial={{ strokeDashoffset: circumference }}
          />

          <motion.text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white text-lg font-bold"
            style={{ rotate: 90 }}
          >
            {Math.round(score)}%
          </motion.text>
        </svg>

        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(147, 51, 234, ${score / 300}) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      </div>

      <span className="text-sm text-zinc-300 text-center font-medium">{skill}</span>
    </motion.div>
  );
}