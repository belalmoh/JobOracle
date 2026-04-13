"use client";

import { ResumeSilhouette, ResumeData } from "@/components/ui/resume-silhouettes";
import { ResumeScrollContainer } from "@/components/ui/resume-scroll-container";

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
  return (
    <ResumeScrollContainer
      titleComponent={
        <>
          <h1 className="text-4xl font-semibold text-black dark:text-white">
            JobOracle <br />
            <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
              Your Career Blueprint
            </span>
          </h1>
        </>
      }
    >
      <ResumeSilhouette data={sampleResume} variant="skeleton" />
    </ResumeScrollContainer>
  );
}
