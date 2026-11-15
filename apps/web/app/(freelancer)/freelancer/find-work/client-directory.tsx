"use client";

import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { accountProfileApi } from "@/apiRequests/account-profile";
import { Search, ChevronRight } from "@/components/icons";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export function ClientDirectory() {
  const t = useTranslations("clientDirectory");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["client-directory", search, page],
    queryFn: async () =>
      (await accountProfileApi.findClients(search, page)).data,
    staleTime: 30_000,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(draft.trim());
  }

  return (
    <section className="space-y-5" aria-label={t("title")}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="client-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <input
            id="client-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={100}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <Button
          type="submit"
          className="h-11 rounded-full bg-emerald-600 px-5 text-white hover:bg-emerald-700"
        >
          {t("search")}
        </Button>
      </form>

      {query.isPending ? (
        <div
          className="grid gap-4 sm:grid-cols-2"
          aria-label={t("loading")}
          aria-busy="true"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-border bg-card p-8 text-center"
        >
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
          <Button
            variant="outline"
            className="mt-4 rounded-full"
            onClick={() => void query.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : query.data.data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Search className="mx-auto mb-3 size-7 text-muted-foreground" />
          <h3 className="font-semibold">{t("emptyTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
          {search && (
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => {
                setDraft("");
                setSearch("");
                setPage(1);
              }}
            >
              {t("clearSearch")}
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("results", { count: query.data.total })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {query.data.data.map((client) => {
              const name =
                client.companyName?.trim() ||
                client.displayName?.trim() ||
                t("unnamed");
              return (
                <Link
                  key={client.userId}
                  href={`/clients/${client.userId}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 shrink-0">
                      <AvatarImage
                        src={client.avatarUrl ?? undefined}
                        alt={name}
                      />
                      <AvatarFallback>
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-foreground">
                        {name}
                      </h3>
                      {client.displayName && client.displayName !== name && (
                        <p className="truncate text-xs text-muted-foreground">
                          {client.displayName}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mb-5 mt-4 line-clamp-3 text-sm text-muted-foreground">
                    {client.companyDescription?.trim() ||
                      client.bio?.trim() ||
                      t("noDescription")}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {t("viewProfile")}
                    <ChevronRight className="size-4" />
                  </span>
                </Link>
              );
            })}
          </div>
          {query.data.totalPages > 1 && (
            <nav
              aria-label={t("pagination")}
              className="flex items-center justify-between gap-3 border-t border-border pt-4"
            >
              <Button
                variant="outline"
                className="rounded-full"
                disabled={page === 1 || query.isFetching}
                onClick={() => setPage((value) => value - 1)}
              >
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("page", { page, total: query.data.totalPages })}
              </span>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={page >= query.data.totalPages || query.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                {t("next")}
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
