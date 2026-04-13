"use client";

import React, { useRef, useState } from "react";
import { useScroll, useTransform, motion, useMotionValueEvent, MotionValue } from "framer-motion";
import { ResumeSilhouette, ResumeData } from "@/components/ui/resume-silhouettes";
import { Brain, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const sampleResume: ResumeData = {
  name: "Alexandra Chen",
  title: "Senior Full-Stack Engineer",
  contact: {
    email: "alexandra.chen@email.com",
    phone: "+1 (415) 555-0147",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/alexandrachen",
  },
  summary:
    "Passionate software engineer with 8+ years of experience building scalable web applications and leading high-performing teams. Specialized in React, Node.js, and cloud architecture with a track record of delivering products that serve millions of users.",
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      duration: "2021 - Present",
      description:
        "Led development of microservices architecture serving 10M+ daily active users. Reduced API latency by 40% through strategic caching and query optimization.",
    },
    {
      title: "Software Engineer",
      company: "StartupXYZ",
      duration: "2018 - 2021",
      description:
        "Built and launched 3 major product features from scratch. Mentored junior developers and established code review practices that improved code quality by 60%.",
    },
    {
      title: "Junior Software Engineer",
      company: "WebAgency Co.",
      duration: "2016 - 2018",
      description:
        "Developed responsive web interfaces for 20+ client projects using React and Vue.js. Contributed to open-source libraries with 2K+ GitHub stars.",
    },
  ],
  education: [
    {
      degree: "M.S. Computer Science",
      school: "Stanford University",
      year: "2016",
    },
    {
      degree: "B.S. Computer Science",
      school: "UC Berkeley",
      year: "2014",
    },
  ],
  skills: [
    "TypeScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "PostgreSQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "GraphQL",
    "REST APIs",
    "Git",
    "Agile/Scrum",
  ],
};

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const [scrollProgress, setScrollProgress] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    setScrollProgress(latest);
  });

  const isExpanded = scrollProgress > 0.2;
  const showSkillSection = scrollProgress > 0.24;
  const showImprovementsSection = scrollProgress > 0.3;

  const rotate = useTransform(scrollYProgress, [0, 0.3], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  const progressBarBackground = useTransform(
    scrollYProgress,
    [0, 0.3],
    ["bg-zinc-600", "bg-gradient-to-r from-pink-500 via-purple-500 to-fuchsia-500"]
  );

  const skeletonColorProgress = useTransform(scrollYProgress, [0.3, 0.7], [0, 1]);

  return (
    <div className="bg-zinc-950 min-h-screen">
      <div ref={containerRef} className="h-[250rem] relative">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div
            className="w-full max-w-5xl mx-auto px-4"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              style={{ translateY: translate }}
              className="text-center mb-6"
            >
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight">JobOracle</h1>
              <p className="text-3xl md:text-[4.5rem] font-bold text-white/95 mt-1 leading-none">
                Your AI career companion
              </p>
            </motion.div>

            <motion.div
              style={{
                rotateX: rotate,
                scale,
                boxShadow:
                  "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
              }}
              className="max-w-5xl mx-auto w-full border-4 border-[#6C6C6C] bg-[#222222] rounded-[30px] shadow-2xl overflow-hidden"
            >
              <motion.div
                className="h-1"
                style={{ scaleX: scrollYProgress, originX: 0, background: progressBarBackground }}
              />

              <div className="w-full p-2 md:p-6">
                <div className="h-full w-full overflow-hidden rounded-2xl">
                  <SkeletonWithScroll
                    data={sampleResume}
                    colorProgress={skeletonColorProgress}
                  />
                </div>
              </div>

              <motion.div
                className="px-6 md:px-12 overflow-hidden"
                initial={false}
                animate={{
                  maxHeight: isExpanded ? 520 : 0,
                  opacity: isExpanded ? 1 : 0,
                  paddingBottom: isExpanded ? 24 : 0,
                }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="space-y-3">
                  <motion.div
                    className="overflow-hidden"
                    initial={false}
                    animate={{
                      maxHeight: showSkillSection ? 140 : 0,
                      opacity: showSkillSection ? 1 : 0,
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="pt-1">
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                          <Brain className="w-5 h-5 text-purple-400" />
                        </motion.div>
                        <h2 className="text-lg font-bold text-white">AI Skill Analysis</h2>
                      </div>

                      <div className="space-y-2">
                        <motion.div
                          className="h-2 w-4/5 rounded origin-left"
                          style={{
                            backgroundImage:
                              "linear-gradient(90deg, rgba(82,82,91,0.45) 0%, rgba(161,161,170,0.85) 50%, rgba(82,82,91,0.45) 100%)",
                            backgroundSize: "200% 100%",
                          }}
                          initial={false}
                          animate={{
                            scaleX: showSkillSection ? 1 : 0.7,
                            backgroundPosition: showSkillSection ? ["200% 0", "-200% 0"] : "200% 0",
                          }}
                          transition={{
                            scaleX: { duration: 0.45, delay: 0.05, ease: "easeOut" },
                            backgroundPosition: {
                              duration: 1.6,
                              ease: "linear",
                              repeat: Infinity,
                            },
                          }}
                        />
                        <motion.div
                          className="h-2 w-3/5 rounded origin-left"
                          style={{
                            backgroundImage:
                              "linear-gradient(90deg, rgba(82,82,91,0.45) 0%, rgba(161,161,170,0.85) 50%, rgba(82,82,91,0.45) 100%)",
                            backgroundSize: "200% 100%",
                          }}
                          initial={false}
                          animate={{
                            scaleX: showSkillSection ? 1 : 0.7,
                            backgroundPosition: showSkillSection ? ["200% 0", "-200% 0"] : "200% 0",
                          }}
                          transition={{
                            scaleX: { duration: 0.45, delay: 0.1, ease: "easeOut" },
                            backgroundPosition: {
                              duration: 1.6,
                              ease: "linear",
                              repeat: Infinity,
                            },
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="overflow-hidden"
                    initial={false}
                    animate={{
                      maxHeight: showImprovementsSection ? 140 : 0,
                      opacity: showImprovementsSection ? 1 : 0,
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="pt-1">
                      <div className="flex items-center gap-3 mb-3">
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
                          <Lightbulb className="w-5 h-5 text-blue-400" />
                        </motion.div>
                        <h2 className="text-lg font-bold text-white">AI Recommendations</h2>
                      </div>

                      <div className="space-y-2">
                        <motion.div
                          className="h-2 w-3/4 rounded origin-left"
                          style={{
                            backgroundImage:
                              "linear-gradient(90deg, rgba(82,82,91,0.45) 0%, rgba(161,161,170,0.85) 50%, rgba(82,82,91,0.45) 100%)",
                            backgroundSize: "200% 100%",
                          }}
                          initial={false}
                          animate={{
                            scaleX: showImprovementsSection ? 1 : 0.7,
                            backgroundPosition: showImprovementsSection ? ["200% 0", "-200% 0"] : "200% 0",
                          }}
                          transition={{
                            scaleX: { duration: 0.45, delay: 0.05, ease: "easeOut" },
                            backgroundPosition: {
                              duration: 1.6,
                              ease: "linear",
                              repeat: Infinity,
                            },
                          }}
                        />
                        <motion.div
                          className="h-2 w-1/2 rounded origin-left"
                          style={{
                            backgroundImage:
                              "linear-gradient(90deg, rgba(82,82,91,0.45) 0%, rgba(161,161,170,0.85) 50%, rgba(82,82,91,0.45) 100%)",
                            backgroundSize: "200% 100%",
                          }}
                          initial={false}
                          animate={{
                            scaleX: showImprovementsSection ? 1 : 0.7,
                            backgroundPosition: showImprovementsSection ? ["200% 0", "-200% 0"] : "200% 0",
                          }}
                          transition={{
                            scaleX: { duration: 0.45, delay: 0.1, ease: "easeOut" },
                            backgroundPosition: {
                              duration: 1.6,
                              ease: "linear",
                              repeat: Infinity,
                            },
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonWithScroll({
  data,
  colorProgress,
}: {
  data: ResumeData;
  colorProgress: MotionValue<number>;
}) {
  const surfaceColor = useTransform(colorProgress, [0.3, 0.7], ["#f4f4f5", "#fdf2f8"]);
  const barColor = useTransform(colorProgress, [0.3, 0.7], ["#e4e4e7", "#e9d5ff"]);
  const dotColor = useTransform(colorProgress, [0.3, 0.7], ["#a1a1aa", "#c084fc"]);
  const chipColor = useTransform(colorProgress, [0.3, 0.7], ["#e4e4e7", "#f0abfc"]);

  return (
    <motion.div
      className="min-h-[20rem] md:min-h-[25rem] p-6"
      style={{ backgroundColor: surfaceColor }}
    >
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <motion.div className="w-16 h-16 rounded-full" style={{ backgroundColor: chipColor }} />
          <div className="flex-1 space-y-2">
            <motion.div className="h-6 w-40 rounded" style={{ backgroundColor: barColor }} />
            <motion.div className="h-4 w-52 rounded" style={{ backgroundColor: barColor }} />
          </div>
        </div>

        <motion.div className="h-px" style={{ backgroundColor: barColor }} />

        <div className="space-y-2">
          <motion.div className="h-3 w-20 rounded" style={{ backgroundColor: barColor }} />
          <motion.div className="h-3 w-full rounded" style={{ backgroundColor: barColor }} />
          <motion.div className="h-3 w-11/12 rounded" style={{ backgroundColor: barColor }} />
        </div>

        <div className="space-y-3">
          <motion.div className="h-4 w-28 rounded" style={{ backgroundColor: barColor }} />
          <div className="space-y-2">
            <div className="flex gap-3">
              <motion.div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: dotColor }} />
              <div className="flex-1 space-y-1.5">
                <motion.div className="h-3 w-32 rounded" style={{ backgroundColor: barColor }} />
                <motion.div className="h-3 w-48 rounded" style={{ backgroundColor: barColor }} />
                <motion.div className="h-3 w-full rounded" style={{ backgroundColor: barColor }} />
              </div>
            </div>
            <div className="flex gap-3">
              <motion.div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: dotColor }} />
              <div className="flex-1 space-y-1.5">
                <motion.div className="h-3 w-32 rounded" style={{ backgroundColor: barColor }} />
                <motion.div className="h-3 w-44 rounded" style={{ backgroundColor: barColor }} />
                <motion.div className="h-3 w-3/4 rounded" style={{ backgroundColor: barColor }} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <motion.div className="h-4 w-24 rounded" style={{ backgroundColor: barColor }} />
          <div className="flex gap-3">
            <motion.div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: dotColor }} />
            <div className="flex-1 space-y-1.5">
              <motion.div className="h-3 w-40 rounded" style={{ backgroundColor: barColor }} />
              <motion.div className="h-3 w-32 rounded" style={{ backgroundColor: barColor }} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <motion.div className="h-4 w-20 rounded" style={{ backgroundColor: barColor }} />
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <motion.div key={i} className="h-6 w-20 rounded-full" style={{ backgroundColor: chipColor }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}