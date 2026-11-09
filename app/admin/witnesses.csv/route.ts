import { isAdmin } from '@/lib/auth';
import { listWitnesses } from '@/lib/witness';

export async function GET() {
  if (!(await isAdmin())) return new Response('unauthorized', { status: 401 });

  const rows = (await listWitnesses()).map(
    (w) => `${w.email},${w.at},${w.status ?? ''},${w.confirmedAt ?? ''},${w.via ?? ''}`,
  );
  return new Response(['email,at,status,confirmed_at,via', ...rows].join('\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="witnesses.csv"',
      'cache-control': 'no-store',
    },
  });
}
