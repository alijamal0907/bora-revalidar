import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Simplificar: não verificar autenticação no middleware
  // Deixar a verificação apenas no lado do cliente
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/home', '/estudar', '/simulados', '/premium'],
};
