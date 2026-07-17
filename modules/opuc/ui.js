// Minimal one-file OPUc staging and upload UI.
(function () {
  "use strict";

  const root = window.Cudloun;
  const runtime = root.opuc = root.opuc || {};
  const views = new Map();
  let ctxRef = null;
  let stopAdapter = null;
  let loginState = "unknown";
  let loginProbe = null;

  runtime.ui = { start, stop };

  function start(ctx) {
    stop();
    ctxRef = ctx;
    runtime.styles.install();
    stopAdapter = runtime.adapter.start(
      (parts) => mountComposer(parts),
      (parts) => unmountComposer(parts)
    );
    ctx.log.info("OPUc composer integration ready");
    return stop;
  }

  function stop() {
    stopAdapter?.();
    stopAdapter = null;
    views.forEach((view) => view.remove());
    views.clear();
    runtime.queue?.disposeAll();
    runtime.styles?.remove();
    ctxRef = null;
    loginState = "unknown";
    loginProbe = null;
  }

  function mountComposer(parts) {
    if (!ctxRef || views.has(parts.section)) return;
    const session = runtime.queue.ensure(parts);
    const binding = runtime.adapter.bindLauncher(parts, () => chooseFile(view));
    const view = createView(session, binding);
    views.set(parts.section, view);
  }

  function unmountComposer(parts) {
    const view = views.get(parts.section);
    if (!view) return;
    view.remove();
    views.delete(parts.section);
  }

  function createView(session, binding) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.hidden = true;
    binding.row.appendChild(input);

    const panel = document.createElement("div");
    panel.className = "cudloun-opuc-panel";
    panel.dataset.open = "false";
    panel.dataset.state = "idle";

    const preview = document.createElement("img");
    preview.className = "cudloun-opuc-preview";
    preview.alt = "Selected image preview";

    const fileInfo = document.createElement("div");
    fileInfo.className = "cudloun-opuc-file-info";

    const status = document.createElement("div");
    status.className = "cudloun-opuc-status";
    status.setAttribute("aria-live", "polite");

    const actions = document.createElement("div");
    actions.className = "cudloun-opuc-actions";

    const clear = actionButton("Clear", false);
    const upload = actionButton("Upload to OPU", true);
    actions.appendChild(clear);
    actions.appendChild(upload);

    panel.appendChild(preview);
    panel.appendChild(fileInfo);
    panel.appendChild(status);
    panel.appendChild(actions);
    binding.row.insertAdjacentElement("afterend", panel);

    const view = {
      session,
      binding,
      input,
      panel,
      preview,
      fileInfo,
      status,
      clear,
      upload,
      unsubscribe: null,
      removed: false,
      remove() {
        if (this.removed) return;
        this.removed = true;
        this.unsubscribe?.();
        input.removeEventListener("change", onFileChange);
        clear.removeEventListener("click", onClear);
        upload.removeEventListener("click", onUpload);
        panel.remove();
        binding.remove();
        runtime.queue.dispose(session);
      },
    };

    const onFileChange = () => selectFile(view, input.files?.[0] || null);
    const onClear = () => {
      input.value = "";
      session.clear();
    };
    const onUpload = () => {
      if (session.status === "uploading") session.request?.abort?.();
      else uploadFile(view);
    };
    input.addEventListener("change", onFileChange);
    clear.addEventListener("click", onClear);
    upload.addEventListener("click", onUpload);
    view.unsubscribe = session.subscribe(() => render(view));
    render(view);
    return view;
  }

  function chooseFile(view) {
    if (!view.session.parts.section.isConnected) return;
    probeLogin(view);
    view.input.click();
  }

  function selectFile(view, file) {
    if (!file) return;
    try {
      const maxMb = validMaxMb(ctxRef?.storage.get("maxUploadMb", 25));
      runtime.imagePipeline.validateFile(file, maxMb * 1024 * 1024);
      view.session.setFile(file);
      prepareFirefoxFile(view, file);
    } catch (error) {
      view.input.value = "";
      view.session.update({ status: "error", message: safeMessage(error), progress: 0 });
    }
  }

  function prepareFirefoxFile(view, file) {
    const bridge = runtime.popupBridge;
    if (!bridge?.shouldUse?.()) {
      view.input.value = "";
      return;
    }

    const session = view.session;
    session.update({ status: "preparing", message: "Preparing image for Firefox…", progress: 0 });
    bridge.prepare(file)
      .then(() => {
        if (session.disposed || session.file !== file) return;
        view.input.value = "";
        if (session.status === "preparing") {
          session.update({ status: "ready", message: "Ready to upload.", progress: 0 });
        }
      })
      .catch((error) => {
        if (session.disposed || session.file !== file) return;
        session.update({ status: "error", message: safeMessage(error), progress: 0 });
      });
  }

  async function uploadFile(view) {
    const session = view.session;
    if (!session.file || session.disposed) return;

    session.update({ status: "uploading", message: "Uploading to OPU…", progress: 0 });
    const request = runtime.client.upload(session.file, {
      onProgress(event) {
        if (!event.lengthComputable || !event.total) return;
        const progress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        session.update({ progress, message: `Uploading to OPU… ${progress}%` });
      },
    });
    session.request = request;

    try {
      const url = await request.promise;
      if (session.disposed || !session.parts.section.isConnected) {
        throw new Error("The originating Kapybara composer was closed.");
      }
      session.update({ status: "inserting", message: "Adding the image to Kapybara…", uploadedUrl: url });
      await runtime.adapter.insertImageUrl(session.parts, url);
      session.update({ status: "success", message: "Uploaded and inserted. Review the post before sending.", progress: 100 });
    } catch (error) {
      const cancelled = error?.name === "AbortError";
      session.update({
        status: cancelled ? "ready" : "error",
        message: cancelled ? "Upload cancelled. The image is still staged." : safeMessage(error),
        progress: 0,
      });
    } finally {
      session.request = null;
      render(view);
    }
  }

  function render(view) {
    const session = view.session;
    const hasFile = !!session.file;
    view.panel.dataset.open = hasFile || session.status === "error" ? "true" : "false";
    view.panel.dataset.state = session.status;
    view.preview.hidden = !session.previewUrl;
    if (session.previewUrl) view.preview.src = session.previewUrl;

    const info = runtime.imagePipeline.describeFile(session.file);
    view.fileInfo.textContent = hasFile ? `${info.name} · ${info.sizeText}` : "No image selected";
    view.status.textContent = session.message || loginMessage();
    view.clear.disabled = session.status === "uploading" || session.status === "inserting";
    view.upload.disabled = !hasFile || session.status === "preparing" || session.status === "inserting" || session.status === "success";
    view.upload.textContent = session.status === "uploading" ? "Cancel upload" : session.status === "error" ? "Retry upload" : "Upload to OPU";
  }

  function probeLogin(view) {
    if (loginState !== "unknown" || loginProbe) return loginProbe;
    loginState = "checking";
    render(view);
    loginProbe = runtime.client.checkLoginStatus()
      .then((loggedIn) => {
        loginState = loggedIn ? "logged-in" : "logged-out";
        return loggedIn;
      })
      .catch(() => {
        loginState = "unavailable";
        return false;
      })
      .finally(() => {
        loginProbe = null;
        views.forEach(render);
      });
    return loginProbe;
  }

  function loginMessage() {
    if (loginState === "checking") return "Checking OPU session…";
    if (loginState === "logged-out") return "OPU is not signed in; account features may be limited.";
    if (loginState === "unavailable") return "OPU session could not be checked; upload may still work.";
    return "";
  }

  function actionButton(label, primary) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cudloun-opuc-action";
    button.dataset.primary = primary ? "true" : "false";
    button.textContent = label;
    return button;
  }

  function validMaxMb(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 100 ? parsed : 25;
  }

  function safeMessage(error) {
    return error instanceof Error && error.message ? error.message : "The OPU operation failed.";
  }
})();
