"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getChatQuestionsApi } from "@/api/apiRoutes";

interface ChatQuestion {
  id: number;
  question: string;
}

export function ChatQuestions({
  type,
  title,
  onSelect,
}: {
  type: "customer_admin_support" | "pre_booking" | "post_booking";
  title: string;
  onSelect: (question: string) => void;
}) {
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the fetch when the chat type changes
    setLoading(true);
    getChatQuestionsApi({ type })
      .then((response) => {
        if (cancelled) return;
        setQuestions(Array.isArray(response?.data) ? response.data : []);
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  if (loading || questions.length === 0) return null;

  return (
    <>
      {/* Mobile: compact top-anchored row of horizontally-scrolling question pills. */}
      <div className="-m-4 flex w-full shrink-0 flex-col items-start gap-3 border-b border-border-default bg-bg-primary p-4 xl:hidden xl:m-0 xl:border-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-text-primary" />
          <span className="text-xs text-text-primary">{title}</span>
        </div>
        <div className="no-scrollbar flex w-full items-center gap-2 overflow-x-auto">
          {questions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.question)}
              className="shrink-0 whitespace-nowrap rounded-lg bg-bg-secondary px-3 py-2 text-xs text-text-primary"
            >
              {item.question}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: card pinned to the bottom of the empty message area, matching Figma. */}
      <div className="hidden w-full flex-1 flex-col justify-end xl:flex">
        <div className="flex w-full flex-col items-center gap-4 self-stretch rounded-xl border border-border-default bg-bg-secondary p-4">
          <div className="flex w-full items-center">
            <span className="flex-1 text-base font-semibold text-text-primary">{title}</span>
          </div>
          <div className="flex w-full flex-wrap content-start items-start gap-3">
            {questions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.question)}
                className="rounded-3xl border border-border-default bg-bg-primary px-4 py-2 text-start text-sm text-text-primary hover:border-border-brand"
              >
                {item.question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
