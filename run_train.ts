import { execSync } from 'child_process';

try {
  console.log("Training model...");
  const result = execSync('python3 ml_logic.py train', { encoding: 'utf-8' });
  console.log(result);
} catch (error: any) {
  console.error("Error executing python script:");
  console.error(error.stdout || error.stderr || error.message);
}
