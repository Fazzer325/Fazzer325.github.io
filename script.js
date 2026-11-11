// Escribe la sesión de la terminal del hero una sola vez al cargar.
// Si el usuario prefiere menos movimiento, el contenido se muestra completo desde el inicio.
(function () {
  const output = document.getElementById("term-output");
  if (!output) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const nodes = Array.from(output.childNodes).map((n) => n.cloneNode(true));
  output.innerHTML = "";

  // Las líneas que empiezan con "$" se escriben carácter por carácter;
  // la salida de cada comando aparece de golpe, como en una terminal real.
  const steps = [];
  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      steps.push({ type: "node", node });
      return;
    }
    const text = node.textContent;
    const lines = text.split(/(\n)/);
    lines.forEach((part) => {
      if (part === "") return;
      steps.push({ type: "text", text: part });
    });
  });

  let i = 0;
  let typingCommand = false;

  function next() {
    if (i >= steps.length) return;
    const step = steps[i++];

    if (step.type === "node") {
      output.appendChild(step.node);
      if (step.node.classList && step.node.classList.contains("p")) {
        typingCommand = true;
      }
      return setTimeout(next, 0);
    }

    if (step.text === "\n") {
      output.appendChild(document.createTextNode("\n"));
      const delay = typingCommand ? 260 : 60;
      typingCommand = false;
      return setTimeout(next, delay);
    }

    if (typingCommand) {
      const chars = Array.from(step.text);
      let c = 0;
      const tick = () => {
        output.appendChild(document.createTextNode(chars[c++]));
        if (c < chars.length) setTimeout(tick, 32 + Math.random() * 40);
        else next();
      };
      return tick();
    }

    output.appendChild(document.createTextNode(step.text));
    setTimeout(next, 0);
  }

  setTimeout(next, 450);
})();
