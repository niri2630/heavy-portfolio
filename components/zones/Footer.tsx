import { footer } from "@/lib/content";

/** Floor sticker. */
export function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 pb-14 pt-[8vh] text-center md:px-10">
      <p className="clay-sm clay-sunflower label inline-block -rotate-1 px-6 py-4 text-ink">
        {footer.sticker}
      </p>
      <p className="label-sm text-ink-soft">{footer.copyright}</p>
    </footer>
  );
}
