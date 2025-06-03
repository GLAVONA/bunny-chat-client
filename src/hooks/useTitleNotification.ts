import { useEffect, useRef, useState } from "react";

const NOTIFICATION_TITLE = "🔔 New Message - Bunny Chat";

export const useTitleNotification = (hasNewMessage: boolean) => {
  const originalTitle = useRef(document.title);
  const intervalRef = useRef<number | null>(null);
  const [isFocused, setIsFocused] = useState(document.hasFocus());

  useEffect(() => {
    // Store the original title when the component mounts
    originalTitle.current = document.title;

    // Cleanup function to restore original title and clear interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.title = originalTitle.current;
    };
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    const shouldNotify = hasNewMessage && (!isFocused || document.hidden);

    if (shouldNotify) {
      // Start flashing the title when the window is not focused
      let isNotificationTitle = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(() => {
        document.title = isNotificationTitle
          ? NOTIFICATION_TITLE
          : originalTitle.current;
        isNotificationTitle = !isNotificationTitle;
      }, 1000);
    } else {
      // Stop flashing and restore original title when the window is focused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.title = originalTitle.current;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasNewMessage, isFocused]);
};
