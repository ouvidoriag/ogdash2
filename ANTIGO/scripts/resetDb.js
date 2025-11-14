import { execSync } from 'child_process';

try {
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Applying migrations (or creating DB)...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('DB is ready.');
} catch (e) {
  process.exit(1);
}


