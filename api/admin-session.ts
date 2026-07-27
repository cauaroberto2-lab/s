import type { ServerResponse } from 'node:http';
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  getAdminConfigurationError,
  getAdminSession,
  readJsonBody,
  sendJson,
  type ApiRequest,
  verifyAdminToken,
} from './admin-auth';

export default async function handler(request: ApiRequest, response: ServerResponse) {
  const configurationError = getAdminConfigurationError();
  if (configurationError) {
    sendJson(response, 503, { error: 'admin_not_configured', message: configurationError });
    return;
  }

  if (request.method === 'GET') {
    const session = getAdminSession(request);
    sendJson(response, 200, { authenticated: Boolean(session), adminId: session?.adminId ?? null });
    return;
  }

  if (request.method === 'DELETE') {
    sendJson(response, 200, { authenticated: false }, { 'Set-Cookie': clearAdminSessionCookie() });
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST, DELETE');
    sendJson(response, 405, { error: 'method_not_allowed' });
    return;
  }

  try {
    const body = await readJsonBody(request) as { token?: unknown };
    if (!verifyAdminToken(body?.token)) {
      sendJson(response, 401, { error: 'invalid_credentials', message: 'Credencial administrativa inválida.' });
      return;
    }
    sendJson(response, 200, { authenticated: true }, { 'Set-Cookie': createAdminSessionCookie() });
  } catch (error) {
    sendJson(response, 400, { error: 'invalid_request', message: error instanceof Error ? error.message : 'Requisição inválida.' });
  }
}
