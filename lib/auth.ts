import { NextRequest } from "next/server";

// Verifica que el request tiene el cookie de sesión admin
export function verifyAdminSession(request: NextRequest): boolean {
  const token = request.cookies.get("sb-access-token")?.value;
  return !!token;
}
