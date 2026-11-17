export type Article = {
  id: string;
  title: string;
  category: string;
  intro: string;
  paragraphs: string[];
  image?: string;
  imageAlt?: string;
  updated?: string;
};

export const articles: Article[] = [
  {
    id: 'chicken-on-the-menu',
    title: 'Three ways to order chicken at Thoko',
    category: 'On the menu',
    intro: 'Choose local chicken, boiled local chicken or braai chicken. Each is K9,000 and comes with nsima.',
    image: '/media/chicken.webp',
    imageAlt: 'A tray of chicken pieces from the Thoko menu artwork',
    paragraphs: [
      'All three chicken meals are listed separately in the online menu. Choose the one you want before adding it to your basket, especially when ordering meals for several people.',
      'An extra portion of nsima, a bowl of rice or a takeaway box is K1,000 each. Soft drinks are K1,500 and 500 ml water is K1,000. You can add extras to an individual meal in the order form.',
    ],
  },
  {
    id: 'pickup-and-delivery',
    title: 'How pickup and delivery work',
    category: 'Ordering guide',
    intro: 'Collect your meal at the restaurant or ask for a delivery quote before you commit.',
    image: '/media/grill.webp',
    imageAlt: 'Grilled food from the Thoko menu artwork',
    paragraphs: [
      'For pickup, choose your meals and extras, sign in and submit your request. Check your order status before travelling. Pickup is at Shore Rubber Building on Kwenda Road in Kanengo.',
      'For delivery, enter the address and include a landmark if it helps the team find you. When Thoko sends a quote, the order shows the delivery fee and total. Accept the quote in your account to confirm the order.',
      'You can call +265 991 773 601 to check availability or get help with an order.',
    ],
  },
  {
    id: 'meet-thoko',
    title: 'The family behind the name',
    category: 'People',
    intro: 'Dorothy Chakhala founded Thoko and named the restaurant after her youngest son.',
    paragraphs: [
      'Dorothy leads the day-to-day operation, finances and business decisions. The crew includes table service, a main chef and kitchen assistant, a dedicated braai cook, cleaning and wash-up.',
      'The Kanengo dining area has six tables with four seats each. Thoko also serves takeaway customers. Visit the community page to follow restaurant updates, give feedback or register interest in future opportunities.',
    ],
  },
];

export function articleFromRecord(record: {
  id: string; title: string; party: string; note: string; updated: string;
}): Article {
  const [intro = '', ...paragraphs] = record.note.split(/\n\s*\n/).filter(Boolean);
  return {id: record.id, title: record.title, category: record.party || 'Restaurant update', intro, paragraphs, updated: record.updated};
}
