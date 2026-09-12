import { FormEvent, useState } from "react";
import { Bot, LoaderCircle, SendHorizonal } from "lucide-react";
import { api } from "../../lib/api";
import { MarkdownContent } from "../../components/MarkdownContent";
import { useLanguage } from "../../contexts/LanguageContext";

type Message = { role: "student" | "moni"; text: string };

export function MoniPaperAssistant({ attemptId }: { attemptId: string }) {
  const { language } = useLanguage();
  const hindi = language === "hi";
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = question.trim();
    if (message.length < 2 || sending) return;
    setQuestion("");
    setError("");
    setMessages((current) => [...current, { role: "student", text: message }]);
    setSending(true);
    try {
      const { data } = await api.post<{ answer: string }>(
        `/student/attempts/${attemptId}/review/assistant`,
        { message, language },
        { timeout: 70_000 },
      );
      if (!data.answer?.trim()) throw new Error("Moni did not return an answer.");
      setMessages((current) => [...current, { role: "moni", text: data.answer }]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : hindi
            ? "मोनी अभी जवाब नहीं दे सकी। फिर कोशिश करें।"
            : "Moni could not answer right now. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card mb-6 overflow-hidden border border-[#cfe3d8]" aria-label="Moni paper assistant">
      <div className="flex gap-4 bg-[#edf8f1] p-5 sm:p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-forest text-white">
          <Bot className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">AI Assistant</p>
          <h2 className="font-display text-xl font-extrabold text-forest">Moni</h2>
          <p className="mt-1 text-sm text-[#50635a]">
            {hindi
              ? "इस पेपर के प्रश्नों, उत्तरों और विषयों के बारे में मोनी से पूछें।"
              : "Ask Moni anything about this paper’s questions, answers, and topics."}
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {messages.length > 0 && (
          <div className="mb-5 max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl p-4 text-sm leading-6 ${message.role === "student" ? "ml-auto max-w-[85%] bg-forest text-white" : "mr-auto border border-[#d7e5de] bg-white text-[#50635a]"}`}
              >
                {message.role === "moni" ? <MarkdownContent>{message.text}</MarkdownContent> : message.text}
              </div>
            ))}
          </div>
        )}
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void submit(event)}>
          <label className="sr-only" htmlFor="moni-question">
            {hindi ? "मोनी से प्रश्न पूछें" : "Ask Moni a question"}
          </label>
          <input
            id="moni-question"
            className="input flex-1"
            maxLength={1200}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={sending}
            placeholder={hindi ? "इस पेपर के बारे में अपना प्रश्न लिखें…" : "Ask a question about this paper…"}
          />
          <button className="btn-primary" type="submit" disabled={sending || question.trim().length < 2}>
            {sending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <SendHorizonal className="h-4 w-4" aria-hidden="true" />}
            {sending ? (hindi ? "मोनी सोच रही है…" : "Moni is thinking…") : hindi ? "पूछें" : "Ask Moni"}
          </button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      </div>
    </section>
  );
}
