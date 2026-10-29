"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { accountProfileApi } from "@/apiRequests/account-profile";
import { Button } from "@repo/ui/components/shadcn/button";
import { Loader2 } from "lucide-react";

const STRAIGHT_MAX = 12;
const TURN_MIN = 18;
const POLL_MS = 550;

const PHASE_KEYS = ["phaseStraight", "phaseLeft", "phaseRight"] as const;

type StatusKey =
  | "opening"
  | "noFace"
  | "straightHint"
  | "turnLeftHint"
  | "turnRightHint"
  | "done"
  | "error";

/**
 * Thử thách người thật (active liveness) — lấy từ dự án IDVerification:
 * poll AI /liveness/pose mỗi 550ms, thu frame theo 3 phase
 * (nhìn thẳng → quay trái → quay phải). Khi hoàn tất gọi onComplete(frames);
 * frame đầu tiên (nhìn thẳng) sẽ được dùng làm selfie đối chiếu khuôn mặt.
 */
export function LivenessChallenge({
  onComplete,
}: {
  onComplete: (frames: File[]) => void;
}) {
  const t = useTranslations("accountProfile");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const dirRef = useRef(0);
  const framesRef = useRef<File[]>([]);
  const busyRef = useRef(false);
  const doneRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [status, setStatus] = useState<{ key: StatusKey; message?: string }>({
    key: "opening",
  });
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const grabFrame = useCallback((): Promise<File | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          const name = `liveness_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.7,
      );
    });
  }, []);

  const collect = useCallback(
    async (keep: number) => {
      for (let i = 0; i < keep; i++) {
        const frame = await grabFrame();
        if (frame) framesRef.current.push(frame);
        if (i < keep - 1) await new Promise((r) => setTimeout(r, 120));
      }
    },
    [grabFrame],
  );

  const tick = useCallback(async () => {
    if (busyRef.current || doneRef.current) return;
    busyRef.current = true;
    try {
      const frame = await grabFrame();
      if (!frame) return;
      const response = await accountProfileApi.livenessPose(frame);
      const pose = response.data;
      if (!pose.face_found || pose.yaw == null) {
        setStatus({ key: "noFace" });
        return;
      }
      const phase = phaseRef.current;

      if (phase === 0) {
        if (Math.abs(pose.yaw) <= STRAIGHT_MAX) {
          await collect(2);
          phaseRef.current = 1;
          setPhaseIdx(1);
          setStatus({ key: "turnLeftHint" });
        } else {
          setStatus({ key: "straightHint" });
        }
      } else if (phase === 1) {
        if (Math.abs(pose.yaw) >= TURN_MIN) {
          dirRef.current = pose.yaw > 0 ? 1 : -1;
          await collect(2);
          phaseRef.current = 2;
          setPhaseIdx(2);
          setStatus({ key: "turnRightHint" });
        } else {
          setStatus({ key: "turnLeftHint" });
        }
      } else if (phase === 2) {
        const sameDirection =
          dirRef.current > 0 ? pose.yaw >= TURN_MIN : pose.yaw <= -TURN_MIN;
        if (!sameDirection && Math.abs(pose.yaw) >= TURN_MIN) {
          await collect(2);
          doneRef.current = true;
          setPhaseIdx(3);
          setStatus({ key: "done" });
          stop();
          onComplete(framesRef.current);
        } else {
          setStatus({ key: "turnRightHint" });
        }
      }
    } catch (error) {
      setStatus({
        key: "error",
        message: (error as Error)?.message || "unknown",
      });
    } finally {
      busyRef.current = false;
    }
  }, [collect, grabFrame, onComplete, stop]);

  const start = useCallback(async () => {
    setError(null);
    framesRef.current = [];
    phaseRef.current = 0;
    dirRef.current = 0;
    doneRef.current = false;
    busyRef.current = false;
    setPhaseIdx(0);
    setStatus({ key: "opening" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      setRunning(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
      timerRef.current = window.setInterval(() => void tick(), POLL_MS);
    } catch (cameraError) {
      const message =
        (cameraError as Error)?.message ??
        (cameraError as Error)?.name ??
        "unknown";
      setError(tRef.current("liveness.cameraError", { message }));
    }
  }, [tick]);

  const done = phaseIdx >= PHASE_KEYS.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!running && !done ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void start()}
          >
            {t("liveness.start")}
          </Button>
        ) : null}
        {running ? (
          <Button type="button" variant="outline" size="sm" onClick={stop}>
            {t("liveness.stop")}
          </Button>
        ) : null}
        {done ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void start()}>
            {t("liveness.retake")}
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start gap-4">
        <div className={running ? "block" : "hidden"}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-w-[320px] -scale-x-100 rounded-lg border border-border"
          />
        </div>
        {running || done ? (
          <div className="min-w-[200px] space-y-2">
            <ol className="ml-5 list-decimal space-y-1 text-sm">
              {PHASE_KEYS.map((phaseKey, index) => (
                <li
                  key={phaseKey}
                  className={
                    index === phaseIdx
                      ? "font-semibold text-foreground"
                      : index > phaseIdx
                        ? "text-muted-foreground opacity-60"
                        : "text-foreground"
                  }
                >
                  {t(`liveness.${phaseKey}`)}
                  {index < phaseIdx ? " ✓" : ""}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">
              {status.key === "error"
                ? t("liveness.error", { message: status.message ?? "" })
                : t(`liveness.${status.key}`)}
            </p>
          </div>
        ) : null}
      </div>

      {running ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          {t("liveness.framesHint")}
        </p>
      ) : null}
    </div>
  );
}
