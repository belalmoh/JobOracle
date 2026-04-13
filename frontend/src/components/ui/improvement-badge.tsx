"use client";
import React from "react";
import { motion, useTransform, MotionValue } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ImprovementBadgeProps {
  text: string;
  scrollProgress?: MotionValue<number>;
  index: number;
}

export function ImprovementBadge({ text, scrollProgress, index }: ImprovementBadgeProps) {
  const opacity = useTransform(scrollProgress ?? new MotionValue(0), [0.6, 0.75], [0, 1]);
  const scale = useTransform(scrollProgress ?? new MotionValue(0), [0.6, 0.8], [0, 1]);
  const x = useTransform(scrollProgress ?? new MotionValue(0), [0.6, 0.8], [50, 0]);

  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30"
      style={{ opacity, scale, x }}
      initial={{ opacity: 0, scale: 0, x: 50 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: index * 0.1,
      }}
    >
      <motion.div
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      >
        <Sparkles className="w-4 h-4 text-purple-400" />
      </motion.div>
      <span className="text-sm text-zinc-200 font-medium whitespace-nowrap">{text}</span>
    </motion.div>
  );
}