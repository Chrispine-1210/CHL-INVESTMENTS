import { dispatch } from '@/lib/thoko-server';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
export async function GET(request:Request,context:Context) { return dispatch(request,(await context.params).path); }
export async function POST(request:Request,context:Context) { return dispatch(request,(await context.params).path); }
