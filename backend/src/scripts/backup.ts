/**
 * Database backup utility
 * Creates a backup of the SQLite database
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
const BACKUP_DIR = path.join(process.cwd(), 'backups');

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a backup of the database
 */
export function createBackup(): string {
  ensureBackupDir();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, backupFileName);
  
  // Copy database file
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Backup created: ${backupPath}`);
    return backupPath;
  } else {
    throw new Error(`Database file not found: ${DB_PATH}`);
  }
}

/**
 * List all backups
 */
export function listBackups(): string[] {
  ensureBackupDir();
  
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }
  
  return fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
    .sort()
    .reverse(); // Most recent first
}

/**
 * Restore database from backup
 */
export function restoreBackup(backupFileName: string): void {
  ensureBackupDir();
  
  const backupPath = path.join(BACKUP_DIR, backupFileName);
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupFileName}`);
  }
  
  // Create backup of current database before restore
  const currentBackup = createBackup();
  console.log(`Current database backed up to: ${currentBackup}`);
  
  // Restore from backup
  fs.copyFileSync(backupPath, DB_PATH);
  console.log(`Database restored from: ${backupFileName}`);
}

/**
 * Delete old backups (keep last N backups)
 */
export function cleanupBackups(keepCount: number = 10): void {
  const backups = listBackups();
  
  if (backups.length <= keepCount) {
    return;
  }
  
  const toDelete = backups.slice(keepCount);
  
  for (const backup of toDelete) {
    const backupPath = path.join(BACKUP_DIR, backup);
    fs.unlinkSync(backupPath);
    console.log(`Deleted old backup: ${backup}`);
  }
  
  console.log(`Kept ${keepCount} most recent backups`);
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'create':
        const backupPath = createBackup();
        console.log(`✅ Backup created: ${backupPath}`);
        break;
        
      case 'list':
        const backups = listBackups();
        console.log(`Found ${backups.length} backups:`);
        backups.forEach((backup, index) => {
          const backupPath = path.join(BACKUP_DIR, backup);
          const stats = fs.statSync(backupPath);
          console.log(`  ${index + 1}. ${backup} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
        break;
        
      case 'restore':
        const backupName = process.argv[3];
        if (!backupName) {
          console.error('Usage: npm run db:restore <backup-file-name>');
          process.exit(1);
        }
        restoreBackup(backupName);
        console.log('✅ Database restored');
        break;
        
      case 'cleanup':
        const keep = parseInt(process.argv[3]) || 10;
        cleanupBackups(keep);
        console.log('✅ Cleanup complete');
        break;
        
      default:
        console.log('Usage:');
        console.log('  npm run db:backup create   - Create a new backup');
        console.log('  npm run db:backup list    - List all backups');
        console.log('  npm run db:backup restore <file> - Restore from backup');
        console.log('  npm run db:backup cleanup [keep-count] - Cleanup old backups');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

