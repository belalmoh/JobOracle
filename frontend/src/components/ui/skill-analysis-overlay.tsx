"use client";
import React from "react";
import { motion, useTransform, MotionValue } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { SkillMeter } from "@/components/ui/skill-meter";
import { ImprovementBadge } from "@/components/ui/improvement-badge";

interface SkillAnalysisOverlayProps {
  scrollProgress?: MotionValue<number>;
  skills?: Array<{ name: string; score: number }>;
}

const defaultSkills = [
  { name: "TypeScript", score: 92 },
  { name: "React", score: 88 },
  { name: "Node.js", score: 85 },
  { name: "Python", score: 78 },
  { name: "AWS", score: 74 },
  { name: "Docker", score: 71 },
  { name: "GraphQL", score: 68 },
  { name: "PostgreSQL", score: 65 },
];

const improvements = [
  "Add AWS certification",
  "Highlight leadership experience",
  "Optimize skills section",
  "Strengthen achievements",
];

export function SkillAnalysisOverlay({
  scrollProgress,
  skills = defaultSkills,
}: SkillAnalysisOverlayProps) {
  const overlayOpacity = useTransform(
    scrollProgress ?? new MotionValue(0),
    [0.45, 0.55],
    [0, 1]
  );

  const scanningLineProgress = useTransform(
    scrollProgress ?? new MotionValue(0),
    [0.5, 0.9],
    [0, 1]
  );

  return (
    <motion.div
      className="absolute inset-0 bg-zinc-900/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 md:p-12 rounded-2xl overflow-hidden"
      style={{ opacity: overlayOpacity }}
      initial={{ opacity: 0 }}
    >
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"
        style={{ scaleX: scanningLineProgress, originX: 0 }}
      />

      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-3xl">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Brain className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              AI Analyzing Your Resume
            </h2>
            <p className="text-zinc-400 text-sm">Scanning for skill improvements...</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {skills.map((skill, index) => (
            <SkillMeter
              key={skill.name}
              skill={skill.name}
              score={skill.score}
              scrollProgress={scrollProgress}
              index={index}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {improvements.map((improvement, index) => (
            <ImprovementBadge
              key={improvement}
              text={improvement}
              scrollProgress={scrollProgress}
              index={index}
            />
          ))}
        </div>

        <motion.div
          className="flex items-center gap-2 text-zinc-400 text-sm"
          initial={{ opacity: 0 }}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI-powered recommendations based on industry standards</span>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-800 rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
          style={{
            width: "30%",
            scaleX: scanningLineProgress,
            originX: 0,
          }}
        />
      </motion.div>
    </motion.div>
  );
}