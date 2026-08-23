import { spawn } from 'node:child_process';
import path from 'node:path';
import type { SatXsdValidator, XsdValidationResult } from './xsd';

export class PythonSatXsdValidator implements SatXsdValidator {
  constructor(
    private readonly pythonBin = process.env.SAT_XSD_PYTHON_BIN || 'python3',
    private readonly timeoutMs = Number(process.env.SAT_XSD_TIMEOUT_MS || 45_000),
  ) {}

  async validate(xml: string): Promise<XsdValidationResult> {
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs < 1000 || this.timeoutMs > 120000) {
      return { valid: false, messages: [{ message: 'XSD_RUNTIME_CONFIG_INVALID' }] };
    }

    const script = path.join(process.cwd(), 'scripts', 'validate_runtime_xsd.py');
    return new Promise<XsdValidationResult>((resolve) => {
      const child = spawn(this.pythonBin, [script], { stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({ valid: false, messages: [{ message: 'XSD_RUNTIME_TIMEOUT' }] });
      }, this.timeoutMs);

      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => { stdout += String(chunk).slice(0, 100_000); });
      child.stderr.on('data', (chunk) => { stderr += String(chunk).slice(0, 20_000); });
      child.on('error', () => {
        clearTimeout(timer);
        resolve({ valid: false, messages: [{ message: 'XSD_RUNTIME_PROCESS_UNAVAILABLE' }] });
      });
      child.on('close', () => {
        clearTimeout(timer);
        try {
          const parsed = JSON.parse(stdout) as XsdValidationResult;
          if (typeof parsed.valid !== 'boolean' || !Array.isArray(parsed.messages)) throw new Error('shape');
          resolve(parsed);
        } catch {
          resolve({ valid: false, messages: [{ message: stderr ? 'XSD_RUNTIME_ERROR' : 'XSD_RUNTIME_INVALID_RESPONSE' }] });
        }
      });
      child.stdin.end(xml, 'utf8');
    });
  }
}
