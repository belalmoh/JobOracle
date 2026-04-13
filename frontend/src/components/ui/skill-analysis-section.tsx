"use client";
import React from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";
import { SkillMeter } from "@/components/ui/skill-meter";

interface SkillAnalysisSectionProps {
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

export function SkillAnalysisSection({ skills = defaultSkills }: SkillAnalysisSectionProps) {
  return (
    <motion.section
      className="w-full py-20 px-4 md:px-8 bg-zinc-950"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="flex items-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              AI Skill Analysis
            </h2>
            <p className="text-zinc-400 text-sm">Scanning for skill improvements...</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <SkillMeter skill={skill.name} score={skill.score} index={index} />
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex items-center gap-2 mt-12 text-zinc-400 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>AI-powered recommendations based on industry standards</span>
        </motion.div>
      </div>
    </motion.section>
  );
}