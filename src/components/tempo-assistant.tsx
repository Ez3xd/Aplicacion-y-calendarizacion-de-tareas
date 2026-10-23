"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, Volume2, X } from "lucide-react";

type AssistantTask = {
  id: string;
  title: string;
  time: string;
  status: string;
};

type Message = { id: number; from: "assistant" | "user"; text: string };

export function TempoAssistant({
  tasks,
  completedCount,
  onOpenTasks,
  onOpenCompleted,
  onNewTask,
}: {
  tasks: AssistantTask[];
  completedCount: number;
  onOpenTasks: () => void;
  onOpenCompleted: () => void;
  onNewTask: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: "assistant", text: "Hola, soy Luma ✦ Tu pequeña compañera para organizar el día con calma. ¿En qué te ayudo?" },
  ]);
  const pendingCount = tasks.length - completedCount;
  const suggestions = useMemo(() => ["¿Cómo va mi día?", "Ver completadas", "Añadir una tarea"], []);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-MX";
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  }

  function replyTo(text: string) {
    const normalized = text.toLowerCase();
    if (normalized.includes("complet") || normalized.includes("terminad")) {
      onOpenCompleted();
      return "Aquí tienes tus tareas completadas de hoy. Qué bonito ver lo que ya avanzaste.";
    }
    if (normalized.includes("añad") || normalized.includes("nueva") || normalized.includes("crear")) {
      onNewTask();
      return "Abrí el formulario para crear una tarea nueva. Vamos paso a paso.";
    }
    if (normalized.includes("tarea") || normalized.includes("agenda") || normalized.includes("día")) {
      onOpenTasks();
      return `Hoy tienes ${pendingCount} tarea${pendingCount === 1 ? " pendiente" : "s pendientes"} y ${completedCount} completada${completedCount === 1 ? "" : "s"}. Te muestro tu lista.`;
    }
    if (normalized.includes("progreso") || normalized.includes("avance")) {
      return `Tu progreso de hoy es de ${tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0}%. Cada paso cuenta, incluso los pequeños.`;
    }
    if (normalized.includes("hola") || normalized.includes("gracias")) {
      return "Siempre aquí para ayudarte. Puedes preguntarme por tus tareas, tu progreso o pedirme que prepare una nueva.";
    }
    return "Puedo ayudarte con tus tareas, revisar lo que completaste, consultar tu progreso o abrir el formulario para crear algo nuevo.";
  }

  function sendMessage(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const text = (preset ?? input).trim();
    if (!text) return;
    const response = replyTo(text);
    setMessages((current) => [...current, { id: Date.now(), from: "user", text }, { id: Date.now() + 1, from: "assistant", text: response }]);
    setInput("");
  }

  return (
    <>
      {open && <section className="assistant-panel" aria-label="Chat con Luma">
        <div className="assistant-header">
          <div className="assistant-identity"><span className="assistant-avatar"><Sparkles size={16} /></span><div><strong>Luma</strong><span>Tu espacio, con calma</span></div></div>
          <button type="button" className="assistant-close" onClick={() => setOpen(false)} aria-label="Cerrar chat"><X size={17} /></button>
        </div>
        <div className="assistant-messages" aria-live="polite">
          {messages.map((message) => <div className={`assistant-message ${message.from}`} key={message.id}><span>{message.text}</span>{message.from === "assistant" && <button type="button" className="assistant-speak" onClick={() => speak(message.text)} aria-label="Escuchar respuesta"><Volume2 size={13} /></button>}</div>)}
        </div>
        <div className="assistant-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => sendMessage(undefined, suggestion)}>{suggestion}</button>)}</div>
        <form className="assistant-composer" onSubmit={sendMessage}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Escribe a Luma..." aria-label="Escribe un mensaje" /><button type="submit" aria-label="Enviar mensaje"><Send size={15} /></button></form>
      </section>}
      <button type="button" className={`assistant-bubble ${open ? "is-open" : ""}`} onClick={() => setOpen((value) => !value)} aria-label={open ? "Cerrar chat con Luma" : "Abrir chat con Luma"}>
        {open ? <X size={21} /> : <><MessageCircle size={21} /><span className="assistant-bubble-spark"><Bot size={11} /></span></>}
      </button>
    </>
  );
}
