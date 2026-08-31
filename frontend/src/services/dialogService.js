export function confirmAction(message, options = {}) {
  const { title = "Confirmar ação", confirmLabel = "Confirmar", danger = true } = options;

  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "presentation");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0, 0, 0, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "10000",
      padding: "16px",
    });

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    Object.assign(dialog.style, {
      background: "#fff",
      borderRadius: "10px",
      boxShadow: "0 16px 48px rgba(0,0,0,.25)",
      width: "min(440px, 100%)",
      padding: "24px",
      color: "#212529",
    });

    const heading = document.createElement("h2");
    heading.textContent = title;
    Object.assign(heading.style, { margin: "0 0 12px", fontSize: "20px" });
    const text = document.createElement("p");
    text.textContent = message;
    Object.assign(text.style, { margin: "0 0 22px", color: "#495057", lineHeight: "1.5" });

    const actions = document.createElement("div");
    Object.assign(actions.style, { display: "flex", justifyContent: "flex-end", gap: "10px" });
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancelar";
    Object.assign(cancel.style, {
      padding: "9px 16px",
      border: "1px solid #adb5bd",
      borderRadius: "6px",
      background: "#f8f9fa",
      color: "#343a40",
      fontWeight: "600",
      cursor: "pointer",
    });
    cancel.addEventListener("mouseenter", () => {
      cancel.style.background = "#e9ecef";
    });
    cancel.addEventListener("mouseleave", () => {
      cancel.style.background = "#f8f9fa";
    });
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.textContent = confirmLabel;
    Object.assign(confirm.style, { padding: "9px 16px", border: "none", borderRadius: "6px", background: danger ? "#dc3545" : "#0066cc", color: "#fff", cursor: "pointer" });

    const finish = (result) => {
      document.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      resolve(result);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") finish(false);
    };
    cancel.addEventListener("click", () => finish(false));
    confirm.addEventListener("click", () => finish(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) finish(false);
    });
    document.addEventListener("keydown", onKeyDown);

    actions.append(cancel, confirm);
    dialog.append(heading, text, actions);
    overlay.append(dialog);
    document.body.append(overlay);
    cancel.focus();
  });
}
