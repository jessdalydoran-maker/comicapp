import { ShopDetailClient } from "@/components/shop/ShopDetailClient";

interface ShopDetailPageProps {
  params: { id: string };
}

export default function ShopDetailPage({ params }: ShopDetailPageProps) {
  return <ShopDetailClient id={params.id} />;
}
