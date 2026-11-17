import { Footer,Header } from '@/components/thoko-shell';
import { OrderApp } from '@/components/order-app';
export const metadata={title:'Order food'};
export default function OrderPage() {
  return <><Header page="order"/><OrderApp/><Footer/></>;
}
