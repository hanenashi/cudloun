// Per-composer OPUc session state.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};
  const byComposer = new WeakMap();
  const sessions = new Set();

  runtime.queue = {
    ensure,
    dispose,
    disposeAll,
    sessions,
  };

  function ensure(parts) {
    const key = parts?.section;
    if (!key) throw new Error("A Kapybara composer is required.");
    if (byComposer.has(key)) return byComposer.get(key);

    const session = {
      parts,
      file: null,
      previewUrl: "",
      status: "idle",
      message: "",
      progress: 0,
      uploadedUrl: "",
      request: null,
      disposed: false,
      listeners: new Set(),
      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },
      notify() {
        this.listeners.forEach((listener) => listener(this));
      },
      update(values) {
        Object.assign(this, values);
        this.notify();
      },
      setFile(file) {
        this.request?.abort?.();
        revokePreview(this);
        this.file = file;
        this.previewUrl = URL.createObjectURL(file);
        this.status = "ready";
        this.message = "Ready to upload.";
        this.progress = 0;
        this.uploadedUrl = "";
        this.request = null;
        this.notify();
      },
      clear() {
        this.request?.abort?.();
        revokePreview(this);
        this.file = null;
        this.status = "idle";
        this.message = "";
        this.progress = 0;
        this.uploadedUrl = "";
        this.request = null;
        this.notify();
      },
    };

    byComposer.set(key, session);
    sessions.add(session);
    return session;
  }

  function dispose(session) {
    if (!session || session.disposed) return;
    session.disposed = true;
    session.request?.abort?.();
    revokePreview(session);
    session.listeners.clear();
    sessions.delete(session);
    byComposer.delete(session.parts.section);
  }

  function disposeAll() {
    Array.from(sessions).forEach(dispose);
  }

  function revokePreview(session) {
    if (!session.previewUrl) return;
    URL.revokeObjectURL(session.previewUrl);
    session.previewUrl = "";
  }
})();
