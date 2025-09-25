import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export class EmailValidationService {
  private disposableDomains = new Set([
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'throwaway.email', 'yopmail.com'
    // Adicionar mais conforme necessário
  ]);

  private rolePrefixes = new Set([
    'admin', 'info', 'support', 'sales', 'contact',
    'noreply', 'no-reply', 'postmaster', 'webmaster'
  ]);

  // Validação completa
  async validate(email: string): Promise<{
    valid: boolean;
    score: number;
    checks: {
      syntax: boolean;
      domain: boolean;
      mx: boolean;
      disposable: boolean;
      role: boolean;
    };
    reason?: string;
  }> {
    const checks = {
      syntax: false,
      domain: false,
      mx: false,
      disposable: true,
      role: true
    };

    let score = 0;
    let reason = '';

    // 1. Validação de sintaxe
    const syntaxRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    checks.syntax = syntaxRegex.test(email);
    if (!checks.syntax) {
      reason = 'Formato de email inválido';
      return { valid: false, score: 0, checks, reason };
    }
    score += 20;

    const [localPart, domain] = email.split('@');

    // 2. Verificar se é email de role
    const prefix = localPart.toLowerCase().split('+')[0];
    checks.role = !this.rolePrefixes.has(prefix);
    if (!checks.role) {
      score -= 10;
    } else {
      score += 20;
    }

    // 3. Verificar domínio descartável
    checks.disposable = !this.disposableDomains.has(domain.toLowerCase());
    if (!checks.disposable) {
      reason = 'Email temporário/descartável detectado';
      score -= 30;
    } else {
      score += 30;
    }

    // 4. Verificar registros MX
    try {
      const mxRecords = await resolveMx(domain);
      checks.mx = mxRecords && mxRecords.length > 0;
      checks.domain = true;
      if (checks.mx) {
        score += 30;
      } else {
        reason = 'Domínio não aceita emails';
      }
    } catch (error) {
      checks.domain = false;
      checks.mx = false;
      reason = 'Domínio inválido ou não existe';
    }

    const valid = score >= 70;

    return {
      valid,
      score,
      checks,
      reason: valid ? undefined : reason
    };
  }

  // Validação em lote
  async validateBatch(emails: string[]): Promise<Map<string, any>> {
    const results = new Map();

    // Processar em paralelo com limite
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const promises = batch.map(email =>
        this.validate(email).then(result => ({ email, result }))
      );

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ email, result }) => {
        results.set(email, result);
      });
    }

    return results;
  }

  // Limpar lista de emails
  async cleanEmailList(emails: string[]): Promise<{
    valid: string[];
    invalid: string[];
    suspicious: string[];
  }> {
    const validation = await this.validateBatch(emails);

    const valid: string[] = [];
    const invalid: string[] = [];
    const suspicious: string[] = [];

    validation.forEach((result, email) => {
      if (result.valid && result.score >= 90) {
        valid.push(email);
      } else if (result.valid && result.score >= 70) {
        suspicious.push(email);
      } else {
        invalid.push(email);
      }
    });

    return { valid, invalid, suspicious };
  }
}