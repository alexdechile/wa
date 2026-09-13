// File: functions/api/auth/logout.ts

import { clearSessionCookie, isSecureRequest, json } from '../../_lib/auth';

/** Cierra la sesión del panel. */
export const onRequestPost: PagesFunction = async ({ request }) => {
  const secure = isSecureRequest(request);
  return json({ success: true }, 200, {
    'Set-Cookie': clearSessionCookie(secure),
  });
};
