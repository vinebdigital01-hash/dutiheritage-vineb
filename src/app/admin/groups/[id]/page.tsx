"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { PageHeader, AdminButton, Badge, useToast } from "@/components/admin/ui";
import type { CustomerDTO } from "@/lib/analytics";

export default function AdminGroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { show, Toast } = useToast();
  const [name, setName] = useState("");
  const [members, setMembers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await adminFetch<{
          group: { name: string };
          members: CustomerDTO[];
        }>(`/api/groups/${id}`);
        setName(data.group.name);
        setMembers(data.members || []);
      } catch (e) {
        show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <p className="text-[13px] animate-pulse">Loading…</p>;
  }

  return (
    <div>
      {Toast}
      <PageHeader
        title={name || "Group"}
        subtitle={`${members.length} members`}
        actions={
          <Link href="/admin/groups">
            <AdminButton variant="secondary">All groups</AdminButton>
          </Link>
        }
      />

      {members.length === 0 ? (
        <p className="text-[13px] text-neutral-500">No members match this group.</p>
      ) : (
        <ul className="bg-white border border-[var(--color-border)] rounded-xl divide-y">
          {members.map((m) => (
            <li key={m.id} className="px-5 py-3 flex justify-between items-center text-[13px]">
              <Link href={`/admin/customers/${m.id}`} className="hover:underline">
                <span className="font-medium">{m.name || m.email || m.phone}</span>
                <span className="block text-[12px] text-neutral-500">
                  {m.email || m.phone}
                </span>
              </Link>
              <Badge tone={m.ltvScore === "HIGH" ? "success" : "neutral"}>
                {m.ltvScore}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
