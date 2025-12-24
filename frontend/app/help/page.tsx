import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle } from '@/components/ui';

const faqs = [
  {
    question: 'What is ATS optimization?',
    answer: 'ATS (Applicant Tracking System) optimization ensures your resume contains the right keywords and formatting to pass through automated screening systems used by most companies.',
  },
  {
    question: 'How does the scoring work?',
    answer: 'We analyze your resume against industry best practices. ATS Score measures keyword coverage, formatting, and structure. Recruiter Score evaluates metrics, action verbs, and readability.',
  },
  {
    question: 'What resume strategy should I choose?',
    answer: 'Choose "Max ATS" for large companies with automated screening, "Recruiter Readability" for human-first reviews, "Career Switch" when changing industries, "Promotion" for internal moves, and "Stretch Role" when aiming higher.',
  },
  {
    question: 'Can I edit the generated LaTeX?',
    answer: 'Currently, the LaTeX output is read-only. You can download the .tex file and edit it in any LaTeX editor like Overleaf or TeXstudio.',
  },
  {
    question: 'How do I compile the LaTeX resume?',
    answer: 'You can use free online tools like Overleaf (overleaf.com) to compile your LaTeX resume into a PDF. Simply create an account, upload the .tex file, and compile.',
  },
  {
    question: 'Is my data secure?',
    answer: 'In v1, all data is stored locally on your machine. No data is sent to external servers. Future versions will include secure cloud storage.',
  },
];

const shortcuts = [
  { key: 'Dashboard', desc: 'View overview and quick actions' },
  { key: 'Profile Builder', desc: 'Build and maintain your master profile' },
  { key: 'Job Analysis', desc: 'Analyze job descriptions for keywords' },
  { key: 'Resume Library', desc: 'Access all your generated resumes' },
  { key: 'Applications', desc: 'Track your job applications' },
];

export default function HelpPage() {
  return (
    <MainLayout title="Help & Support">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                  Complete Your Profile
                </h4>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Start by filling out your profile with your experience, skills, education, and achievements.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                  Analyze a Job Description
                </h4>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Paste a job description to extract keywords, requirements, and analyze your match.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                  Generate & Score Resume
                </h4>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Choose a strategy, generate your tailored resume, and get instant ATS and recruiter scores.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-primary">4</span>
              </div>
              <div>
                <h4 className="font-medium text-text-primary dark:text-text-primary-dark">
                  Track Applications
                </h4>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Keep track of where you&apos;ve applied and monitor your job search progress.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <div className="divide-y divide-border-light dark:divide-border-dark">
            {faqs.map((faq, i) => (
              <div key={i} className="py-4">
                <h4 className="font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  {faq.question}
                </h4>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Navigation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Guide</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcuts.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <span className="material-symbols-outlined text-primary">arrow_right</span>
                <div>
                  <div className="font-medium text-text-primary dark:text-text-primary-dark">
                    {item.key}
                  </div>
                  <div className="text-sm text-text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <p className="text-text-secondary dark:text-text-secondary-dark mb-4">
            This is a local application. For issues or feature requests, please check the project documentation or create an issue on GitHub.
          </p>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-text-muted">
              <span className="material-symbols-outlined text-lg">info</span>
              Version 1.0.0
            </span>
            <span className="flex items-center gap-1 text-text-muted">
              <span className="material-symbols-outlined text-lg">storage</span>
              Local Database
            </span>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

