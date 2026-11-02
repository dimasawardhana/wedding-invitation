import { Suspense } from "react";
import InvitationShell from "@/components/engine/InvitationShell";

type Props = { params: Promise<{ slug: string }> };

export default async function SlugPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense>
      <InvitationShell slug={slug} />
    </Suspense>
  );
}
