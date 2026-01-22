/**
 * Database export utility
 * Exports data to JSON format
 */

import prisma from '../prisma';
import fs from 'fs';
import path from 'path';

const EXPORT_DIR = path.join(process.cwd(), 'exports');

/**
 * Ensure export directory exists
 */
function ensureExportDir(): void {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
}

/**
 * Export all user data to JSON
 */
export async function exportUserData(userId: string): Promise<string> {
  ensureExportDir();
  
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      personalInfo: true,
      skills: {
        include: { category: true },
      },
      experiences: true,
      projects: true,
      educations: true,
      certifications: true,
      achievements: true,
      resumes: {
        include: {
          scores: true,
        },
      },
      applications: {
        include: {
          jobDescription: {
            include: {
              analysis: true,
            },
          },
        },
      },
    },
  });
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFileName = `export-${userId}-${timestamp}.json`;
  const exportPath = path.join(EXPORT_DIR, exportFileName);
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    userId,
    profile,
  };
  
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`Export created: ${exportPath}`);
  
  return exportPath;
}

/**
 * Export all data (admin only)
 */
export async function exportAllData(): Promise<string> {
  ensureExportDir();
  
  const users = await prisma.user.findMany({
    include: {
      profile: {
        include: {
          personalInfo: true,
          skills: {
            include: { category: true },
          },
          experiences: true,
          projects: true,
          educations: true,
          certifications: true,
          achievements: true,
          resumes: {
            include: {
              scores: true,
            },
          },
          applications: {
            include: {
              jobDescription: {
                include: {
                  analysis: true,
                },
              },
            },
          },
        },
      },
    },
  });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFileName = `export-all-${timestamp}.json`;
  const exportPath = path.join(EXPORT_DIR, exportFileName);
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    users,
  };
  
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`Export created: ${exportPath}`);
  
  return exportPath;
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  (async () => {
    try {
      switch (command) {
        case 'user':
          const userId = process.argv[3];
          if (!userId) {
            console.error('Usage: npm run db:export user <userId>');
            process.exit(1);
          }
          const userExportPath = await exportUserData(userId);
          console.log(`✅ Export created: ${userExportPath}`);
          break;
          
        case 'all':
          const allExportPath = await exportAllData();
          console.log(`✅ Export created: ${allExportPath}`);
          break;
          
        default:
          console.log('Usage:');
          console.log('  npm run db:export user <userId> - Export user data');
          console.log('  npm run db:export all          - Export all data');
      }
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}

