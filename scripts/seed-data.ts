
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting test data generation...');

    const email = 'demo.user@example.com';
    const password = 'Password123!';
    const name = 'Sarah Jenkins';

    // 1. Create User
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hashedPassword,
            name,
        },
    });
    console.log(`✅ User created: ${email}`);

    // 2. Create Profile
    const profile = await prisma.profile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            completenessPercent: 95,
            summary: 'Senior Full Stack Developer with 8 years of experience building scalable web applications. Expert in React, Node.js, and Cloud Architecture. Passionate about code quality and team mentorship.',
            personalInfo: {
                create: {
                    firstName: 'Sarah',
                    lastName: 'Jenkins',
                    email: email,
                    phone: '+1 (415) 555-0123',
                    location: 'San Francisco, CA',
                    linkedIn: 'linkedin.com/in/sarahjenkins-demo',
                    website: 'sarahjenkins.dev',
                }
            }
        },
    });
    console.log('✅ Profile created');

    // Clean up existing data to avoid duplicates
    await prisma.skill.deleteMany({ where: { profileId: profile.id } });
    await prisma.experience.deleteMany({ where: { profileId: profile.id } });
    await prisma.project.deleteMany({ where: { profileId: profile.id } });
    await prisma.education.deleteMany({ where: { profileId: profile.id } });
    await prisma.certification.deleteMany({ where: { profileId: profile.id } });
    await prisma.achievement.deleteMany({ where: { profileId: profile.id } });
    await prisma.application.deleteMany({ where: { profileId: profile.id } });

    // 3. Add Skills
    const skillCategories = [
        { name: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Redux'] },
        { name: 'Backend', skills: ['Node.js', 'Express', 'PostgreSQL', 'GraphQL', 'Redis'] },
        { name: 'DevOps', skills: ['AWS', 'Docker', 'CI/CD', 'Terraform'] }
    ];

    for (const cat of skillCategories) {
        const category = await prisma.skillCategory.upsert({
            where: { name: cat.name },
            update: {},
            create: { name: cat.name }
        });

        for (const skill of cat.skills) {
            await prisma.skill.create({
                data: {
                    name: skill,
                    categoryId: category.id,
                    profileId: profile.id
                }
            });
        }
    }
    console.log('✅ Skills added');

    // 4. Add Experience
    await prisma.experience.createMany({
        data: [
            {
                profileId: profile.id,
                title: 'Senior Software Engineer',
                company: 'TechFlow Solutions',
                location: 'San Francisco, CA',
                startDate: new Date('2021-03-01'),
                isCurrent: true,
                description: '• Architected and led the development of a microservices-based e-commerce platform handling 50k+ daily transactions.\n• Improved API response times by 40% through Redis caching and database indexing optimization.\n• Mentored 4 junior developers and established code review standards.'
            },
            {
                profileId: profile.id,
                title: 'Software Developer',
                company: 'Innovate AI',
                location: 'Austin, TX',
                startDate: new Date('2018-06-01'),
                endDate: new Date('2021-02-28'),
                isCurrent: false,
                description: '• Developed a real-time data visualization dashboard using React and D3.js.\n• Implemented automated testing pipeline increasing code coverage to 85%.\n• Integrated third-party payment gateways (Stripe, PayPal).'
            }
        ]
    });
    console.log('✅ Experience added');

    // 5. Add Projects
    await prisma.project.createMany({
        data: [
            {
                profileId: profile.id,
                name: 'E-commerce Platform Redesign',
                description: 'Led the complete redesign of the company flagship e-commerce platform. Migrated from Magento to a custom Next.js + Shopify Headless architecture. Resulted in 50% faster page loads and 20% conversion rate increase.',
                url: 'https://demo-ecommerce.example.com',
                technologies: 'Next.js, Shopify, GraphQL, Tailwind CSS',
                order: 1
            },
            {
                profileId: profile.id,
                name: 'AI Task Management App',
                description: 'Built a personal project using OpenAI API to automatically prioritize tasks. Featured a drag-and-drop interface and natural language task entry.',
                url: 'https://github.com/sarah-j/ai-tasks',
                technologies: 'React, Node.js, OpenAI API, PostgreSQL',
                order: 2
            }
        ]
    });
    console.log('✅ Projects added');

    // 6. Add Education
    await prisma.education.createMany({
        data: [
            {
                profileId: profile.id,
                institution: 'Stanford University',
                degree: 'Master of Science',
                field: 'Computer Science',
                startDate: new Date('2016-09-01'),
                endDate: new Date('2018-06-01'),
                gpa: '3.9'
            },
            {
                profileId: profile.id,
                institution: 'University of Texas at Austin',
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                startDate: new Date('2012-09-01'),
                endDate: new Date('2016-05-01'),
                gpa: '3.8'
            }
        ]
    });
    console.log('✅ Education added');

    // 7. Add Certifications
    await prisma.certification.createMany({
        data: [
            {
                profileId: profile.id,
                name: 'AWS Certified Solutions Architect - Professional',
                issuer: 'Amazon Web Services',
                issueDate: new Date('2023-01-15'),
                expiryDate: new Date('2026-01-15'),
                credentialId: 'AWS-PSA-12345'
            },
            {
                profileId: profile.id,
                name: 'Certified Kubernetes Administrator (CKA)',
                issuer: 'The Linux Foundation',
                issueDate: new Date('2022-08-10'),
                expiryDate: new Date('2025-08-10')
            }
        ]
    });
    console.log('✅ Certifications added');

    // 8. Add Achievements
    await prisma.achievement.createMany({
        data: [
            {
                profileId: profile.id,
                title: 'TechCrunch Disrupt Hackathon Winner 2023',
                description: 'Won 1st place out of 500+ participants for creating an accessibility tool for visually impaired developers.',
                date: new Date('2023-09-20')
            },
            {
                profileId: profile.id,
                title: 'Open Source Contributor of the Month',
                description: 'Recognized by the Next.js core team for significant contributions to the image optimization module.',
                date: new Date('2022-11-01')
            }
        ]
    });
    console.log('✅ Achievements added');

    // 5. Add Job Description
    const job = await prisma.jobDescription.create({
        data: {
            title: 'Lead Frontend Engineer',
            company: 'CloudScale Inc',
            descriptionText: 'We are looking for a Lead Frontend Engineer to drive our frontend architecture. Required: React, TypeScript, Next.js. Preferred: AWS, GraphQL. Responsibilities: Lead a team of 5, Architect new features, Optimize performance.',
        }
    });
    console.log('✅ Job Description created');

    // 6. Add Job Analysis (Mock AI Result)
    await prisma.jobAnalysis.create({
        data: {
            jobDescriptionId: job.id,
            requiredSkills: JSON.stringify(['React', 'TypeScript', 'Next.js']),
            preferredSkills: JSON.stringify(['AWS', 'GraphQL']),
            responsibilities: JSON.stringify(['Lead team', 'Architect features', 'Optimize performance']),
            atsKeywords: JSON.stringify([
                { keyword: 'React', weight: 10, category: 'required' },
                { keyword: 'TypeScript', weight: 9, category: 'required' },
                { keyword: 'Next.js', weight: 8, category: 'required' }
            ]),
            experienceLevel: 'Lead'
        }
    });

    // 7. Add Application
    await prisma.application.create({
        data: {
            profileId: profile.id,
            jobTitle: 'Lead Frontend Engineer',
            company: 'CloudScale Inc',
            status: 'interview',
            appliedDate: new Date(),
            jobDescriptionId: job.id,
            notes: 'Technical interview scheduled for next Tuesday.'
        }
    });
    console.log('✅ Application added');

    // 8. Add Notifications
    await prisma.notification.createMany({
        data: [
            {
                userId: user.id,
                title: 'Profile Completed',
                message: 'Your profile reached 95% completeness! You are ready to generate resumes.',
                type: 'success',
                isRead: false
            },
            {
                userId: user.id,
                title: 'Interview Reminder',
                message: 'You have an interview with CloudScale Inc coming up shortly.',
                type: 'info',
                isRead: false,
                link: '/applications'
            },
            {
                userId: user.id,
                title: 'New Resume Strategy',
                message: 'Check out the new "Recruiter Readability" strategy for your applications.',
                type: 'info',
                isRead: true
            }
        ]
    });
    console.log('✅ Notifications added');

    console.log('\n🎉 Test Data Generation Complete!');
    console.log('-----------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('-----------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
