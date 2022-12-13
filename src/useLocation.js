import { useState, useEffect } from "react";

function getCurrentLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

const listeners = [];

/**
 * Notifies all location listeners. Can be used if the history state has been manipulated
 * in by another module. Effectively, all components using the 'useLocation' hook will
 * update.
 */
export function notify() {
  listeners.forEach((listener) => listener());
}

export function useLocation() {
  const [{ pathname, search }, setLocation] = useState(getCurrentLocation());

  useEffect(() => {
    window.addEventListener("popstate", handleChange);
    return () => window.removeEventListener("popstate", handleChange);
  }, []);

  useEffect(() => {
    listeners.push(handleChange);
    return () => listeners.splice(listeners.indexOf(handleChange), 1);
  }, []);

  function handleChange() {
    setLocation(getCurrentLocation());
  }

  function push(url) {
    window.history.pushState(null, null, url);
    notify();
  }

  function replace(url) {
    window.history.replaceState(null, null, url);
    notify();
  }

  return {
    push,
    replace,
    pathname,
    search,
  };
}
