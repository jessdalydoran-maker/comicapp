import { ReadPageClient } from "@/components/shop/ReadPageClient";

interface ReadPageProps {
  params: { purchaseId: string };
}

export default function ReadPage({ params }: ReadPageProps) {
  return <ReadPageClient purchaseId={params.purchaseId} />;
}
