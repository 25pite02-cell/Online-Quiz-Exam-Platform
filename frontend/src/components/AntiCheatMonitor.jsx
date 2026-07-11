import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * AntiCheatMonitor
 * -----------------
 * Wrap this around your exam/quiz screen.
 * It handles:
 *  1. Forcing fullscreen when the exam starts
 *  2. Detecting fullscreen exit (with grace period)
 *  3. Detecting tab-switch (visibilitychange)
 *  4. Warning system -> after N violations, auto-submits the exam
 *
 * Props:
 *  - onViolation(type, count)  -> called every time a violation happens
 *  - onAutoSubmit()            -> called when max violations reached
 *  - maxViolations             -> number of warnings allowed before auto-submit (default 3)
 *  - children                  -> your quiz UI
 */
export default function AntiCheatMonitor({
  onViolation,
  onAutoSubmit,
  maxViolations = 3,
  children,
}) {
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const containerRef = useRef(null);
  const hasSubmitted = useRef(false);

  // ---- Enter fullscreen ----
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  }, []);

  // ---- Register a violation ----
  const registerViolation = useCallback(
    (type) => {
      if (hasSubmitted.current) return;

      setViolationCount((prev) => {
        const next = prev + 1;

        if (onViolation) onViolation(type, next);

        if (next >= maxViolations) {
          hasSubmitted.current = true;
          setWarningMessage(
            `Maximum warnings (${maxViolations}) exceeded. Submitting your exam automatically.`
          );
          setShowWarning(true);
          if (onAutoSubmit) onAutoSubmit();
        } else {
          setWarningMessage(
            `Warning ${next}/${maxViolations}: ${
              type === "fullscreen"
                ? "You exited fullscreen mode."
                : "You switched tabs/windows."
            } Continued violations will auto-submit your exam.`
          );
          setShowWarning(true);
        }
        return next;
      });
    },
    [maxViolations, onViolation, onAutoSubmit]
  );

  useEffect(() => {
    // Start in fullscreen as soon as the component mounts
    enterFullscreen();

    // --- 1. Fullscreen exit detection (with grace period for mobile) ---
    let fullscreenGraceTimer = null;
    const handleFullscreenChange = () => {
      const isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;

      if (isFullscreen) {
        // Back in fullscreen before the grace timer fired - cancel it
        if (fullscreenGraceTimer) {
          clearTimeout(fullscreenGraceTimer);
          fullscreenGraceTimer = null;
        }
        return;
      }

      if (hasSubmitted.current) return;

      // Wait briefly - on mobile, exits caused by address-bar show/hide or
      // orientation changes usually resolve themselves within ~1.5s.
      fullscreenGraceTimer = setTimeout(() => {
        const stillNotFullscreen =
          !document.fullscreenElement &&
          !document.webkitFullscreenElement &&
          !document.msFullscreenElement;
        if (stillNotFullscreen && !hasSubmitted.current) {
          registerViolation("fullscreen");
        }
      }, 1500);
    };

    // --- 2. Tab switch / minimize detection ---
    const handleVisibilityChange = () => {
      if (document.hidden && !hasSubmitted.current) {
        registerViolation("tab-switch");
      }
    };

    // Note: window 'blur' event is intentionally NOT used here.
    // On mobile browsers, blur fires for address-bar show/hide, keyboard
    // open/close, notification-shade pulls, and gesture navigation —
    // none of which are actual cheating. visibilitychange (above) is the
    // reliable signal for "user actually left this tab/app".

    // --- 3. Block right-click ---
    const handleContextMenu = (e) => e.preventDefault();

    // --- 4. Block common devtools / copy shortcuts ---
    const handleKeyDown = (e) => {
      const blockedKeys = ["F12"];
      const isDevtoolsCombo =
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "u");
      const isCopyPaste =
        e.ctrlKey && ["c", "v", "x"].includes(e.key.toLowerCase());

      if (blockedKeys.includes(e.key) || isDevtoolsCombo || isCopyPaste) {
        e.preventDefault();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      if (fullscreenGraceTimer) clearTimeout(fullscreenGraceTimer);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);

      // Exit fullscreen when leaving the exam screen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enterFullscreen, registerViolation]);

  return (
    <div ref={containerRef} style={{ position: "relative", minHeight: "100vh" }}>
      {children}

      {/* Violation counter badge - always visible during exam */}
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          background: violationCount > 0 ? "#dc2626" : "#16a34a",
          color: "white",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          zIndex: 9999,
        }}
      >
        Warnings: {violationCount}/{maxViolations}
      </div>

      {/* Warning modal */}
      {showWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px 28px",
              borderRadius: 12,
              maxWidth: 420,
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 12px", color: "#dc2626" }}>
              ⚠ Proctoring Alert
            </h3>
            <p style={{ margin: "0 0 20px", color: "#374151" }}>
              {warningMessage}
            </p>
            {!hasSubmitted.current && (
              <button
                onClick={() => {
                  setShowWarning(false);
                  enterFullscreen();
                }}
                style={{
                  background: "#4f46e5",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                I Understand, Continue Exam
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
