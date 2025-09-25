import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export async function POST(request: Request) {
  try {
    const { email, batch } = await request.json();

    // Validação única
    if (email && !batch) {
      const result = await validateEmail(email);
      return NextResponse.json(result);
    }

    // Validação em lote
    if (batch && Array.isArray(batch)) {
      const results = await Promise.all(
        batch.map(email => validateEmail(email))
      );
      return NextResponse.json({ results });
    }

    return NextResponse.json(
      { error: 'Email ou batch required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro na validação:', error);
    return NextResponse.json(
      { error: 'Erro ao validar email' },
      { status: 500 }
    );
  }
}

async function validateEmail(email: string) {
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'throwaway.email', 'yopmail.com'
  ];

  const checks = {
    syntax: false,
    domain: false,
    mx: false,
    disposable: true,
    role: true
  };

  // Validação de sintaxe
  const syntaxRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  checks.syntax = syntaxRegex.test(email);

  if (!checks.syntax) {
    return {
      valid: false,
      score: 0,
      checks,
      reason: 'Formato inválido'
    };
  }

  const [localPart, domain] = email.split('@');

  // Verificar domínio descartável
  checks.disposable = !disposableDomains.includes(domain.toLowerCase());

  // Verificar email de role
  const rolePrefixes = ['admin', 'info', 'support', 'noreply', 'no-reply'];
  checks.role = !rolePrefixes.includes(localPart.toLowerCase());

  // Verificar MX records
  try {
    const mxRecords = await resolveMx(domain);
    checks.mx = mxRecords && mxRecords.length > 0;
    checks.domain = true;
  } catch (error) {
    checks.domain = false;
    checks.mx = false;
  }

  // Calcular score
  let score = 0;
  if (checks.syntax) score += 20;
  if (checks.domain) score += 20;
  if (checks.mx) score += 30;
  if (checks.disposable) score += 20;
  if (checks.role) score += 10;

  return {
    valid: score >= 70,
    score,
    checks,
    reason: score < 70 ? 'Email suspeito ou inválido' : undefined
  };
}