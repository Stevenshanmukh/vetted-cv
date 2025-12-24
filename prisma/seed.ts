import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seed...');

  // Create default profile
  const profile = await prisma.profile.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      completenessPercent: 85,
      summary: 'Experienced full-stack software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, user experience, and mentoring junior developers. Proven track record of delivering high-impact features that drive business growth.',
    },
  });
  console.log('[SEED] Created default profile');

  // Create personal info
  await prisma.personalInfo.upsert({
    where: { profileId: profile.id },
    update: {},
    create: {
      profileId: profile.id,
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      linkedIn: 'https://linkedin.com/in/alexjohnson',
      website: 'https://alexjohnson.dev',
    },
  });
  console.log('[SEED] Created personal info');

  // Create skill categories and skills
  const categories = [
    { name: 'Programming Languages', skills: ['TypeScript', 'JavaScript', 'Python', 'Go'] },
    { name: 'Frontend', skills: ['React', 'Next.js', 'Vue.js', 'Tailwind CSS', 'HTML/CSS'] },
    { name: 'Backend', skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Redis'] },
    { name: 'DevOps', skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform'] },
    { name: 'Soft Skills', skills: ['Leadership', 'Communication', 'Problem Solving', 'Agile'] },
  ];

  // Clear existing skills
  await prisma.skill.deleteMany({ where: { profileId: profile.id } });

  for (const cat of categories) {
    const category = await prisma.skillCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });

    for (const skillName of cat.skills) {
      await prisma.skill.create({
        data: {
          name: skillName,
          categoryId: category.id,
          profileId: profile.id,
        },
      });
    }
  }
  console.log('[SEED] Created skills');

  // Create experiences
  await prisma.experience.deleteMany({ where: { profileId: profile.id } });
  await prisma.experience.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        startDate: new Date('2021-06-01'),
        endDate: null,
        isCurrent: true,
        description: `• Led development of microservices architecture serving 2M+ daily active users
• Reduced API response times by 40% through query optimization and caching strategies
• Mentored team of 4 junior developers, conducting code reviews and pair programming sessions
• Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes
• Collaborated with product team to deliver 12 major features increasing user engagement by 35%`,
        order: 0,
      },
      {
        profileId: profile.id,
        title: 'Software Engineer',
        company: 'StartupXYZ',
        location: 'San Francisco, CA',
        startDate: new Date('2019-03-01'),
        endDate: new Date('2021-05-31'),
        isCurrent: false,
        description: `• Built React-based dashboard used by 500+ enterprise customers
• Designed and implemented RESTful APIs handling 100K+ requests per day
• Reduced application bundle size by 60% through code splitting and lazy loading
• Introduced testing practices increasing code coverage from 20% to 80%
• Participated in on-call rotation maintaining 99.9% uptime SLA`,
        order: 1,
      },
      {
        profileId: profile.id,
        title: 'Junior Developer',
        company: 'WebAgency LLC',
        location: 'Oakland, CA',
        startDate: new Date('2017-07-01'),
        endDate: new Date('2019-02-28'),
        isCurrent: false,
        description: `• Developed responsive websites for 20+ clients using React and Node.js
• Created reusable component library reducing development time by 30%
• Implemented e-commerce features processing $500K+ in monthly transactions
• Collaborated with designers to ensure pixel-perfect implementation`,
        order: 2,
      },
    ],
  });
  console.log('[SEED] Created experiences');

  // Create projects
  await prisma.project.deleteMany({ where: { profileId: profile.id } });
  await prisma.project.createMany({
    data: [
      {
        profileId: profile.id,
        name: 'OpenSource Dashboard',
        description: 'A real-time analytics dashboard for monitoring application metrics. Features WebSocket updates, customizable widgets, and dark mode support.',
        url: 'https://github.com/alexj/dashboard',
        technologies: 'React, TypeScript, D3.js, WebSocket',
        order: 0,
      },
      {
        profileId: profile.id,
        name: 'AI Code Review Bot',
        description: 'GitHub bot that automatically reviews pull requests using GPT-4. Provides suggestions for code improvements, security vulnerabilities, and best practices.',
        url: 'https://github.com/alexj/ai-reviewer',
        technologies: 'Python, FastAPI, OpenAI API, GitHub Actions',
        order: 1,
      },
    ],
  });
  console.log('[SEED] Created projects');

  // Create education
  await prisma.education.deleteMany({ where: { profileId: profile.id } });
  await prisma.education.createMany({
    data: [
      {
        profileId: profile.id,
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: new Date('2013-08-01'),
        endDate: new Date('2017-05-31'),
        gpa: '3.7',
        order: 0,
      },
    ],
  });
  console.log('[SEED] Created education');

  // Create certifications
  await prisma.certification.deleteMany({ where: { profileId: profile.id } });
  await prisma.certification.createMany({
    data: [
      {
        profileId: profile.id,
        name: 'AWS Solutions Architect - Associate',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2023-03-15'),
        expiryDate: new Date('2026-03-15'),
        credentialId: 'AWS-SAA-12345',
      },
      {
        profileId: profile.id,
        name: 'Google Cloud Professional Developer',
        issuer: 'Google',
        issueDate: new Date('2022-11-01'),
        expiryDate: new Date('2024-11-01'),
        credentialId: 'GCP-PD-67890',
      },
    ],
  });
  console.log('[SEED] Created certifications');

  // Create achievements
  await prisma.achievement.deleteMany({ where: { profileId: profile.id } });
  await prisma.achievement.createMany({
    data: [
      {
        profileId: profile.id,
        title: 'Hackathon Winner',
        description: 'First place at TechCrunch Disrupt Hackathon 2023 for building an AI-powered accessibility tool.',
        date: new Date('2023-09-15'),
      },
      {
        profileId: profile.id,
        title: 'Patent Holder',
        description: 'Co-inventor on patent for real-time data synchronization method (US Patent #12,345,678)',
        date: new Date('2022-06-01'),
      },
    ],
  });
  console.log('[SEED] Created achievements');

  // Create sample job descriptions
  const job1 = await prisma.jobDescription.create({
    data: {
      title: 'Senior Full-Stack Engineer',
      company: 'InnovateTech',
      descriptionText: `We're looking for a Senior Full-Stack Engineer to join our growing team.

Requirements:
- 5+ years of experience with JavaScript/TypeScript
- Strong proficiency in React and Node.js
- Experience with cloud platforms (AWS, GCP, or Azure)
- Solid understanding of database design and optimization
- Experience with CI/CD pipelines and DevOps practices

Preferred:
- Experience with GraphQL
- Knowledge of Kubernetes and Docker
- Familiarity with machine learning concepts

Responsibilities:
- Lead development of new features and products
- Mentor junior developers and conduct code reviews
- Collaborate with product and design teams
- Participate in architecture decisions
- Maintain and improve existing codebase`,
    },
  });

  await prisma.jobAnalysis.create({
    data: {
      jobDescriptionId: job1.id,
      requiredSkills: JSON.stringify(['TypeScript', 'React', 'Node.js', 'AWS', 'CI/CD']),
      preferredSkills: JSON.stringify(['GraphQL', 'Kubernetes', 'Docker', 'Machine Learning']),
      responsibilities: JSON.stringify([
        'Lead development of new features and products',
        'Mentor junior developers and conduct code reviews',
        'Collaborate with product and design teams',
      ]),
      atsKeywords: JSON.stringify([
        { keyword: 'TypeScript', weight: 10, category: 'required' },
        { keyword: 'React', weight: 10, category: 'required' },
        { keyword: 'Node.js', weight: 9, category: 'required' },
        { keyword: 'AWS', weight: 8, category: 'required' },
        { keyword: 'CI/CD', weight: 7, category: 'required' },
        { keyword: 'GraphQL', weight: 5, category: 'preferred' },
        { keyword: 'Kubernetes', weight: 5, category: 'preferred' },
        { keyword: 'Docker', weight: 5, category: 'preferred' },
      ]),
      experienceLevel: 'Senior',
    },
  });
  console.log('[SEED] Created job descriptions');

  // Create sample resume
  const resume = await prisma.resume.create({
    data: {
      title: 'Senior Full-Stack Engineer at InnovateTech',
      profileId: profile.id,
      jobDescriptionId: job1.id,
      strategy: 'max_ats',
      latexContent: `\\documentclass[11pt,a4paper]{moderncv}
\\moderncvstyle{banking}
\\moderncvcolor{blue}
\\usepackage[utf8]{inputenc}
\\usepackage[scale=0.75]{geometry}

\\name{Alex}{Johnson}
\\title{Senior Full-Stack Engineer}
\\address{San Francisco, CA}{}{}
\\phone[mobile]{+1 (555) 123-4567}
\\email{alex.johnson@email.com}
\\social[linkedin]{alexjohnson}

\\begin{document}
\\makecvtitle

\\section{Skills}
\\cvitem{Languages}{TypeScript, JavaScript, Python, Go}
\\cvitem{Frontend}{React, Next.js, Vue.js, Tailwind CSS}
\\cvitem{Backend}{Node.js, Express, PostgreSQL, MongoDB, Redis}
\\cvitem{DevOps}{Docker, Kubernetes, AWS, CI/CD, Terraform}

\\section{Professional Experience}
\\cventry{Jun 2021 -- Present}{Senior Software Engineer}{TechCorp Inc.}{San Francisco, CA}{}{
\\begin{itemize}
\\item Led development of microservices architecture serving 2M+ daily active users
\\item Reduced API response times by 40\\% through query optimization and caching strategies
\\item Mentored team of 4 junior developers, conducting code reviews and pair programming sessions
\\item Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes
\\end{itemize}
}

\\section{Education}
\\cventry{2013 -- 2017}{B.S. Computer Science}{UC Berkeley}{}{GPA: 3.7}{}

\\end{document}`,
    },
  });

  await prisma.resumeScore.create({
    data: {
      resumeId: resume.id,
      atsScore: 85,
      recruiterScore: 78,
      keywordMatchPct: 82,
      formattingScore: 100,
      readabilityScore: 75,
      metricsScore: 80,
      verbsScore: 85,
      breakdown: JSON.stringify({
        ats: { keywordCoverage: 82, formatScore: 100, sectionScore: 100, lengthScore: 85 },
        recruiter: { metricsScore: 80, actionVerbScore: 85, readabilityScore: 75 },
      }),
      missingKeywords: JSON.stringify(['GraphQL', 'Machine Learning']),
      recommendations: JSON.stringify([
        'Add GraphQL experience to improve ATS score',
        'Include more quantified achievements in bullets',
      ]),
    },
  });
  console.log('[SEED] Created sample resume with scores');

  // Create sample applications
  await prisma.application.deleteMany({ where: { profileId: profile.id } });
  await prisma.application.createMany({
    data: [
      {
        profileId: profile.id,
        jobTitle: 'Senior Full-Stack Engineer',
        company: 'InnovateTech',
        location: 'San Francisco, CA',
        jobDescriptionId: job1.id,
        resumeId: resume.id,
        status: 'interview',
        appliedDate: new Date('2024-01-15'),
        interviewDate: new Date('2024-01-25'),
        notes: 'Technical interview scheduled for next week',
      },
      {
        profileId: profile.id,
        jobTitle: 'Staff Engineer',
        company: 'BigTech Corp',
        location: 'Remote',
        status: 'applied',
        appliedDate: new Date('2024-01-20'),
        applicationUrl: 'https://jobs.bigtech.com/12345',
      },
      {
        profileId: profile.id,
        jobTitle: 'Engineering Manager',
        company: 'StartupABC',
        location: 'New York, NY',
        status: 'offer',
        appliedDate: new Date('2024-01-05'),
        offerDate: new Date('2024-01-30'),
        salary: '$200,000 + equity',
        notes: 'Great offer, considering options',
      },
      {
        profileId: profile.id,
        jobTitle: 'Principal Engineer',
        company: 'Enterprise Inc.',
        location: 'Seattle, WA',
        status: 'rejected',
        appliedDate: new Date('2023-12-15'),
        rejectionDate: new Date('2024-01-10'),
        notes: 'Looking for more distributed systems experience',
      },
      {
        profileId: profile.id,
        jobTitle: 'Tech Lead',
        company: 'AgileTeam',
        location: 'Austin, TX',
        status: 'withdrawn',
        appliedDate: new Date('2023-12-20'),
        notes: 'Withdrew after receiving other offers',
      },
    ],
  });
  console.log('[SEED] Created sample applications');

  console.log('[SEED] Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

