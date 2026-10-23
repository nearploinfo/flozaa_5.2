"use client";

import { useEffect, useMemo, useState } from "react";
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getTransactionApi, type TransactionApi, type TransactionStatus } from "@/api/apiRoutes";
import { useShowPrice } from "@/lib/show-price";
import { useDateTimeFormatter } from "@/lib/use-date-time-formatter";
import { NoDataFoundState } from "@/components/ui/no-data-found-state";
import { useTranslation } from "@/lib/i18n/translation-context";
import ProfileLayout from "./ProfileLayout";

const PAGE_SIZE = 10;

type NormalizedStatus = "success" | "pending" | "failed";

const STATUS_STYLE: Record<NormalizedStatus, string> = {
  success: "bg-alert-success-bg text-alert-success-text",
  pending: "bg-alert-warning-bg text-alert-warning-text",
  failed: "bg-alert-error-bg text-alert-error-text",
};

// The backend's `status`/`translated_status` fields aren't a reliable
// closed set in practice (gateways surface their own raw strings like
// "succeeded" or "processed") — normalize to the 3 tones we actually style.
const SUCCESS_STATUSES = new Set(["success", "completed", "succeeded", "processed", "paid"]);
const FAILED_STATUSES = new Set(["failed", "cancelled", "canceled", "declined", "error"]);

function normalizeTransactionStatus(status: TransactionStatus | string): NormalizedStatus {
  const value = status.toLowerCase();
  if (SUCCESS_STATUSES.has(value)) return "success";
  if (FAILED_STATUSES.has(value)) return "failed";
  return "pending";
}

function paymentMethodLabel(type: string): string {
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : "-";
}

const HEADER_CELL = "text-sm font-medium text-text-inverse-dark";
const ROW_CELL = "text-sm text-text-primary";

/* ─── Desktop row ─── */
function TransactionRow({ transaction }: { transaction: TransactionApi }) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateTimeFormatter();
  const amountText = useShowPrice(
    Number(transaction.amount),
    transaction.currency_symbol ? { symbol: transaction.currency_symbol, decimalPlaces: transaction.currency_decimal_places } : undefined
  );
  const normalizedStatus = normalizeTransactionStatus(transaction.status);
  const statusClass = STATUS_STYLE[normalizedStatus];

  return (
    <div className="flex w-full items-center gap-6 overflow-hidden border-b border-border-default p-4 last:border-b-0">
      <div className={`w-24 shrink-0 ${ROW_CELL}`}>{transaction.order_id}</div>
      <div className={`flex-1 truncate ${ROW_CELL}`}>{transaction.txn_id || "-"}</div>
      <div className={`w-40 shrink-0 ${ROW_CELL}`}>{paymentMethodLabel(transaction.type)}</div>
      <div className={`flex-1 ${ROW_CELL}`}>{formatDateTime(transaction.transaction_date)}</div>
      <div className={`w-32 shrink-0 ${ROW_CELL}`}>{amountText}</div>
      <div className="w-24 shrink-0">
        <span className={`inline-flex rounded-lg px-3 py-1 text-sm ${statusClass}`}>
          {t(`bookings.detail.paymentStatus.${normalizedStatus}`)}
        </span>
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-6 border-b border-border-default p-4 last:border-b-0">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-lg" />
    </div>
  );
}

/* ─── Mobile card ─── */
function MobileTransactionCard({ transaction }: { transaction: TransactionApi }) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateTimeFormatter();
  const amountText = useShowPrice(
    Number(transaction.amount),
    transaction.currency_symbol ? { symbol: transaction.currency_symbol, decimalPlaces: transaction.currency_decimal_places } : undefined
  );
  const normalizedStatus = normalizeTransactionStatus(transaction.status);
  const statusClass = STATUS_STYLE[normalizedStatus];
  const isNegative = normalizedStatus === "failed";

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-border-default bg-bg-primary p-4">
      {/* Transaction ID + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary">{t("account.paymentHistory.transactionId")}</span>
          <span className="break-all text-sm font-medium text-blue-500">{transaction.txn_id || "-"}</span>
        </div>
        <span className={`mt-0.5 shrink-0 rounded-lg px-3 py-1 text-xs font-medium ${statusClass}`}>
          {t(`bookings.detail.paymentStatus.${normalizedStatus}`)}
        </span>
      </div>

      {/* Order ID */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-text-secondary">{t("account.paymentHistory.orderId")}</span>
        <span className="text-sm font-medium text-text-primary">{transaction.order_id}</span>
      </div>

      {/* Date */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-text-secondary">{t("account.paymentHistory.transactionDate")}</span>
        <span className="text-sm text-text-primary">{formatDateTime(transaction.transaction_date)}</span>
      </div>

      {/* Payment Method */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-text-secondary">{t("account.paymentHistory.paymentMethod")}</span>
        <span className="text-sm font-medium text-text-primary">{paymentMethodLabel(transaction.type)}</span>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between border-t border-border-default pt-3">
        <span className="text-sm text-text-secondary">{t("account.paymentHistory.amount")}</span>
        <span className={`text-sm font-semibold ${isNegative ? "text-alert-error-text" : "text-text-primary"}`}>
          {isNegative ? `- ${amountText}` : amountText}
        </span>
      </div>
    </div>
  );
}

function MobileTransactionCardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-border-default bg-bg-primary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center justify-between border-t border-border-default pt-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

type FilterTab = "all" | NormalizedStatus;

export function PaymentHistoryView() {
  const { t } = useTranslation();
  const title = t("account.paymentHistory.title");

  const [transactions, setTransactions] = useState<TransactionApi[] | null>(null);
  const [total, setTotal] = useState(0);
  // Backend reports these as running totals across the whole account, not
  // just the current page — the tab counts below have to read them straight
  // from the response instead of counting whatever page happens to be loaded.
  const [statusCounts, setStatusCounts] = useState({ success: 0, failed: 0, pending: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    let cancelled = false;
    // Show the loading state on every page change too, not just the initial
    // mount (which already defaults `loading` to true) — there's no way to
    // derive "a fetch for this page is in flight" from render alone.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getTransactionApi({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }).then((response) => {
      if (cancelled) return;
      setTransactions(response?.data ?? []);
      setTotal(response?.total ?? 0);
      setStatusCounts({
        success: response?.success_transactions_count ?? 0,
        failed: response?.failed_transactions_count ?? 0,
        pending: response?.pending_transactions_count ?? 0,
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = useMemo(() => {
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const end = Math.min(totalPages, start + 5);
    return Array.from({ length: end - start }, (_, index) => start + index);
  }, [page, totalPages]);

  /* ─── Mobile filter counts — from the response's running totals, not the loaded page ─── */
  const counts = { all: total, ...statusCounts };

  const filteredTransactions = useMemo(() => {
    if (!transactions) return null;
    if (activeTab === "all") return transactions;
    return transactions.filter((tx) => normalizeTransactionStatus(tx.status) === activeTab);
  }, [transactions, activeTab]);

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: `All (${counts.all})`, count: counts.all },
    { key: "success", label: `Success (${counts.success})`, count: counts.success },
    { key: "failed", label: `Failed (${counts.failed})`, count: counts.failed },
    { key: "pending", label: `Pending (${counts.pending})`, count: counts.pending },
  ];

  return (
    <>
      <PageBreadcrumb title={title} items={[{ label: title }]} />
      <ProfileLayout title={title}>
        {/* ── Desktop table (lg+) ── */}
        <div className="hidden w-full flex-1 flex-col items-start rounded-xl border border-border-default bg-bg-primary xl:flex">
          <div className="flex w-full items-center justify-center gap-4 border-b border-border-default p-6">
            <span className="flex-1 text-xl font-medium text-text-primary">{title}</span>
          </div>

          <div className="flex w-full flex-col items-start overflow-hidden p-6">
            {!loading && (!transactions || transactions.length === 0) ? (
              <NoDataFoundState
                title={t("account.paymentHistory.empty")}
                description={t("account.paymentHistory.emptyDescription")}
                className="w-full"
              />
            ) : (
              <div className="flex w-full flex-col items-start overflow-x-auto rounded-lg border border-border-default">
                <div className="min-w-[900px] w-full">
                  <div className="flex w-full items-center gap-6 overflow-hidden rounded-t-lg bg-bg-inverse p-4">
                    <div className={`w-24 shrink-0 ${HEADER_CELL}`}>{t("account.paymentHistory.orderId")}</div>
                    <div className={`flex-1 ${HEADER_CELL}`}>{t("account.paymentHistory.transactionId")}</div>
                    <div className={`w-40 shrink-0 ${HEADER_CELL}`}>{t("account.paymentHistory.paymentMethod")}</div>
                    <div className={`flex-1 ${HEADER_CELL}`}>{t("account.paymentHistory.transactionDate")}</div>
                    <div className={`w-32 shrink-0 ${HEADER_CELL}`}>{t("account.paymentHistory.amount")}</div>
                    <div className={`w-24 shrink-0 ${HEADER_CELL}`}>{t("account.paymentHistory.status")}</div>
                  </div>

                  {loading
                    ? Array.from({ length: PAGE_SIZE }).map((_, index) => (
                        <TransactionRowSkeleton key={index} />
                      ))
                    : transactions?.map((transaction) => (
                        <TransactionRow key={transaction.id} transaction={transaction} />
                      ))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex w-full justify-end p-4">
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((value) => Math.max(0, value - 1));
                        }}
                        aria-disabled={page === 0}
                        className={page === 0 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {pageNumbers.map((pageNumber) => (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          isActive={pageNumber === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(pageNumber);
                          }}
                        >
                          {pageNumber + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((value) => Math.min(totalPages - 1, value + 1));
                        }}
                        aria-disabled={page >= totalPages - 1}
                        className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile cards (max-lg) ── */}
        <div className="flex w-full flex-1 flex-col xl:hidden">
          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-border-brand bg-bg-brand-subtle text-text-brand"
                    : "border-transparent bg-bg-primary text-text-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards */}
          <div className="mt-4 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <MobileTransactionCardSkeleton key={index} />
              ))
            ) : !filteredTransactions || filteredTransactions.length === 0 ? (
              <NoDataFoundState
                title={t("account.paymentHistory.empty")}
                description={t("account.paymentHistory.emptyDescription")}
                className="w-full"
              />
            ) : (
              filteredTransactions.map((transaction) => (
                <MobileTransactionCard key={transaction.id} transaction={transaction} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex w-full justify-center pt-4">
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((value) => Math.max(0, value - 1));
                      }}
                      aria-disabled={page === 0}
                      className={page === 0 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {pageNumbers.map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === page}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(pageNumber);
                        }}
                      >
                        {pageNumber + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        setPage((value) => Math.min(totalPages - 1, value + 1));
                      }}
                      aria-disabled={page >= totalPages - 1}
                      className={page >= totalPages - 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </ProfileLayout>
    </>
  );
}


