'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, Button, Input, Textarea, Progress, Badge } from '@/components/ui';
import { api, Profile, ProfileInput, Experience, Project, Education, Certification, Achievement } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  key: string;
  title: string;
  icon: string;
}

const steps: Step[] = [
  { id: 1, key: 'personalInfo', title: 'Personal Info', icon: 'person' },
  { id: 2, key: 'summary', title: 'Summary', icon: 'description' },
  { id: 3, key: 'skills', title: 'Skills', icon: 'psychology' },
  { id: 4, key: 'experience', title: 'Experience', icon: 'work' },
  { id: 5, key: 'projects', title: 'Projects', icon: 'code' },
  { id: 6, key: 'education', title: 'Education', icon: 'school' },
  { id: 7, key: 'certifications', title: 'Certifications', icon: 'verified' },
  { id: 8, key: 'achievements', title: 'Achievements', icon: 'emoji_events' },
];

interface ExperienceInput {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  order: number;
}

interface ProjectInput {
  name: string;
  description: string;
  url: string;
  technologies: string;
  order: number;
}

interface EducationInput {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
  order: number;
}

interface CertificationInput {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
}

interface AchievementInput {
  title: string;
  description: string;
  date: string;
}

const emptyExperience: ExperienceInput = {
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  order: 0,
};

const emptyProject: ProjectInput = {
  name: '',
  description: '',
  url: '',
  technologies: '',
  order: 0,
};

const emptyEducation: EducationInput = {
  institution: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  gpa: '',
  order: 0,
};

const emptyCertification: CertificationInput = {
  name: '',
  issuer: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
  credentialUrl: '',
};

const emptyAchievement: AchievementInput = {
  title: '',
  description: '',
  date: '',
};

export default function ProfileBuilderPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    website: '',
  });
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<{ categoryName: string; skills: string[] }[]>([]);
  const [experiences, setExperiences] = useState<ExperienceInput[]>([]);
  const [projects, setProjects] = useState<ProjectInput[]>([]);
  const [educations, setEducations] = useState<EducationInput[]>([]);
  const [certifications, setCertifications] = useState<CertificationInput[]>([]);
  const [achievements, setAchievements] = useState<AchievementInput[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const result = await api.profile.get();
      if (result.success && result.data) {
        setProfile(result.data);
        
        // Map profile to form state
        if (result.data.personalInfo) {
          setPersonalInfo({
            firstName: result.data.personalInfo.firstName || '',
            lastName: result.data.personalInfo.lastName || '',
            email: result.data.personalInfo.email || '',
            phone: result.data.personalInfo.phone || '',
            location: result.data.personalInfo.location || '',
            linkedIn: result.data.personalInfo.linkedIn || '',
            website: result.data.personalInfo.website || '',
          });
        }
        
        setSummary(result.data.summary || '');
        setSkills(groupSkills(result.data.skills));
        
        setExperiences(result.data.experiences.map(exp => ({
          title: exp.title,
          company: exp.company,
          location: exp.location || '',
          startDate: formatDateForInput(exp.startDate),
          endDate: exp.endDate ? formatDateForInput(exp.endDate) : '',
          isCurrent: exp.isCurrent,
          description: exp.description,
          order: exp.order || 0,
        })));
        
        setProjects(result.data.projects.map(proj => ({
          name: proj.name,
          description: proj.description,
          url: proj.url || '',
          technologies: proj.technologies || '',
          order: proj.order || 0,
        })));
        
        setEducations(result.data.educations.map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field || '',
          startDate: formatDateForInput(edu.startDate),
          endDate: edu.endDate ? formatDateForInput(edu.endDate) : '',
          gpa: edu.gpa || '',
          order: edu.order || 0,
        })));
        
        setCertifications(result.data.certifications.map(cert => ({
          name: cert.name,
          issuer: cert.issuer,
          issueDate: formatDateForInput(cert.issueDate),
          expiryDate: cert.expiryDate ? formatDateForInput(cert.expiryDate) : '',
          credentialId: cert.credentialId || '',
          credentialUrl: cert.credentialUrl || '',
        })));
        
        setAchievements(result.data.achievements.map(ach => ({
          title: ach.title,
          description: ach.description,
          date: ach.date ? formatDateForInput(ach.date) : '',
        })));
      }
      setLoading(false);
    }

    loadProfile();
  }, []);

  function formatDateForInput(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  function groupSkills(skillsList: Profile['skills']) {
    const grouped: { categoryName: string; skills: string[] }[] = [];
    const categoryMap = new Map<string, string[]>();
    
    for (const skill of skillsList) {
      const catName = skill.category.name;
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, []);
      }
      categoryMap.get(catName)!.push(skill.name);
    }
    
    for (const [categoryName, skillList] of categoryMap) {
      grouped.push({ categoryName, skills: skillList });
    }
    
    return grouped;
  }

  const buildFormData = (): ProfileInput => ({
    personalInfo: {
      firstName: personalInfo.firstName,
      lastName: personalInfo.lastName,
      email: personalInfo.email,
      phone: personalInfo.phone || null,
      location: personalInfo.location || null,
      linkedIn: personalInfo.linkedIn || null,
      website: personalInfo.website || null,
    },
    summary,
    skills,
    experiences: experiences.map((exp, i) => ({
      title: exp.title,
      company: exp.company,
      location: exp.location || null,
      startDate: exp.startDate,
      endDate: exp.isCurrent ? null : (exp.endDate || null),
      isCurrent: exp.isCurrent,
      description: exp.description,
      order: i,
    })),
    projects: projects.map((proj, i) => ({
      name: proj.name,
      description: proj.description,
      url: proj.url || null,
      technologies: proj.technologies || null,
      order: i,
    })),
    educations: educations.map((edu, i) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field || null,
      startDate: edu.startDate,
      endDate: edu.endDate || null,
      gpa: edu.gpa || null,
      order: i,
    })),
    certifications: certifications.map(cert => ({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate || null,
      credentialId: cert.credentialId || null,
      credentialUrl: cert.credentialUrl || null,
    })),
    achievements: achievements.map(ach => ({
      title: ach.title,
      description: ach.description,
      date: ach.date || null,
    })),
  });

  const handleSave = async () => {
    setSaving(true);
    const formData = buildFormData();
    const result = await api.profile.save(formData);
    setSaving(false);

    if (result.success) {
      setProfile(result.data!);
      showToast('success', 'Profile saved successfully!');
    } else {
      showToast('error', result.error?.message || 'Failed to save profile');
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSave();
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <MainLayout title="Profile Builder">
        <div className="max-w-4xl mx-auto">
          <div className="card animate-pulse h-[600px]"></div>
        </div>
      </MainLayout>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Personal Info
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={personalInfo.firstName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={personalInfo.lastName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={personalInfo.email}
              onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
            />
            <Input
              label="Location"
              placeholder="e.g., San Francisco, CA"
              value={personalInfo.location}
              onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
            />
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/yourprofile"
              value={personalInfo.linkedIn}
              onChange={(e) => setPersonalInfo({ ...personalInfo, linkedIn: e.target.value })}
            />
            <Input
              label="Website"
              placeholder="https://yourwebsite.com"
              value={personalInfo.website}
              onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
            />
          </div>
        );

      case 2: // Summary
        return (
          <div className="space-y-4">
            <Textarea
              label="Professional Summary"
              placeholder="Write a compelling summary of your professional background, key achievements, and career goals..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[200px]"
              hint="Aim for 50-500 characters. Focus on your unique value proposition."
            />
            <div className="text-sm text-text-muted">
              Characters: {summary.length} / 500
            </div>
          </div>
        );

      case 3: // Skills
        return (
          <div className="space-y-4">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Add your skills organized by category. Common categories include: Programming Languages, Frameworks, Tools, Soft Skills.
            </p>
            {skills.map((category, catIndex) => (
              <Card key={catIndex} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Input
                    placeholder="Category name"
                    value={category.categoryName}
                    onChange={(e) => {
                      const newSkills = [...skills];
                      newSkills[catIndex].categoryName = e.target.value;
                      setSkills(newSkills);
                    }}
                    className="max-w-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    onClick={() => {
                      setSkills(skills.filter((_, i) => i !== catIndex));
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <Badge
                      key={skillIndex}
                      className="cursor-pointer hover:bg-error/20"
                      onClick={() => {
                        const newSkills = [...skills];
                        newSkills[catIndex].skills = newSkills[catIndex].skills.filter((_, i) => i !== skillIndex);
                        setSkills(newSkills);
                      }}
                    >
                      {skill}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                  <Input
                    placeholder="Add skill + Enter"
                    className="w-36 h-7 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          const newSkills = [...skills];
                          newSkills[catIndex].skills.push(input.value.trim());
                          setSkills(newSkills);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            ))}
            <Button
              variant="secondary"
              icon="add"
              onClick={() => {
                setSkills([...skills, { categoryName: '', skills: [] }]);
              }}
            >
              Add Category
            </Button>
          </div>
        );

      case 4: // Experience
        return (
          <div className="space-y-4">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Add your work experience, starting with the most recent. Include quantified achievements where possible.
            </p>
            {experiences.map((exp, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                    Experience {index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    onClick={() => setExperiences(experiences.filter((_, i) => i !== index))}
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Job Title"
                      value={exp.title}
                      onChange={(e) => {
                        const newExp = [...experiences];
                        newExp[index].title = e.target.value;
                        setExperiences(newExp);
                      }}
                      required
                    />
                    <Input
                      label="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const newExp = [...experiences];
                        newExp[index].company = e.target.value;
                        setExperiences(newExp);
                      }}
                      required
                    />
                  </div>
                  <Input
                    label="Location"
                    placeholder="e.g., San Francisco, CA"
                    value={exp.location}
                    onChange={(e) => {
                      const newExp = [...experiences];
                      newExp[index].location = e.target.value;
                      setExperiences(newExp);
                    }}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...experiences];
                        newExp[index].startDate = e.target.value;
                        setExperiences(newExp);
                      }}
                      required
                    />
                    <div>
                      <Input
                        label="End Date"
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => {
                          const newExp = [...experiences];
                          newExp[index].endDate = e.target.value;
                          setExperiences(newExp);
                        }}
                        disabled={exp.isCurrent}
                      />
                      <label className="flex items-center gap-2 mt-2 text-sm">
                        <input
                          type="checkbox"
                          checked={exp.isCurrent}
                          onChange={(e) => {
                            const newExp = [...experiences];
                            newExp[index].isCurrent = e.target.checked;
                            if (e.target.checked) newExp[index].endDate = '';
                            setExperiences(newExp);
                          }}
                          className="rounded border-gray-300"
                        />
                        Currently working here
                      </label>
                    </div>
                  </div>
                  <Textarea
                    label="Description"
                    placeholder="• Led development of...&#10;• Increased revenue by...&#10;• Managed team of..."
                    value={exp.description}
                    onChange={(e) => {
                      const newExp = [...experiences];
                      newExp[index].description = e.target.value;
                      setExperiences(newExp);
                    }}
                    hint="Use bullet points. Start with action verbs. Include metrics."
                    className="min-h-[150px]"
                  />
                </div>
              </Card>
            ))}
            <Button
              variant="secondary"
              icon="add"
              onClick={() => setExperiences([...experiences, { ...emptyExperience, order: experiences.length }])}
            >
              Add Experience
            </Button>
          </div>
        );

      case 5: // Projects
        return (
          <div className="space-y-4">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Showcase personal or professional projects that demonstrate your skills.
            </p>
            {projects.map((proj, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                    Project {index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    onClick={() => setProjects(projects.filter((_, i) => i !== index))}
                  />
                </div>
                <div className="space-y-4">
                  <Input
                    label="Project Name"
                    value={proj.name}
                    onChange={(e) => {
                      const newProj = [...projects];
                      newProj[index].name = e.target.value;
                      setProjects(newProj);
                    }}
                    required
                  />
                  <Textarea
                    label="Description"
                    placeholder="What does this project do? What problem does it solve?"
                    value={proj.description}
                    onChange={(e) => {
                      const newProj = [...projects];
                      newProj[index].description = e.target.value;
                      setProjects(newProj);
                    }}
                    className="min-h-[100px]"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="URL"
                      type="url"
                      placeholder="https://github.com/..."
                      value={proj.url}
                      onChange={(e) => {
                        const newProj = [...projects];
                        newProj[index].url = e.target.value;
                        setProjects(newProj);
                      }}
                    />
                    <Input
                      label="Technologies"
                      placeholder="React, Node.js, PostgreSQL"
                      value={proj.technologies}
                      onChange={(e) => {
                        const newProj = [...projects];
                        newProj[index].technologies = e.target.value;
                        setProjects(newProj);
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              variant="secondary"
              icon="add"
              onClick={() => setProjects([...projects, { ...emptyProject, order: projects.length }])}
            >
              Add Project
            </Button>
          </div>
        );

      case 6: // Education
        return (
          <div className="space-y-4">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Add your educational background, starting with the highest degree.
            </p>
            {educations.map((edu, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                    Education {index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    onClick={() => setEducations(educations.filter((_, i) => i !== index))}
                  />
                </div>
                <div className="space-y-4">
                  <Input
                    label="Institution"
                    placeholder="University of..."
                    value={edu.institution}
                    onChange={(e) => {
                      const newEdu = [...educations];
                      newEdu[index].institution = e.target.value;
                      setEducations(newEdu);
                    }}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Degree"
                      placeholder="Bachelor of Science"
                      value={edu.degree}
                      onChange={(e) => {
                        const newEdu = [...educations];
                        newEdu[index].degree = e.target.value;
                        setEducations(newEdu);
                      }}
                      required
                    />
                    <Input
                      label="Field of Study"
                      placeholder="Computer Science"
                      value={edu.field}
                      onChange={(e) => {
                        const newEdu = [...educations];
                        newEdu[index].field = e.target.value;
                        setEducations(newEdu);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Start Date"
                      type="date"
                      value={edu.startDate}
                      onChange={(e) => {
                        const newEdu = [...educations];
                        newEdu[index].startDate = e.target.value;
                        setEducations(newEdu);
                      }}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={edu.endDate}
                      onChange={(e) => {
                        const newEdu = [...educations];
                        newEdu[index].endDate = e.target.value;
                        setEducations(newEdu);
                      }}
                    />
                    <Input
                      label="GPA"
                      placeholder="3.8"
                      value={edu.gpa}
                      onChange={(e) => {
                        const newEdu = [...educations];
                        newEdu[index].gpa = e.target.value;
                        setEducations(newEdu);
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              variant="secondary"
              icon="add"
              onClick={() => setEducations([...educations, { ...emptyEducation, order: educations.length }])}
            >
              Add Education
            </Button>
          </div>
        );

      case 7: // Certifications
        return (
          <div className="space-y-4">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Add professional certifications and credentials.
            </p>
            {certifications.map((cert, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                    Certification {index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Certification Name"
                      placeholder="AWS Solutions Architect"
                      value={cert.name}
                      onChange={(e) => {
                        const newCert = [...certifications];
                        newCert[index].name = e.target.value;
                        setCertifications(newCert);
                      }}
                      required
                    />
                    <Input
                      label="Issuing Organization"
                      placeholder="Amazon Web Services"
                      value={cert.issuer}
                      onChange={(e) => {
                        const newCert = [...certifications];
                        newCert[index].issuer = e.target.value;
                        setCertifications(newCert);
                      }}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Issue Date"
                      type="date"
                      value={cert.issueDate}
                      onChange={(e) => {
                        const newCert = [...certifications];
                        newCert[index].issueDate = e.target.value;
                        setCertifications(newCert);
                      }}
                      required
                    />
                    <Input
                      label="Expiry Date (if applicable)"
                      type="date"
                      value={cert.expiryDate}
                      onChange={(e) => {
                        const newCert = [...certifications];
                        newCert[index].expiryDate = e.target.value;
                        setCertifications(newCert);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Credential ID"
                      placeholder="ABC123XYZ"
                      value={cert.credentialId}
                      onChange={(e) => {
                        const newCert = [...certifications];
                        newCert[index].credentialId = e.target.value;
                        setCertifications(newCert);
                      }}
                    />
                    <Input
                      label="Credential URL"
                      type="url"
                      placeholder="https://..."
                      value={cert.credentialUrl}
                      onChange={(e) => {
                        const newCert = [...certifications];
                        newCert[index].credentialUrl = e.target.value;
                        setCertifications(newCert);
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              variant="secondary"
              icon="add"
              onClick={() => setCertifications([...certifications, { ...emptyCertification }])}
            >
              Add Certification
            </Button>
          </div>
        );

      case 8: // Achievements
        return (
          <div className="space-y-4">
            <p className="text-text-secondary dark:text-text-secondary-dark">
              Highlight notable accomplishments, awards, and recognition.
            </p>
            {achievements.map((ach, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                    Achievement {index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    onClick={() => setAchievements(achievements.filter((_, i) => i !== index))}
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Title"
                      placeholder="Hackathon Winner"
                      value={ach.title}
                      onChange={(e) => {
                        const newAch = [...achievements];
                        newAch[index].title = e.target.value;
                        setAchievements(newAch);
                      }}
                      required
                    />
                    <Input
                      label="Date"
                      type="date"
                      value={ach.date}
                      onChange={(e) => {
                        const newAch = [...achievements];
                        newAch[index].date = e.target.value;
                        setAchievements(newAch);
                      }}
                    />
                  </div>
                  <Textarea
                    label="Description"
                    placeholder="What did you achieve? What was the impact?"
                    value={ach.description}
                    onChange={(e) => {
                      const newAch = [...achievements];
                      newAch[index].description = e.target.value;
                      setAchievements(newAch);
                    }}
                    className="min-h-[100px]"
                  />
                </div>
              </Card>
            ))}
            <Button
              variant="secondary"
              icon="add"
              onClick={() => setAchievements([...achievements, { ...emptyAchievement }])}
            >
              Add Achievement
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout title="Profile Builder">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                Profile Completeness
              </h2>
              <p className="text-sm text-text-muted">Step {currentStep} of {steps.length}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-primary">{profile?.completenessPercent || 0}%</span>
            </div>
          </div>
          <Progress value={profile?.completenessPercent || 0} colorByScore />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Step Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-2">
              <nav className="space-y-1">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      currentStep === step.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <span className="material-symbols-outlined text-lg">{step.icon}</span>
                    <span className="text-sm">{step.title}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Step Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                <Badge variant="info">Step {currentStep}</Badge>
              </CardHeader>
              
              {renderStepContent()}

              <div className="flex justify-between mt-6 pt-6 border-t border-border-light dark:border-border-dark">
                <Button
                  variant="secondary"
                  icon="arrow_back"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={handleSave} loading={saving}>
                    Save
                  </Button>
                  <Button
                    icon={currentStep === 8 ? 'check' : 'arrow_forward'}
                    onClick={handleSaveAndContinue}
                    loading={saving}
                  >
                    {currentStep === 8 ? 'Finish' : 'Save & Continue'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
