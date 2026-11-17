import type { Metadata } from 'next';
import './globals.css';

export const metadata:Metadata={
  title:{default:'Thoko Restaurant & Takeaway | Kanengo',template:'%s | Thoko'},
  description:'Thoko Restaurant & Takeaway in Kanengo, Lilongwe. See the menu, request pickup or delivery, and follow restaurant updates.',
  manifest:'/manifest.webmanifest',icons:{icon:'/media/icon.png',apple:'/media/icon.png'},
};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
