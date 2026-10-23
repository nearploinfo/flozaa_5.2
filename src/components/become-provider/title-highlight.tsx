// Title's last word renders in brand color, per design — the rest stays default.
export function TitleWithHighlight({ title }: { title: string }) {
  const words = title.trim().split(" ");
  const lastWord = words.pop();
  return (
    <>
      {words.length > 0 && `${words.join(" ")} `}
      <span className="text-text-brand">{lastWord}</span>
    </>
  );
}
