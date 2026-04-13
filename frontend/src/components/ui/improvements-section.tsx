"use client";
import React from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { ImprovementBadge } from "@/components/ui/improvement-badge";

interface ImprovementsSectionProps {
  improvements?: string[];
}

const defaultImprovements = [
  "Add AWS certification",
  "Highlight leadership experience",
  "Optimize skills section",
  "Strengthen achievements",
  "Add quantifiable metrics",
  "Expand project descriptions",
];

export function ImprovementsSection({
  improvements = defaultImprovements,
}: ImprovementsSectionProps) {
  return (
    <motion.section
      className="w-full py-20 px-4 md:px-8 bg-zinc-900"
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
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          >
            <Lightbulb className="w-8 h-8 text-blue-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              AI Recommendations
            </h2>
            <p className="text-zinc-400 text-sm">
              Suggestions to enhance your resume
            </p>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-4 justify-center">
          {improvements.map((improvement, index) => (
            <motion.div
              key={improvement}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <ImprovementBadge text={improvement} index={index} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}