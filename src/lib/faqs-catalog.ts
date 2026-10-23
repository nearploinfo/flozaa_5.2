import { getFaqsApi } from "@/api/apiRoutes";

// get_faqs paginates (limit/offset, defaults to a handful per page) — the
// site-wide FAQs page has no pagination UI, so ask for everything in one call.
const FAQS_FETCH_LIMIT = 200;

export interface FaqApi {
  id: string | number;
  question: string;
  answer: string;
  translated_question?: string;
  translated_answer?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function toFaqItem(faq: FaqApi): FaqItem {
  return {
    id: String(faq.id),
    question: faq.translated_question || faq.question,
    answer: faq.translated_answer || faq.answer,
  };
}

/** Shared by SSR (getServerSideProps) and the client fetch. */
export async function fetchFaqs(): Promise<FaqItem[]> {
  const response = await getFaqsApi({ limit: FAQS_FETCH_LIMIT, offset: 0 }).catch(() => null);
  const data = (response as { data?: unknown } | null)?.data;
  const list = Array.isArray(data) ? (data as FaqApi[]) : [];
  return list.map(toFaqItem);
}
