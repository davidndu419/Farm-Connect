import { useEffect, useRef, useState } from "react";
import { chatImageValidationError } from "../../utils/chatImageValidation.js";

export function ChatComposer({ onSend }) {
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function submit(event) {
    event.preventDefault();
    const normalizedBody = body.trim();
    if ((!normalizedBody && !image) || sending) return;
    setSending(true);
    setError("");
    try {
      await onSend({ body: normalizedBody || null, image });
      setBody("");
      setImage(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (caught) {
      setError(caught.message ?? "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  function chooseImage(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    const validationError = chatImageValidationError(selected);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }
    setError("");
    setImage(selected);
  }

  function removeImage() {
    setImage(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="shrink-0 border-t border-ink/8 bg-[#f7f7f5]">
      {previewUrl && image ? (
        <div className="flex items-center gap-3 border-b border-ink/8 px-4 py-3">
          <div className="relative">
            <img
              className="size-20 rounded-xl object-cover shadow-sm"
              src={previewUrl}
              alt="Selected attachment preview"
            />
            <button
              className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-ink text-lg leading-none text-white shadow"
              onClick={removeImage}
              type="button"
              aria-label="Remove selected image"
            >
              ×
            </button>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{image.name}</p>
            <p className="mt-0.5 text-xs text-ink/50">
              Ready to send as an image
            </p>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="px-4 pt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <form className="flex items-end gap-2 p-3 sm:p-4" onSubmit={submit}>
        <label
          className={`grid size-11 shrink-0 place-items-center rounded-full text-ink/65 transition hover:bg-ink/8 ${
            sending ? "pointer-events-none opacity-45" : "cursor-pointer"
          }`}
          aria-label="Attach image"
        >
          <input
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            disabled={sending}
            onChange={chooseImage}
            ref={fileInput}
            type="file"
          />
          <svg
            aria-hidden="true"
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m18.4 12.6-7.1 7.1a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 1 1 5 5l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"
            />
          </svg>
        </label>
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm leading-5 shadow-sm outline-none placeholder:text-ink/35 focus:border-leaf/50"
          disabled={sending}
          maxLength="2000"
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows="1"
          value={body}
        />
        <button
          className="grid size-11 shrink-0 place-items-center rounded-full bg-leaf text-white shadow-sm transition hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={sending || (!body.trim() && !image)}
          type="submit"
          aria-label={sending ? "Sending message" : "Send"}
        >
          {sending ? (
            <span
              className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          ) : (
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m5 12-2-8 19 8-19 8 2-8Zm0 0h9"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
