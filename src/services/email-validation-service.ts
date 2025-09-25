// DNS validation moved to API route for client-side compatibility

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

  // Validação completa usando API
  async validate(email: string): Promise<any> {
    // Usar a API ao invés de DNS direto
    const response = await fetch('/api/email/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    return response.json();
  }

  // Validação em lote usando API
  async validateBatch(emails: string[]): Promise<any> {
    const response = await fetch('/api/email/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch: emails })
    });

    const data = await response.json();
    return new Map(data.results.map((r: any, i: number) => [emails[i], r]));
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