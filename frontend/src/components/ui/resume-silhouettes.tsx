"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Mail, Phone, MapPin, Link, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ResumeData {
  name: string;
  title: string;
  contact: {
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: string[];
}

interface ResumeSilhouetteProps {
  data: ResumeData;
  className?: string;
  variant?: "full" | "skeleton";
}

export function ResumeSilhouette({ data, className, variant = "full" }: ResumeSilhouetteProps) {
  if (variant === "skeleton") {
    return <ResumeSkeleton className={className} />;
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

  return (
    <div ref={containerRef} className={cn("relative min-h-screen bg-zinc-950 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-zinc-950 to-blue-950/20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-purple-600/10 to-blue-600/10 blur-[120px] rounded-full" />

      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            className="flex flex-col items-center lg:items-start"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <HeroSilhouette />
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 text-center lg:text-left"
            >
              {data.name}
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-purple-400 mb-6 text-center lg:text-left"
            >
              {data.title}
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8"
            >
              <a
                href={`mailto:${data.contact.email}`}
                className="flex items-center gap-2 text-zinc-400 hover:text-purple-400 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">{data.contact.email}</span>
              </a>
              <a
                href={`tel:${data.contact.phone}`}
                className="flex items-center gap-2 text-zinc-400 hover:text-purple-400 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm">{data.contact.phone}</span>
              </a>
              <span className="flex items-center gap-2 text-zinc-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{data.contact.location}</span>
              </span>
              {data.contact.linkedin && (
                <a
                  href={data.contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-zinc-400 hover:text-purple-400 transition-colors"
                >
                  <Link className="h-4 w-4" />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <SectionHeader icon={<Sparkles className="h-5 w-5" />} title="About Me" />
              <p className="text-zinc-300 leading-relaxed mt-3">{data.summary}</p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionHeader icon={<Briefcase className="h-5 w-5" />} title="Experience" />
              <div className="mt-4 space-y-6">
                {data.experience.map((exp, index) => (
                  <TimelineItem
                    key={index}
                    title={exp.title}
                    subtitle={`${exp.company} • ${exp.duration}`}
                    description={exp.description}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionHeader icon={<GraduationCap className="h-5 w-5" />} title="Education" />
              <div className="mt-4 space-y-4">
                {data.education.map((edu, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mt-2" />
                      {index < data.education.length - 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-zinc-800" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{edu.degree}</p>
                      <p className="text-zinc-400 text-sm">{edu.school}</p>
                      <p className="text-zinc-500 text-sm">{edu.year}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <SectionHeader icon={<Sparkles className="h-5 w-5" />} title="Skills" />
              <div className="flex flex-wrap gap-2 mt-3">
                {data.skills.map((skill, index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Badge
                      variant="secondary"
                      className="bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
                    >
                      {skill}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent"
        style={{ opacity: heroOpacity }}
      />
    </div>
  );
}

function HeroSilhouette() {
  return (
    <motion.div
      className="relative w-40 h-48"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-blue-500/20 blur-[40px] rounded-full" />

      <div className="relative w-full h-full flex flex-col items-center justify-end">
        <div className="absolute top-0 w-16 h-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 shadow-inner" />
        <div className="w-32 h-20 rounded-t-[60px] bg-gradient-to-b from-zinc-700 to-zinc-800" />
        <div className="w-40 h-8 bg-zinc-950" />
      </div>

      <motion.div
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-purple-500"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute -top-1 -left-3 w-2 h-2 rounded-full bg-blue-500"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
    </motion.div>
  );
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

function SectionHeader({ icon, title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-purple-400">{icon}</span>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
    </div>
  );
}

interface TimelineItemProps {
  title: string;
  subtitle: string;
  description: string;
  index: number;
}

function TimelineItem({ title, subtitle, description, index }: TimelineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex gap-4"
    >
      <div className="relative flex-shrink-0">
        <MiniSilhouette />
        {index !== 0 && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-purple-500/50 to-zinc-800" />
        )}
      </div>
      <div className="pb-6">
        <p className="text-white font-medium">{title}</p>
        <p className="text-purple-400 text-sm">{subtitle}</p>
        <p className="text-zinc-400 text-sm mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

function MiniSilhouette() {
  return (
    <div className="relative w-5 h-8 flex flex-col items-center mt-1">
      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700" />
      <div className="w-5 h-4 rounded-t-[20px] bg-gradient-to-b from-zinc-600 to-zinc-700" />
    </div>
  );
}

function ResumeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-screen bg-white p-8 md:p-12", className)}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 rounded bg-zinc-200" />
            <div className="h-5 w-64 rounded bg-zinc-200" />
          </div>
        </div>

        <div className="h-px bg-zinc-200" />

        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-zinc-200" />
          <div className="h-4 w-full rounded bg-zinc-200" />
          <div className="h-4 w-11/12 rounded bg-zinc-200" />
        </div>

        <div className="space-y-4">
          <div className="h-5 w-32 rounded bg-zinc-200" />
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="w-4 h-4 rounded-full bg-zinc-200 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="h-4 w-56 rounded bg-zinc-200" />
                <div className="h-4 w-full rounded bg-zinc-200" />
                <div className="h-4 w-4/5 rounded bg-zinc-200" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-4 h-4 rounded-full bg-zinc-200 mt-1" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="h-4 w-56 rounded bg-zinc-200" />
                <div className="h-4 w-full rounded bg-zinc-200" />
                <div className="h-4 w-3/5 rounded bg-zinc-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-5 w-32 rounded bg-zinc-200" />
          <div className="flex gap-4">
            <div className="w-4 h-4 rounded-full bg-zinc-200 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-zinc-200" />
              <div className="h-4 w-36 rounded bg-zinc-200" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-4 h-4 rounded-full bg-zinc-200 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-zinc-200" />
              <div className="h-4 w-36 rounded bg-zinc-200" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-5 w-24 rounded bg-zinc-200" />
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-zinc-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
