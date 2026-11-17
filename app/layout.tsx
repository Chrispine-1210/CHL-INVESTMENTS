import type { Metadata } from 'next';
import './globals.css';

export const metadata:Metadata={
  title:{default:'Thoko Restaurant & Takeaway | Kanengo',template:'%s | Thoko'},
  description:'Braai chicken, local chicken, beef and Malawian favourites with nsima. Explore the Thoko Restaurant menu, call to order or visit us on Kwenda Road in Kanengo, Lilongwe.',
  manifest:'/manifest.webmanifest',icons:{icon:'/media/icon.png',apple:'/media/icon.png'},
};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
