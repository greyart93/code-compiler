"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Pen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type StrokePayload = { points: { x: number; y: number }[]; color: string; erase?: boolean };

/**
 * Collaborative code buffer for a live room.
 * Local edits push to the room; remote signals replace the textarea.
 * Uses onEdit(fromRemote) so the owner can throttle server pushes.
 */
export function LiveCodeEditor({
  code,
  lang,
  onEdit,
  label,
}: {
  code: string;
  lang: string | null;
  onEdit: (text: string) => void;
  label?: string;
}) {
  const [value, setValue] = useState(code);
  const remoteRef = useRef(code);

  useEffect(() => {
    if (code !== remoteRef.current) {
      remoteRef.current = code;
      setValue(code);
    }
  }, [code]);

  const change = (v: string) => {
    remoteRef.current = v;
    setValue(v);
    onEdit(v);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{label ?? "Shared code"}</span>
        <span>{lang ?? "plain"}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => change(e.target.value)}
        spellCheck={false}
        className="h-[420px] w-full resize-none rounded-xl border bg-slate-950 p-4 font-mono text-[13px] leading-relaxed text-slate-200"
        placeholder="Write code here — both sides share this buffer."
      />
    </div>
  );
}

/** Whiteboard: both users draw; strokes sync as compact point arrays. */
export function LiveWhiteboard({
  onStroke,
  strokes,
  isHost,
}: {
  /** local user starts a stroke — parent broadcasts it */
  onStroke: (s: StrokePayload) => void;
  /** every stroke, incl. broadcast ones, so remote drawing renders */
  strokes: StrokePayload[];
  isHost: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const current = useRef<StrokePayload | null>(null);
  const [color, setColor] = useState("#ff6a1b");
  const [erasing, setErasing] = useState(false);
  const [cleared, setCleared] = useState(0);

  const toXY = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  };

  const paint = useCallback(
    (ctx: CanvasRenderingContext2D, s: StrokePayload, w: number, h: number) => {
      ctx.strokeStyle = s.erase ? "#0f1219" : s.color;
      ctx.globalCompositeOperation = s.erase ? "source-over" : "source-over";
      ctx.lineWidth = s.erase ? 24 : 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x * w, p.y * h) : ctx.lineTo(p.x * w, p.y * h)));
      ctx.stroke();
    },
    []
  );

  // repaint committed strokes + clear-state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0f1219";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((s) => paint(ctx, s, canvas.width, canvas.height));
  }, [strokes, cleared, paint]);

  const start = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drawing.current = true;
    current.current = { points: [toXY(e)], color, erase: erasing };
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !current.current) return;
    current.current.points.push(toXY(e));
    // live preview
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    paint(ctx, { points: current.current.points.slice(-2), color: current.current.color, erase: current.current.erase }, canvas.width, canvas.height);
  };

  const up = () => {
    if (!drawing.current || !current.current) return;
    drawing.current = false;
    onStroke(current.current);
    // the broadcast echo redraws it; passing it through strokes normally would
    // draw twice — dedupe by not re-painting locally, remote stroke arrives and
    // the repaint below includes it
    current.current = null;
  };

  const clear = () => {
    // clear = a special erase-signal the parent broadcasts; strokes list is
    // parent-managed, so a "clear" is just a broadcast type the parent turns
    // into a repaint with strokes=[]
    setCleared((c) => c + 1);
    onStroke({ points: [{ x: 0, y: 0 }], color: "CLEAR", erase: false });
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Button
          size="sm"
          variant={erasing ? "default" : "outline"}
          onClick={() => setErasing((e) => !e)}
          className="h-7 gap-1 text-xs"
        >
          {erasing ? <Eraser className="size-3" /> : <Pen className="size-3" />}
          {erasing ? "Erasing" : "Pen"}
        </Button>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-7 w-8 cursor-pointer rounded border"
          aria-label="Stroke color"
        />
        <Button size="sm" variant="outline" onClick={() => clear()} className="h-7 gap-1 text-xs">
          <Trash2 className="size-3" /> Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={480}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full cursor-crosshair touch-none rounded-xl border"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {isHost ? "You both can draw." : "You both can draw."} Strokes appear on both screens in real time.
      </p>
    </div>
  );
}
