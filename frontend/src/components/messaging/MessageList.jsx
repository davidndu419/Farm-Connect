import { useEffect, useRef, useState } from "react";
import { formatBubbleTime } from "../../utils/formatMessageTime.js";

export function MessageList({ messages, userId }) {
  const scrollContainer = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const element = scrollContainer.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!preview) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [preview]);

  return (
    <>
      <div
        className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] px-3 py-5 sm:px-6"
        ref={scrollContainer}
        aria-live="polite"
      >
        {!messages.length ? (
          <div className="grid h-full place-items-center">
            <p className="rounded-full bg-white/85 px-4 py-2 text-center text-sm text-ink/55 shadow-sm">
              Start the conversation about this product.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const mine = message.sender_id === userId;
              const hasMedia = Boolean(message.media_path);
              return (
                <div
                  className={`max-w-[86%] rounded-2xl p-1.5 shadow-sm sm:max-w-[72%] ${
                    mine
                      ? "ml-auto rounded-br-md bg-[#d9fdd3]"
                      : "mr-auto rounded-bl-md bg-white"
                  }`}
                  key={message.id}
                >
                  {hasMedia ? (
                    message.media_url ? (
                      <button
                        className="block overflow-hidden rounded-xl"
                        onClick={() =>
                          setPreview({
                            url: message.media_url,
                            name:
                              message.media_original_name || "Shared image"
                          })
                        }
                        type="button"
                        aria-label={`View ${
                          message.media_original_name || "shared image"
                        }`}
                      >
                        <img
                          className="max-h-80 w-full min-w-48 object-cover sm:min-w-64"
                          src={message.media_url}
                          alt={message.media_original_name || "Shared image"}
                        />
                      </button>
                    ) : (
                      <p className="rounded-xl bg-ink/5 px-4 py-8 text-center text-sm text-ink/50">
                        Image preview unavailable
                      </p>
                    )
                  ) : null}
                  {message.body ? (
                    <p className="whitespace-pre-wrap break-words px-2 pb-1 pt-2 text-[0.95rem] leading-5">
                      {message.body}
                    </p>
                  ) : null}
                  <time
                    className="block px-2 pb-1 pt-1 text-right text-[0.65rem] leading-none text-ink/45"
                    dateTime={message.created_at}
                  >
                    {formatBubbleTime(message.created_at)}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {preview ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
            onClick={() => setPreview(null)}
            type="button"
            aria-label="Close image preview"
          >
            ×
          </button>
          <img
            className="max-h-[88dvh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            src={preview.url}
            alt={preview.name}
          />
        </div>
      ) : null}
    </>
  );
}
