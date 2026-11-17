import { Footer,Header } from '@/components/thoko-shell';
import {phone,tel} from '@/lib/thoko';
export const metadata={title:'Privacy'};
export default function PrivacyPage(){return <><Header/><main className="wrap section"><div className="page-heading"><h1>Privacy at Thoko</h1></div>
  <article className="paper-panel prose"><h2>Orders and account details</h2><p>Thoko uses your signed-in account identifier to keep your orders accessible to you. For an order request, we store the name, telephone number, items and notes you supply. A delivery address is collected only for delivery requests.</p>
    <h2>Community requests</h2><p>When you submit an interest or private feedback, Thoko stores your account email, interest and message to review and respond. You can withdraw your interest on the Community page.</p>
    <h2>Access and requests</h2><p>Staff access is limited by role. Please avoid putting sensitive personal information in order notes or community messages. Contact Thoko at <a href={'tel:'+tel}>{phone}</a> to ask about access, correction or removal. Some order or payment records may be retained for bookkeeping and dispute resolution.</p>
  </article></main><Footer/></>;}
