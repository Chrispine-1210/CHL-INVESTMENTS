export async function api<T>(path:string, body?:unknown):Promise<T> {
  let response;
  try {
    response=await fetch('/api/'+path,body===undefined?{cache:'no-store'}:{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),
    });
  } catch { throw new Error('Connection interrupted. Check your connection and try again.'); }
  let data;
  try { data=await response.json(); } catch { throw new Error('This service is temporarily unavailable. Try again.'); }
  if (!response.ok) {
    const error=data && typeof data==='object' && 'error' in data && typeof data.error==='string'?data.error:null;
    throw new Error(error||'The request could not be completed.');
  }
  return data as T;
}
export const signIn=(path:string)=>'/signin-with-chatgpt?return_to='+encodeURIComponent(path);
export const signOut=(path:string)=>'/signout-with-chatgpt?return_to='+encodeURIComponent(path);
export const asMessage=(e:unknown)=>e instanceof Error?e.message:'Something went wrong. Try again.';
export type PublicData={
  settings:{intake:boolean;delivery:boolean;community:boolean;disabled:string[]};
  posts:Array<{id:string;title:string;party:string;note:string;updated:string}>;
  user:boolean;
};
export function showDate(value:string) {
  if (!value) return '—';
  if (value.length===10) return value;
  return new Intl.DateTimeFormat('en-MW',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Blantyre'}).format(new Date(value));
}
