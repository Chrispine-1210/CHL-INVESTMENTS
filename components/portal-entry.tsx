import { LockKeyhole } from 'lucide-react';
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '@/app/chatgpt-auth';
import { portalPath, visible, type View } from '@/lib/portal-access';
import { roleFor } from '@/lib/thoko-server';
import { Portal } from '@/components/portal';

export async function PortalEntry({view}:{view:View}) {
  const user=await getChatGPTUser();
  const role=await roleFor(user);
  if (user && role && visible(role,view)) {
    return <Portal view={view} member={{role,name:user.displayName,email:user.email.toLowerCase()}}/>;
  }
  const title=!user?'Staff sign-in':role?'Restricted workspace':'Staff access required';
  const message=!user?'Sign in with the ChatGPT account linked to your Thoko staff role.':
    role?'Your staff role does not have access to this workspace.':'Ask the restaurant administrator to activate your staff account.';
  return <main className="portal-access"><div className="paper-panel">
    <a className="brand" href="/"><img src="/media/logo.webp" alt=""/><span>Thoko<small>STAFF WORKSPACE</small></span></a>
    <div className="access-lock"><LockKeyhole size={25} aria-hidden="true"/></div>
    <h1>{title}</h1><p>{message}</p>
    <div className="row">
      {!user?<a className="button button-primary" href={chatGPTSignInPath(portalPath(view))} target="_top">Sign in with ChatGPT</a>:
        role?<a className="button button-primary" href="/portal">My workspace</a>:
          <a className="button button-primary" href={chatGPTSignOutPath(portalPath(view))} target="_top">Switch account</a>}
      <a className="button button-outline" href="/">Restaurant website</a>
    </div>
  </div></main>;
}
