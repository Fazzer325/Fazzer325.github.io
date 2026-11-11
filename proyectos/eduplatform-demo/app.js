/*
 * EduPlatform · Demo estática
 * Reproduce las pantallas principales de la plataforma de cursos (PHP + MySQL) con datos
 * de ejemplo guardados en localStorage. No se conecta a ningún servidor.
 */
(function () {
    "use strict";

    const STORAGE_KEY = "eduplatform-demo:v1";
    const SESSION_KEY = "eduplatform-demo:session";
    const app = document.getElementById("app");

    /* ------------------------------------------------------------------ */
    /* Utilidades                                                          */
    /* ------------------------------------------------------------------ */

    const pad = (n) => String(n).padStart(2, "0");
    const stamp = (daysAgo = 0, hour = 10) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hour, (daysAgo * 7) % 60, 0, 0); return d.toISOString(); };
    const fmt = (iso) => { const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const KIND = { articulo: "Artículo", video: "Video", actividad: "Actividad" };

    function markdown(src) {
        const lines = String(src || "").replace(/\r/g, "").split("\n");
        const inline = (t) => esc(t)
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\*([^*]+)\*/g, "<em>$1</em>")
            .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        let html = "";
        let list = null;
        let para = [];
        const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(" "))}</p>`; para = []; } };
        const flushList = () => { if (list) { html += `<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`; list = null; } };
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith("```")) {
                flushPara(); flushList();
                const lang = line.slice(3).trim();
                const code = [];
                while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]);
                html += `<pre><code class="language-${esc(lang)}">${esc(code.join("\n"))}</code></pre>`;
                continue;
            }
            const h = line.match(/^(#{1,3})\s+(.*)$/);
            if (h) { flushPara(); flushList(); const level = h[1].length + 1; html += `<h${level}>${inline(h[2])}</h${level}>`; continue; }
            const ul = line.match(/^\s*[-*]\s+(.*)$/);
            const ol = line.match(/^\s*\d+\.\s+(.*)$/);
            if (ul || ol) {
                flushPara();
                const tag = ul ? "ul" : "ol";
                if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
                list.items.push((ul || ol)[1]);
                continue;
            }
            if (line.startsWith("> ")) { flushPara(); flushList(); html += `<blockquote><p>${inline(line.slice(2))}</p></blockquote>`; continue; }
            if (!line.trim()) { flushPara(); flushList(); continue; }
            flushList();
            para.push(line.trim());
        }
        flushPara(); flushList();
        return html;
    }

    /* ------------------------------------------------------------------ */
    /* Datos de ejemplo                                                    */
    /* ------------------------------------------------------------------ */

    function buildSeed() {
        let seq = 1;
        const id = () => seq++;

        const users = [
            { id: id(), name: "Valeria Ortiz", email: "alumna@demo.edu", password: "demo123", role: "Alumno", phone: "33 1111 2222" },
            { id: id(), name: "Daniel Reyes", email: "ponente@demo.edu", password: "demo123", role: "Ponente", phone: "33 3333 4444" },
            { id: id(), name: "Elena Navarro", email: "elena@demo.edu", password: "demo123", role: "Ponente", phone: "" },
            { id: id(), name: "Luis Fernández", email: "luis@demo.edu", password: "demo123", role: "Alumno", phone: "" },
            { id: id(), name: "Camila Rojas", email: "camila@demo.edu", password: "demo123", role: "Alumno", phone: "" },
            { id: id(), name: "Andrés Molina", email: "andres@demo.edu", password: "demo123", role: "Alumno", phone: "" }
        ];
        const [valeria, daniel, elena, luis, camila, andres] = users;

        const lesson = (title, type, minutes, content) => ({ id: id(), title, type, minutes, content });
        const mc = (text, options, answer, points = 2) => ({ id: id(), type: "opcion", text, options, answer, points });
        const open = (text, points = 4) => ({ id: id(), type: "abierta", text, points });

        const web = {
            id: id(), code: "WEB-101", name: "Desarrollo web con HTML y CSS", category: "Programación", level: "Principiante", state: "Publicado", ponenteId: daniel.id, cupo: 40,
            description: "Construye y publica tu primera página web. Aprenderás cómo se estructura un documento HTML y cómo darle estilo con CSS moderno, paso a paso.",
            objectives: "Escribir HTML semántico.\nAplicar estilos con selectores, cascada y Flexbox.\nPublicar un sitio en GitHub Pages.",
            requirements: "Una computadora con navegador y un editor de código (VS Code recomendado).",
            modules: [
                { id: id(), title: "Fundamentos de HTML", lessons: [
                    lesson("Cómo funciona la web", "articulo", 8, "## Del navegador al servidor\n\nCuando escribes una dirección, tu navegador pide un archivo a un **servidor**. Ese archivo casi siempre es HTML.\n\n- El **HTML** describe la estructura.\n- El **CSS** describe la apariencia.\n- El **JavaScript** agrega comportamiento.\n\n> Piensa en HTML como el esqueleto, CSS como la ropa y JavaScript como los músculos."),
                    lesson("Tu primera página HTML", "video", 12, "En el video armamos un documento desde cero. Este es el resultado final:\n\n```html\n<!DOCTYPE html>\n<html lang=\"es\">\n  <head>\n    <meta charset=\"utf-8\">\n    <title>Mi primera página</title>\n  </head>\n  <body>\n    <h1>Hola, mundo</h1>\n    <p>Estoy aprendiendo HTML.</p>\n  </body>\n</html>\n```"),
                    lesson("Práctica: estructura una página", "actividad", 20, "## Instrucciones\n\nCrea una página sobre tu pasatiempo favorito que incluya:\n\n1. Un encabezado `h1` con el título.\n2. Dos secciones con `h2` y párrafos.\n3. Una lista de al menos tres elementos.\n\nPega tu código o un enlace a tu repositorio en la respuesta.")
                ] },
                { id: id(), title: "Estilos con CSS", lessons: [
                    lesson("Selectores y cascada", "articulo", 10, "## ¿Qué estilo gana?\n\nCuando dos reglas apuntan al mismo elemento, gana la más **específica**. Si empatan, gana la última.\n\n```css\np { color: gray; }\n.destacado { color: green; }\n#aviso { color: red; }\n```\n\nUn `id` pesa más que una clase, y una clase pesa más que una etiqueta."),
                    lesson("Flexbox en 10 minutos", "video", 10, "Flexbox acomoda elementos en una fila o columna y reparte el espacio entre ellos.\n\n```css\n.menu {\n  display: flex;\n  gap: 1rem;\n  justify-content: space-between;\n}\n```"),
                    lesson("Práctica: maqueta una tarjeta", "actividad", 25, "## Instrucciones\n\nMaqueta una tarjeta de perfil con foto, nombre, descripción y un botón. Usa **Flexbox** para alinear la foto y el texto.\n\nComparte tu código o una captura publicada.")
                ] }
            ],
            exam: { title: "Examen final de HTML y CSS", instructions: "Responde las cuatro preguntas. Las de opción múltiple tienen una sola respuesta correcta.", passing: 7, published: true, questions: [
                mc("¿Qué etiqueta define el título principal de una página?", { A: "<p>", B: "<h1>", C: "<title>", D: "<header>" }, "B"),
                mc("¿Qué selector tiene mayor especificidad?", { A: "p", B: ".nota", C: "#aviso", D: "*" }, "C"),
                mc("¿Qué propiedad activa Flexbox en un contenedor?", { A: "display: flex", B: "position: flex", C: "flex: 1", D: "float: left" }, "A"),
                open("Explica con tus palabras la diferencia entre HTML y CSS.")
            ] }
        };

        const sec = {
            id: id(), code: "SEC-110", name: "Fundamentos de ciberseguridad", category: "Seguridad", level: "Principiante", state: "Publicado", ponenteId: daniel.id, cupo: null,
            description: "Reconoce las amenazas más comunes en internet y aprende hábitos y herramientas para proteger tus cuentas y tus datos.",
            objectives: "Detectar correos de phishing.\nCrear contraseñas seguras y usar un gestor.\nEntender qué es el cifrado y la autenticación en dos pasos.",
            requirements: "Ninguno. Solo curiosidad.",
            modules: [
                { id: id(), title: "Amenazas comunes", lessons: [
                    lesson("Qué es el phishing", "articulo", 9, "## Engaños que parecen reales\n\nEl phishing es un mensaje que se hace pasar por una empresa o persona de confianza para robar datos.\n\nSeñales de alerta:\n\n- Urgencia exagerada (\"tu cuenta se cerrará hoy\").\n- Remitentes con dominios parecidos, como `banco-seguro.co`.\n- Enlaces que no coinciden con el texto mostrado."),
                    lesson("Contraseñas seguras", "articulo", 8, "## Largas, únicas y guardadas\n\nUna buena contraseña es **larga** (frases de 4 o más palabras), **única** para cada sitio y se guarda en un **gestor de contraseñas**.\n\n> Nunca reutilices la contraseña de tu correo: es la llave de todas tus cuentas."),
                    lesson("Práctica: analiza un correo sospechoso", "actividad", 15, "## Instrucciones\n\nBusca (o inventa) un correo sospechoso y enumera al menos **tres señales** que indiquen que es phishing. Explica qué harías para comprobarlo.")
                ] },
                { id: id(), title: "Protección básica", lessons: [
                    lesson("Autenticación en dos pasos", "video", 7, "La autenticación en dos pasos (2FA) pide un segundo factor además de la contraseña: un código de una app, una llave física o un mensaje.\n\nActívala primero en tu correo y en tus redes sociales."),
                    lesson("Cifrado para principiantes", "articulo", 11, "## Del cifrado César al HTTPS\n\nEl cifrado César desplaza cada letra un número fijo de posiciones:\n\n```python\ndef cesar(texto, k):\n    return ''.join(chr((ord(c) - 97 + k) % 26 + 97) for c in texto)\n\nprint(cesar('hola', 3))  # krod\n```\n\nHoy usamos algoritmos como **AES** y **RSA**, que protegen tus conexiones cada vez que ves el candado de HTTPS.")
                ] }
            ],
            exam: { title: "Evaluación de ciberseguridad", instructions: "Lee cada pregunta con calma.", passing: 7, published: true, questions: [
                mc("¿Cuál es una señal típica de phishing?", { A: "Un remitente conocido", B: "Urgencia exagerada", C: "Un saludo con tu nombre", D: "Un correo sin enlaces" }, "B"),
                mc("¿Qué agrega la autenticación en dos pasos?", { A: "Una contraseña más corta", B: "Un segundo factor de verificación", C: "Un antivirus", D: "Un correo de respaldo" }, "B"),
                open("¿Por qué no conviene reutilizar contraseñas?", 6)
            ] }
        };

        const python = {
            id: id(), code: "PY-100", name: "Python desde cero", category: "Programación", level: "Principiante", state: "Publicado", ponenteId: elena.id, cupo: 60,
            description: "Da tus primeros pasos en programación con Python: variables, decisiones, ciclos y funciones con ejemplos cotidianos.",
            objectives: "Escribir programas sencillos en Python.\nUsar condicionales, ciclos y funciones.",
            requirements: "Ninguno.",
            modules: [
                { id: id(), title: "Primeros pasos", lessons: [
                    lesson("Variables y tipos de datos", "articulo", 10, "## Guardar información\n\n```python\nnombre = 'Valeria'\nedad = 21\npromedio = 9.4\n```\n\nPython deduce el tipo de cada variable automáticamente."),
                    lesson("Decisiones con if", "articulo", 9, "```python\nif promedio >= 7:\n    print('Aprobado')\nelse:\n    print('Reprobado')\n```")
                ] },
                { id: id(), title: "Repetir y reutilizar", lessons: [
                    lesson("Ciclos for y while", "video", 12, "Un ciclo repite instrucciones. `for` recorre una colección y `while` se repite mientras una condición sea verdadera."),
                    lesson("Funciones", "articulo", 10, "```python\ndef saludar(nombre):\n    return f'Hola, {nombre}'\n```")
                ] }
            ],
            exam: { title: "Examen de Python básico", instructions: "Contesta las preguntas.", passing: 6, published: true, questions: [
                mc("¿Qué imprime print(2 + 3 * 2)?", { A: "10", B: "8", C: "12", D: "7" }, "B"),
                mc("¿Qué palabra define una función?", { A: "func", B: "function", C: "def", D: "lambda" }, "C"),
                open("Escribe una función que regrese el doble de un número.", 6)
            ] }
        };

        const sql = {
            id: id(), code: "BD-200", name: "Bases de datos con MySQL", category: "Datos", level: "Intermedio", state: "Publicado", ponenteId: elena.id, cupo: 30,
            description: "Diseña tablas, relaciónalas y consulta información con SQL. Incluye normalización y buenas prácticas.",
            objectives: "Diseñar un modelo relacional.\nEscribir consultas con JOIN y agregaciones.",
            requirements: "Conocer lo básico de algún lenguaje de programación.",
            modules: [
                { id: id(), title: "Modelo relacional", lessons: [
                    lesson("Tablas, llaves y relaciones", "articulo", 12, "Una **llave primaria** identifica cada fila; una **llave foránea** apunta a otra tabla."),
                    lesson("Normalización", "articulo", 14, "Normalizar evita datos repetidos y mantiene la información consistente.")
                ] },
                { id: id(), title: "Consultas", lessons: [
                    lesson("SELECT, WHERE y ORDER BY", "video", 11, "```sql\nSELECT nombre, promedio\nFROM alumnos\nWHERE promedio >= 9\nORDER BY promedio DESC;\n```"),
                    lesson("JOIN paso a paso", "articulo", 13, "```sql\nSELECT a.nombre, c.nombre AS curso\nFROM inscripciones i\nJOIN alumnos a ON a.id = i.alumno_id\nJOIN cursos c ON c.id = i.curso_id;\n```")
                ] }
            ],
            exam: { title: "Examen de MySQL", instructions: "", passing: 7, published: true, questions: [mc("¿Qué cláusula filtra filas?", { A: "ORDER BY", B: "WHERE", C: "GROUP BY", D: "FROM" }, "B")] }
        };

        const git = {
            id: id(), code: "GIT-101", name: "Introducción a Git y GitHub", category: "Programación", level: "Principiante", state: "Borrador", ponenteId: daniel.id, cupo: null,
            description: "Aprende a guardar versiones de tu código, trabajar con ramas y colaborar en GitHub.",
            objectives: "Usar commits, ramas y pull requests.",
            requirements: "",
            modules: [
                { id: id(), title: "Control de versiones", lessons: [
                    lesson("¿Por qué usar Git?", "articulo", 6, "Git guarda el historial de tu proyecto para que puedas volver atrás y colaborar sin perder trabajo."),
                    lesson("Tus primeros commits", "video", 9, "```bash\ngit init\ngit add .\ngit commit -m \"Primer commit\"\n```")
                ] }
            ],
            exam: { title: "Examen final", instructions: "", passing: 7, published: false, questions: [] }
        };

        const courses = [web, sec, python, sql, git];
        const L = (course, m, l) => course.modules[m].lessons[l].id;

        const enrollments = [
            { courseId: web.id, userId: valeria.id, completed: [L(web, 0, 0), L(web, 0, 1)], at: stamp(20) },
            { courseId: python.id, userId: valeria.id, completed: python.modules.flatMap((m) => m.lessons.map((x) => x.id)), at: stamp(35) },
            { courseId: web.id, userId: luis.id, completed: [L(web, 0, 0), L(web, 0, 1), L(web, 1, 0), L(web, 1, 1)], at: stamp(30) },
            { courseId: web.id, userId: camila.id, completed: [L(web, 0, 0), L(web, 0, 1)], at: stamp(12) },
            { courseId: web.id, userId: andres.id, completed: [L(web, 0, 0), L(web, 0, 1), L(web, 1, 0), L(web, 1, 1)], at: stamp(40) },
            { courseId: sec.id, userId: camila.id, completed: [L(sec, 0, 0)], at: stamp(5) }
        ];

        const activity = (course, lessonId, user, state, answer, comment, daysAgo) => {
            const a = { id: id(), courseId: course.id, lessonId, userId: user.id, version: 1, answer, state, comment, submittedAt: stamp(daysAgo + 1, 18), reviewedAt: state === "Enviada" ? null : stamp(daysAgo, 11), history: [] };
            a.history.push({ version: 1, state: "Enviada", actor: user.name, comment: "", answer, at: a.submittedAt });
            if (state !== "Enviada") a.history.push({ version: 1, state, actor: daniel.name, comment, answer, at: a.reviewedAt });
            return a;
        };
        const activities = [
            activity(web, L(web, 0, 2), valeria, "Aceptada", "Hice una página sobre fotografía:\n\n<h1>Fotografía urbana</h1>\n<h2>Equipo</h2> ... <h2>Consejos</h2> ...\n<ul><li>Luz natural</li><li>Regla de tercios</li><li>Paciencia</li></ul>\n\nRepositorio: github.com/valeria/foto-urbana", "¡Muy bien estructurada! Solo agrega el atributo lang al <html> la próxima vez.", 6),
            activity(web, L(web, 0, 2), luis, "Aceptada", "Página sobre ciclismo con h1, dos secciones y lista de rutas favoritas.", "Excelente uso de etiquetas semánticas.", 18),
            activity(web, L(web, 1, 2), luis, "Aceptada", "Tarjeta con display:flex, gap de 1rem y botón con hover.", "Bien resuelta.", 9),
            activity(web, L(web, 0, 2), andres, "Aceptada", "Página sobre música con secciones de géneros y artistas.", "", 25),
            activity(web, L(web, 1, 2), andres, "Aceptada", "Tarjeta de perfil con Flexbox y sombra.", "Muy limpio.", 15),
            activity(web, L(web, 0, 2), camila, "Enviada", "Mi página es sobre repostería:\n\n<h1>Repostería casera</h1>\n<h2>Recetas</h2><p>Pastel de zanahoria...</p>\n<h2>Utensilios</h2><p>Batidora, moldes...</p>\n<ul><li>Harina</li><li>Huevo</li><li>Azúcar</li></ul>", "", 1)
        ];

        const answersFor = (exam, picks, text) => Object.fromEntries(exam.questions.map((q, i) => [q.id, q.type === "abierta" ? text : picks[i]]));
        const attempts = [
            { id: id(), courseId: web.id, userId: andres.id, answers: answersFor(web.exam, ["B", "C", "A"], "HTML define la estructura y el contenido; CSS define cómo se ve: colores, tamaños y acomodo."), state: "Calificado", grade: 9.5, feedback: "Muy buen trabajo. Tu explicación es clara y precisa.", submittedAt: stamp(10, 17), gradedAt: stamp(8, 12) },
            { id: id(), courseId: web.id, userId: luis.id, answers: answersFor(web.exam, ["B", "B", "A"], "HTML es el contenido de la página y CSS el diseño."), state: "Entregado", grade: null, feedback: "", submittedAt: stamp(2, 20), gradedAt: null },
            { id: id(), courseId: python.id, userId: valeria.id, answers: answersFor(python.exam, ["B", "C"], "def doble(n):\n    return n * 2"), state: "Calificado", grade: 10, feedback: "¡Perfecto! Sigue así.", submittedAt: stamp(14, 16), gradedAt: stamp(12, 10) }
        ];

        const notifications = [
            { id: id(), userId: valeria.id, courseId: web.id, title: "Tu actividad fue aceptada", message: "Daniel Reyes revisó «Práctica: estructura una página»: ¡Muy bien estructurada! Solo agrega el atributo lang al <html> la próxima vez.", href: `#/aula/${web.id}/${L(web, 0, 2)}`, at: stamp(6, 11), read: false },
            { id: id(), userId: valeria.id, courseId: python.id, title: "Tu calificación final está lista", message: "Obtuviste 10.00 en el examen de Python básico.", href: `#/examen/${python.id}`, at: stamp(12, 10), read: true },
            { id: id(), userId: daniel.id, courseId: web.id, title: "Nueva actividad por revisar", message: "Camila Rojas entregó «Práctica: estructura una página».", href: `#/revision/${web.id}/${activities[5].id}`, at: stamp(2, 18), read: false },
            { id: id(), userId: daniel.id, courseId: web.id, title: "Examen final entregado", message: "Luis Fernández entregó el examen de HTML y CSS. Revisa sus respuestas y publica la calificación.", href: `#/revision-examen/${web.id}/${attempts[1].id}`, at: stamp(2, 20), read: false }
        ];

        return { version: 1, seq, users, courses, enrollments, activities, attempts, notifications };
    }

    /* ------------------------------------------------------------------ */
    /* Estado                                                              */
    /* ------------------------------------------------------------------ */

    let db = load();
    let flash = null;
    let memorySession = null;

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) { const data = JSON.parse(raw); if (data && data.version === 1) return data; }
        } catch (e) { /* almacenamiento no disponible */ }
        const seed = buildSeed();
        persist(seed);
        return seed;
    }
    function persist(data = db) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* sin almacenamiento */ } }
    const nextId = () => db.seq++;
    const save = (message) => { persist(); if (message) flash = message; };

    function currentUser() {
        let uid = memorySession;
        try { uid = Number(localStorage.getItem(SESSION_KEY)) || uid; } catch (e) { /* sin almacenamiento */ }
        return db.users.find((u) => u.id === uid) || null;
    }
    function setSession(uid) { memorySession = uid; try { if (uid) localStorage.setItem(SESSION_KEY, String(uid)); else localStorage.removeItem(SESSION_KEY); } catch (e) { /* sin almacenamiento */ } }

    /* ------------------------------------------------------------------ */
    /* Consultas                                                           */
    /* ------------------------------------------------------------------ */

    const course = (id) => db.courses.find((c) => c.id === Number(id));
    const user = (id) => db.users.find((u) => u.id === Number(id));
    const lessonsOf = (c) => c.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
    const totalMinutes = (c) => lessonsOf(c).reduce((s, l) => s + l.minutes, 0);
    const enrollment = (c, u) => u && db.enrollments.find((e) => e.courseId === c.id && e.userId === u.id);
    const studentsOf = (c) => db.enrollments.filter((e) => e.courseId === c.id);
    const activityOf = (c, lessonId, u) => db.activities.find((a) => a.courseId === c.id && a.lessonId === lessonId && a.userId === u.id);
    const attemptOf = (c, u) => db.attempts.find((a) => a.courseId === c.id && a.userId === u.id);
    const unreadCount = (u) => db.notifications.filter((n) => n.userId === u.id && !n.read).length;

    function progress(c, u) {
        const e = enrollment(c, u);
        const lessons = lessonsOf(c);
        if (!e) return { enrolled: false, done: [], total: lessons.length, percent: 0 };
        const done = lessons.filter((l) => (l.type === "actividad" ? ["Enviada", "Aceptada"].includes(activityOf(c, l.id, u)?.state) : e.completed.includes(l.id))).map((l) => l.id);
        return { enrolled: true, done, total: lessons.length, percent: lessons.length ? Math.floor((done.length * 100) / lessons.length) : 0 };
    }

    function notify(userId, c, title, message, href) {
        db.notifications.unshift({ id: nextId(), userId, courseId: c.id, title, message, href, at: new Date().toISOString(), read: false });
    }

    function scoreOf(c, attempt) {
        let auto = 0;
        let max = 0;
        c.exam.questions.forEach((q) => { max += q.points; if (q.type === "opcion" && attempt.answers[q.id] === q.answer) auto += q.points; });
        return { auto, max };
    }

    function missingForPublish(c) {
        const items = [];
        if (!c.name.trim() || !c.description.trim()) items.push("Escribe el título y la descripción.");
        if (!c.objectives.trim()) items.push("Indica qué podrán hacer al terminar.");
        if (!c.modules.length) items.push("Agrega al menos una sección.");
        if (c.modules.some((m) => !m.lessons.length)) items.push("Cada sección necesita al menos una clase.");
        return items;
    }

    /* ------------------------------------------------------------------ */
    /* Componentes                                                         */
    /* ------------------------------------------------------------------ */

    const notice = () => { if (!flash) return ""; const html = `<div class="alert alert-success" role="status">${esc(flash)}</div>`; flash = null; return html; };
    const empty = (title, text, action = "") => `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">↗</span><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;
    const crumbs = (...items) => `<nav class="breadcrumb" aria-label="Ruta">${items.map(([label, href], i) => (href ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`) + (i < items.length - 1 ? '<span aria-hidden="true">/</span>' : "")).join("")}</nav>`;
    const progressBar = (percent, label) => `<progress max="100" value="${percent}" aria-label="${esc(label)}">${percent}%</progress>`;

    function courseCard(c, mode = "catalogo", u = null) {
        const url = mode === "ponente" ? `#/editor/${c.id}` : `#/curso/${c.id}`;
        const p = mode === "alumno" ? progress(c, u) : null;
        const attempt = mode === "alumno" ? attemptOf(c, u) : null;
        const action = mode === "ponente" ? "Diseñar curso" : mode === "alumno" ? "Continuar curso" : "Ver temario";
        const actionUrl = mode === "alumno" ? `#/aula/${c.id}` : url;
        return `<article class="course-card"><a class="course-cover" href="${url}" tabindex="-1" aria-hidden="true"><span class="cover-letter">${esc(c.name.charAt(0).toUpperCase())}</span><span class="cover-code">${esc(c.code)}</span><span class="cover-category">${esc(c.category)}</span></a>
            <div class="course-card-body"><div class="row-between"><span class="eyebrow">${esc(c.level)}</span><span class="state state-${c.state.toLowerCase()}">${esc(c.state)}</span></div><h2><a href="${url}">${esc(c.name)}</a></h2><p class="clamp-3">${esc(c.description)}</p><p class="course-author">${esc(user(c.ponenteId)?.name ?? "Ponente por asignar")}</p><div class="course-meta"><span>${plural(lessonsOf(c).length, "lección", "lecciones")}</span><span>${plural(studentsOf(c).length, "inscrito", "inscritos")}</span></div>
            ${p ? `<div class="progress-label"><span>Tu avance</span><strong>${p.percent}%</strong></div>${progressBar(p.percent, "Avance del curso")}<p class="course-grade">${attempt && attempt.state === "Calificado" ? `Evaluación final: <strong>${attempt.grade.toFixed(2)} / 10</strong>` : "Sin evaluación final"}</p>` : ""}
            <a class="btn ${mode === "alumno" ? "btn-primary" : "btn-outline"} course-action" href="${actionUrl}">${action} <span aria-hidden="true">→</span></a>${mode === "ponente" ? `<a class="text-link course-followup" href="#/participantes/${c.id}">Alumnos y exámenes →</a>` : ""}</div></article>`;
    }

    function activityHistory(a) {
        if (!a || !a.history.length) return "";
        return `<details class="activity-history"><summary>Historial de entregas y revisiones (${a.history.length})</summary><ol>${a.history.slice().reverse().map((ev) => `<li><div class="row-between"><strong>${esc(ev.state)} · Versión ${ev.version}</strong><time>${fmt(ev.at)}</time></div><p class="muted">${esc(ev.actor)}</p>${ev.comment ? `<p class="preserve-lines feedback-note">${esc(ev.comment)}</p>` : ""}<details><summary>Ver respuesta de esta versión</summary><div class="submitted-answer preserve-lines">${esc(ev.answer)}</div></details></li>`).join("")}</ol></details>`;
    }

    /* ------------------------------------------------------------------ */
    /* Vistas públicas                                                     */
    /* ------------------------------------------------------------------ */

    function viewCatalog(query) {
        const q = (query.get("q") || "").trim().toLowerCase();
        const cat = query.get("categoria") || "";
        const level = query.get("nivel") || "";
        const published = db.courses.filter((c) => c.state === "Publicado");
        const categories = [...new Set(published.map((c) => c.category))].sort();
        const list = published.filter((c) => (!q || (c.name + " " + c.description).toLowerCase().includes(q)) && (!cat || c.category === cat) && (!level || c.level === level));
        const filtered = q || cat || level;
        return `${notice()}<section class="catalog-hero"><div><span class="eyebrow">El siguiente paso lo eliges tú</span><h1>Aprende algo que<br>te lleve más lejos.</h1><p>Encuentra un curso, conoce su temario y aprende a tu ritmo con personas que comparten lo que saben.</p><a class="text-link" href="#/catalogo" data-scroll="cursos">Encuentra tu próximo curso <span aria-hidden="true">↓</span></a></div><div class="learning-map" aria-hidden="true"><span class="map-label">TU PRÓXIMO PASO</span><span class="map-step">01 <b>Explora</b></span><span class="map-step">02 <b>Practica</b></span><span class="map-step map-step-active">03 <b>Avanza →</b></span><span class="map-caption">De la curiosidad a la práctica.</span></div></section>
            <section id="cursos" class="section-space"><div class="section-heading"><div><span class="eyebrow">Catálogo de aprendizaje</span><h2>Cursos para seguir creciendo</h2></div><span class="muted">${plural(list.length, "resultado", "resultados")}</span></div>
            <form class="catalog-filters" data-action="catalog" role="search"><div class="form-group"><label for="q">¿Qué quieres aprender?</label><input class="form-control" type="search" id="q" name="q" value="${esc(query.get("q") || "")}" maxlength="150" placeholder="Por ejemplo, desarrollo web…"></div><div class="form-group"><label for="categoria">Categoría</label><select class="form-control" id="categoria" name="categoria"><option value="">Todas las categorías</option>${categories.map((x) => `<option ${x === cat ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div><div class="form-group"><label for="nivel">Nivel</label><select class="form-control" id="nivel" name="nivel"><option value="">Todos los niveles</option>${["Principiante", "Intermedio", "Avanzado"].map((x) => `<option ${x === level ? "selected" : ""}>${x}</option>`).join("")}</select></div><button class="btn btn-primary" type="submit">Buscar cursos</button>${filtered ? `<a class="text-link" href="#/catalogo">Limpiar</a>` : ""}</form>
            ${list.length ? `<div class="course-grid">${list.map((c) => courseCard(c)).join("")}</div>` : empty("No encontramos cursos con esos filtros", "Prueba otro tema o elimina los filtros de búsqueda.")}</section>`;
    }

    function viewCourse(id) {
        const c = course(id);
        const u = currentUser();
        if (!c) return viewNotFound();
        const owner = u && u.role === "Ponente" && u.id === c.ponenteId;
        if (c.state !== "Publicado" && !owner) return viewNotFound("Este curso aún no está disponible.");
        const p = u && u.role === "Alumno" ? progress(c, u) : null;
        const seats = c.cupo ? Math.max(0, c.cupo - studentsOf(c).length) : null;
        let panel;
        if (owner) panel = `<a class="btn btn-primary" href="#/aula/${c.id}">Previsualizar aula</a><a class="btn btn-outline" href="#/editor/${c.id}">Editar curso</a>`;
        else if (p && p.enrolled) panel = `<p class="state">Ya estás inscrito · ${p.percent}% completado</p><a class="btn btn-primary" href="#/aula/${c.id}">Continuar aprendiendo</a>`;
        else if (!u) panel = `<a class="btn btn-primary" href="#/login?volver=${encodeURIComponent("#/curso/" + c.id)}">Inicia sesión para inscribirte</a><a class="text-link" href="#/registro">Crear una cuenta</a>`;
        else if (u.role === "Alumno") panel = `<button class="btn btn-primary" type="button" data-enroll="${c.id}">Inscribirme al curso →</button>`;
        else panel = `<p>La inscripción está disponible para cuentas de alumno.</p>`;
        return `${crumbs(["Cursos", "#/catalogo"], [c.category])}
            <section class="course-detail"><div><span class="eyebrow">${esc(c.level)} · ${esc(c.category)}</span><h1>${esc(c.name)}</h1><p class="lead preserve-lines">${esc(c.description)}</p><p class="course-author">Un curso de <strong>${esc(user(c.ponenteId)?.name)}</strong></p><div class="course-meta"><span>${plural(lessonsOf(c).length, "lección", "lecciones")}</span><span>${totalMinutes(c)} minutos de contenido</span><span>${esc(c.state)}</span></div></div>
            <aside class="enroll-panel"><span class="eyebrow">Tu siguiente paso</span><h2>Haz espacio para aprender.</h2><p>Consulta el temario y guarda tu lugar para acceder a todas las lecciones.</p>${seats !== null ? `<p><strong>${seats}</strong> lugares disponibles de ${c.cupo}</p>` : "<p>Sin límite de cupo</p>"}${panel}</aside></section>
            <div class="detail-columns"><section><h2>Lo que vas a aprender</h2><p class="preserve-lines">${esc(c.objectives || "El ponente está completando los objetivos del curso.")}</p><h2>Antes de comenzar</h2><p class="preserve-lines">${esc(c.requirements || "No se han indicado requisitos previos.")}</p></section>
            <section><div class="section-heading"><h2>Tu ruta de aprendizaje</h2><span class="muted">${plural(c.modules.length, "módulo", "módulos")}</span></div>${c.modules.map((m, i) => `<details class="syllabus" ${i === 0 ? "open" : ""}><summary><span class="module-number">${pad(i + 1)}</span>${esc(m.title)}<span class="muted">${plural(m.lessons.length, "lección", "lecciones")}</span></summary><ol>${m.lessons.map((l) => `<li><span>${esc(l.title)}</span><span class="muted">${l.minutes} min</span></li>`).join("")}</ol></details>`).join("")}</section></div>`;
    }

    function viewLogin(query, error = "") {
        const accounts = [
            ["alumna@demo.edu", "Valeria Ortiz · Alumna", "Inscrita en 2 cursos, con actividades y una calificación."],
            ["ponente@demo.edu", "Daniel Reyes · Ponente", "Revisa actividades, califica exámenes y edita sus cursos."]
        ];
        return `<div class="auth-wrapper"><section class="auth-card">
            <div class="auth-header"><h1>Continúa aprendiendo</h1><p>Inicia sesión para acceder a tus cursos.</p></div>
            <p class="info-note">Elige una cuenta de demostración o escribe sus datos. La contraseña de ambas es <strong>demo123</strong>.</p>
            <div class="demo-accounts">${accounts.map(([email, title, text]) => `<button class="demo-account" type="button" data-quick-login="${email}"><span><strong>${title}</strong><small>${text}</small></span><span>Entrar →</span></button>`).join("")}</div>
            ${error ? `<div class="alert alert-danger" role="alert">${esc(error)}</div>` : ""}
            <form data-action="login" data-back="${esc(query.get("volver") || "")}">
                <div class="form-group"><label class="form-label" for="email">Correo electrónico</label><input class="form-control" id="email" name="email" type="email" maxlength="150" autocomplete="username" required value="alumna@demo.edu"></div>
                <div class="form-group"><label class="form-label" for="password">Contraseña</label><input class="form-control" id="password" name="password" type="password" autocomplete="current-password" required value="demo123"></div>
                <button class="btn btn-primary" type="submit">Iniciar sesión</button>
            </form>
            <p>¿Primera vez aquí? <a href="#/registro">Crea tu cuenta</a></p>
        </section></div>`;
    }

    function viewRegister(error = "") {
        return `<div class="auth-wrapper"><section class="auth-card">
            <div class="auth-header"><h1>Crea tu cuenta</h1><p>Tu cuenta de alumno se guarda solo en este navegador.</p></div>
            ${error ? `<div class="alert alert-danger" role="alert">${esc(error)}</div>` : ""}
            <form data-action="register">
                <div class="form-group"><label class="form-label" for="name">Nombre</label><input class="form-control" id="name" name="name" required maxlength="80"></div>
                <div class="form-group"><label class="form-label" for="email">Correo electrónico</label><input class="form-control" id="email" name="email" type="email" required maxlength="150"></div>
                <div class="form-group"><label class="form-label" for="password">Contraseña</label><input class="form-control" id="password" name="password" type="password" required minlength="6"></div>
                <button class="btn btn-primary" type="submit">Crear cuenta</button>
            </form>
            <p>¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
        </section></div>`;
    }

    /* ------------------------------------------------------------------ */
    /* Vistas con sesión                                                   */
    /* ------------------------------------------------------------------ */

    function viewDashboard() {
        const u = currentUser();
        const isPonente = u.role === "Ponente";
        const list = isPonente ? db.courses.filter((c) => c.ponenteId === u.id) : db.enrollments.filter((e) => e.userId === u.id).map((e) => course(e.courseId));
        const published = list.filter((c) => c.state === "Publicado").length;
        let extra = "";
        if (isPonente) {
            const pendingActs = db.activities.filter((a) => a.state === "Enviada" && course(a.courseId).ponenteId === u.id).length;
            const pendingExams = db.attempts.filter((a) => a.state === "Entregado" && course(a.courseId).ponenteId === u.id).length;
            extra = `<div><strong>${pendingActs}</strong><span>Actividades por revisar</span></div><div><strong>${pendingExams}</strong><span>Exámenes por calificar</span></div>`;
        }
        return `<section class="dashboard-intro"><div><span class="eyebrow">${esc(u.role)} · Tu espacio</span><h1>Hola, ${esc(u.name.split(" ")[0])}.</h1><p>${isPonente ? "Lo que sabes puede abrirle camino a alguien más. Diseña tu próximo curso." : "Cada lección cuenta. Continúa donde te quedaste."}</p></div><a class="btn btn-primary" href="${isPonente ? "#/editor/nuevo" : "#/catalogo"}">${isPonente ? "+ Crear un curso" : "Explorar cursos →"}</a></section>
            ${notice()}
            <div class="metrics-strip"><div><strong>${list.length}</strong><span>${isPonente ? "Cursos creados" : "Cursos inscritos"}</span></div><div><strong>${published}</strong><span>Publicados</span></div>${extra || `<div><strong>${list.length - published}</strong><span>Borradores y archivados</span></div>`}</div>
            <section class="section-space"><div class="section-heading"><h2>${isPonente ? "Tu taller de cursos" : "Mis cursos"}</h2><a class="text-link" href="#/perfil">Editar mi perfil →</a></div>
            ${list.length ? `<div class="course-grid">${list.map((c) => courseCard(c, isPonente ? "ponente" : "alumno", u)).join("")}</div>` : empty(isPonente ? "Tu primer curso empieza con una idea" : "Tu siguiente aprendizaje está por comenzar", isPonente ? "Organiza lo que sabes en módulos, añade lecciones y compártelo." : "Explora el catálogo y elige el curso al que quieres inscribirte.", `<a class="btn btn-primary" href="${isPonente ? "#/editor/nuevo" : "#/catalogo"}">${isPonente ? "Diseñar mi primer curso" : "Explorar el catálogo"}</a>`)}</section>`;
    }

    function viewClassroom(id, lessonId) {
        const c = course(id);
        const u = currentUser();
        if (!c) return viewNotFound();
        const preview = u.role !== "Alumno";
        if (preview && c.ponenteId !== u.id) return viewNotFound("Solo el ponente del curso puede previsualizar el aula.");
        if (!preview && !enrollment(c, u)) { location.hash = `#/curso/${c.id}`; return ""; }
        const lessons = lessonsOf(c);
        const p = progress(c, u);
        let selected = lessons.find((l) => l.id === Number(lessonId));
        if (!selected) selected = lessons.find((l) => !p.done.includes(l.id)) || lessons[0];
        const attempt = preview ? null : attemptOf(c, u);
        let body = "";
        if (selected) {
            const kind = selected.type;
            const done = p.done.includes(selected.id);
            body += `<span class="eyebrow">${esc(selected.moduleTitle)} · ${KIND[kind]} · ${selected.minutes} min</span><h1>${esc(selected.title)}</h1>`;
            if (kind === "video") body += `<div class="video-placeholder" role="img" aria-label="Vista previa del video"><div><span aria-hidden="true">▶</span><p>En la plataforma real aquí se reproduce el video de la clase. En la demo se muestra su resumen debajo.</p></div></div>`;
            body += `<div class="lesson-text markdown-body">${markdown(selected.content)}</div>`;
            if (kind === "actividad") {
                if (preview) body += `<div class="activity-panel"><h2>Entrega y revisión de la práctica</h2><p>El alumno responde y envía. El ponente puede aceptar con una observación o devolver con indicaciones para corregir.</p><a class="btn btn-outline" href="#/actividades/${c.id}">Ver entregas de actividades</a></div>`;
                else {
                    const a = activityOf(c, selected.id, u);
                    const state = a?.state;
                    body += `<section class="activity-panel"><span class="eyebrow">Aprende haciendo</span><div class="row-between"><h2>${state === "Aceptada" ? "Tu actividad fue aceptada" : state === "Devuelta" ? "Corrige y vuelve a intentarlo" : a ? "Tu entrega está en revisión" : "Realiza y entrega la actividad"}</h2>${state ? `<span class="activity-status status-${state.toLowerCase()}">${esc(state)}</span>` : ""}</div>
                        ${a ? `<p class="muted">Versión ${a.version} · Entregada ${fmt(a.submittedAt)}</p>` : ""}
                        ${a && a.comment ? `<div class="feedback-note"><strong>Comentario del ponente</strong><p class="preserve-lines">${esc(a.comment)}</p></div>` : ""}
                        ${state === "Aceptada" ? `<div class="submitted-answer preserve-lines">${esc(a.answer)}</div><p>Buen trabajo. Puedes consultar tu respuesta y la revisión cuando quieras.</p>` : `<form data-action="activity" data-course="${c.id}" data-lesson="${selected.id}"><div class="form-group"><label for="respuesta-actividad">Tu respuesta o evidencia de la práctica</label><textarea class="form-control" name="answer" id="respuesta-actividad" rows="8" maxlength="60000" required>${esc(a?.answer || "")}</textarea><small>Explica lo que hiciste, incluye tu solución o pega un enlace a tu trabajo. El ponente podrá aceptarla o pedir correcciones.</small></div><button class="btn btn-primary" type="submit">${state === "Devuelta" ? "Reenviar actividad corregida" : a ? "Actualizar entrega" : "Entregar actividad"}</button></form>`}
                        ${activityHistory(a)}</section>`;
                }
            }
            if (!preview && kind !== "actividad") body += `<div class="lesson-completion"><p>${done ? "Esta clase ya forma parte de tu avance. Puedes repasarla cuando quieras." : kind === "video" ? "¿Terminaste de ver el video? Guarda tu avance." : "¿Terminaste esta parte? Guarda tu avance y sigue aprendiendo."}</p><button class="btn ${done ? "btn-outline" : "btn-primary"}" type="button" data-complete="${selected.id}" data-course="${c.id}" data-done="${done ? 1 : 0}">${done ? "Marcar como pendiente" : "Completar y continuar →"}</button></div>`;
        } else body += empty("El contenido está en preparación", "El ponente todavía no ha añadido clases.");
        if (!preview) {
            let exam;
            if (attempt && attempt.state === "Calificado") exam = `<p class="final-score">${attempt.grade.toFixed(2)} <small>/ 10</small></p><p>${attempt.grade >= c.exam.passing ? "Aprobado" : "No aprobado"} · Revisión del ponente</p><p class="preserve-lines">${esc(attempt.feedback)}</p><a class="text-link" href="#/examen/${c.id}">Ver mi evaluación →</a>`;
            else if (attempt) exam = `<p>Examen entregado. Tu calificación está pendiente de la revisión del ponente.</p><a class="text-link" href="#/examen/${c.id}">Consultar el estado de mi examen →</a>`;
            else if (p.percent === 100 && c.exam.published) exam = `<p>Completaste todas las clases. Es momento de poner a prueba lo aprendido.</p><a class="btn btn-primary" href="#/examen/${c.id}">Presentar examen final →</a>`;
            else exam = `<p>Completa las clases y entrega las actividades para desbloquear el examen. Tu avance de aprendizaje no es una calificación.</p><a class="text-link" href="#/examen/${c.id}">Ver requisitos del examen →</a>`;
            body += `<section class="grade-summary"><span class="eyebrow">Al terminar el contenido</span><h2>Tu examen final</h2>${exam}</section>`;
        }
        const examStep = preview ? "Diseño y preguntas" : attempt?.state === "Calificado" ? "Calificación publicada" : attempt ? "Entregado · En revisión" : p.percent === 100 ? "Disponible" : "Completa el contenido para desbloquearlo";
        const sidebar = `<aside class="lesson-sidebar"><span class="eyebrow">Contenido del curso</span><h2>${esc(c.name)}</h2>${preview ? "" : `<div class="progress-label"><span>${p.done.length} de ${p.total} clases</span><strong>${p.percent}%</strong></div>${progressBar(p.percent, "Progreso del contenido")}`}
            <nav aria-label="Clases y examen del curso">${c.modules.map((m, i) => `<details class="lesson-group" open><summary>${i + 1}. ${esc(m.title)}</summary><ol>${m.lessons.map((l) => { const complete = p.done.includes(l.id); const current = selected && selected.id === l.id; return `<li><a class="lesson-link ${current ? "current" : ""}" ${current ? 'aria-current="page"' : ""} href="#/aula/${c.id}/${l.id}"><span class="lesson-indicator" aria-label="${complete ? "Completada" : "Pendiente"}">${complete ? "✓" : "○"}</span><span>${esc(l.title)}<small>${KIND[l.type]} · ${l.minutes} min</small></span></a></li>`; }).join("")}</ol></details>`).join("")}
            <div class="exam-nav-step"><span class="eyebrow">Último paso</span><a class="lesson-link" href="${preview ? `#/examen-editor/${c.id}` : `#/examen/${c.id}`}"><span aria-hidden="true">→</span><span>Examen final<small>${examStep}</small></span></a></div></nav></aside>`;
        return `${crumbs(["Mi aprendizaje", "#/panel"], [c.name, `#/curso/${c.id}`])}${preview ? `<div class="info-note">Vista previa del curso. Las actividades y el examen se entregan desde una cuenta de alumno inscrito.</div>` : ""}${notice()}<div class="classroom-layout udemy-classroom"><article class="lesson-content">${body}</article>${sidebar}</div>`;
    }

    function viewExam(id) {
        const c = course(id);
        const u = currentUser();
        if (!c || !enrollment(c, u)) return viewNotFound();
        const exam = c.exam;
        const attempt = attemptOf(c, u);
        const p = progress(c, u);
        let body;
        if (attempt) {
            const graded = attempt.state === "Calificado";
            body = `<section class="exam-result"><span class="state">${esc(attempt.state)}</span><h2>${graded ? "Tu evaluación está lista" : "Tu examen está en revisión"}</h2>${graded ? `<p class="final-score">${attempt.grade.toFixed(2)} <small>/ 10</small></p><p>${attempt.grade >= exam.passing ? "Aprobado" : "No aprobado"} · Nota mínima ${exam.passing}</p><h3>Retroalimentación del ponente</h3><p class="preserve-lines">${esc(attempt.feedback || "Sin comentarios adicionales.")}</p>` : `<p>Tus respuestas ya están guardadas. La calificación aparecerá aquí cuando el ponente termine de revisarlas.</p>${user(c.ponenteId)?.email === "ponente@demo.edu" ? `<p class="info-note">En la demo puedes cerrar sesión y entrar como <strong>ponente@demo.edu</strong> para calificar este examen.</p>` : ""}`}<a class="btn btn-outline" href="#/aula/${c.id}">Volver a mis clases</a></section>`;
        } else if (!exam.published) body = empty("El ponente está preparando el examen", "Continúa con el contenido del curso. El examen aparecerá cuando esté publicado.");
        else if (p.percent < 100) body = `<div class="exam-unlock"><span class="eyebrow">Cada parte cuenta</span><h2>Completa las clases para desbloquear el examen.</h2><p>Llevas un ${p.percent}% del contenido. Mira las clases y realiza las actividades pendientes antes de presentar tu examen.</p>${progressBar(p.percent, "Avance para desbloquear el examen")}<a class="btn btn-primary" href="#/aula/${c.id}">Continuar el curso →</a></div>`;
        else body = `<p class="preserve-lines lead">${esc(exam.instructions)}</p><div class="info-note">${plural(exam.questions.length, "pregunta", "preguntas")} · Un envío · Nota mínima ${exam.passing}/10. Revisa todas tus respuestas antes de entregar; después no podrás modificarlas.</div>
            <form data-action="exam" data-course="${c.id}">${exam.questions.map((q, i) => `<fieldset class="exam-question"><legend>Pregunta ${i + 1} <span class="muted">· ${q.points} puntos</span></legend><p class="preserve-lines">${esc(q.text)}</p>${q.type === "abierta" ? `<label for="r-${q.id}">Tu respuesta</label><textarea class="form-control" name="q${q.id}" id="r-${q.id}" rows="5" required maxlength="60000"></textarea>` : `<div class="answer-options">${Object.entries(q.options).map(([k, v]) => `<label><input type="radio" name="q${q.id}" value="${k}" required><span><strong>${k}.</strong> ${esc(v)}</span></label>`).join("")}</div>`}</fieldset>`).join("")}
            <div class="exam-submit"><p>La nota final se publicará después de que el ponente revise tu entrega.</p><button class="btn btn-primary" type="submit">Entregar mi examen →</button></div></form>`;
        return `${crumbs([c.name, `#/aula/${c.id}`], ["Examen final"])}<section class="exam-page"><span class="eyebrow">Cierra tu aprendizaje</span><h1>${esc(exam.title)}</h1>${notice()}${body}</section>`;
    }

    function viewNotifications(query) {
        const u = currentUser();
        const unreadOnly = query.get("pendientes") === "1";
        const list = db.notifications.filter((n) => n.userId === u.id && (!unreadOnly || !n.read)).sort((a, b) => (a.at < b.at ? 1 : -1));
        const count = unreadCount(u);
        return `<section class="dashboard-intro"><div><span class="eyebrow">Comunicación de la plataforma</span><h1>Tus avisos, con seguimiento.</h1><p>${u.role === "Alumno" ? "Revisiones de tus actividades y comentarios del ponente." : "Entregas de tus alumnos y exámenes por calificar."}</p></div><span class="state">${count} sin leer</span></section>
            ${notice()}
            <nav class="inbox-tabs" aria-label="Filtrar notificaciones"><a class="${unreadOnly ? "" : "current"}" href="#/avisos" ${unreadOnly ? "" : 'aria-current="page"'}>Todas</a><a class="${unreadOnly ? "current" : ""}" href="#/avisos?pendientes=1" ${unreadOnly ? 'aria-current="page"' : ""}>Sin leer (${count})</a></nav>
            ${list.length ? "" : empty(unreadOnly ? "Ya estás al día" : "Tu bandeja está vacía", "Los avisos aparecerán aquí cuando haya novedades que te correspondan.")}
            <div class="notification-list">${list.map((n) => `<article class="notification-card ${n.read ? "" : "is-unread"}"><div><div class="row-between"><span class="eyebrow">${esc(course(n.courseId)?.name || "")}</span><span class="state">${n.read ? "Leída" : "Sin leer"}</span></div><h2>${esc(n.title)}</h2><p class="preserve-lines">${esc(n.message)}</p><small>${fmt(n.at)}</small></div><button class="btn btn-outline btn-sm" type="button" data-open-notice="${n.id}">Abrir seguimiento →</button></article>`).join("")}</div>`;
    }

    function viewProfile() {
        const u = currentUser();
        return `<section class="dashboard-intro"><div><span class="eyebrow">${esc(u.role)}</span><h1>Mi perfil</h1><p>Actualiza tus datos de contacto.</p></div></section>${notice()}
            <div class="auth-card" style="max-width:36rem;margin:0"><form data-action="profile"><div class="form-group"><label class="form-label" for="name">Nombre completo</label><input class="form-control" id="name" name="name" required maxlength="80" value="${esc(u.name)}"></div><div class="form-group"><label class="form-label" for="email">Correo electrónico</label><input class="form-control" id="email" value="${esc(u.email)}" disabled></div><div class="form-group"><label class="form-label" for="phone">Teléfono</label><input class="form-control" id="phone" name="phone" maxlength="20" value="${esc(u.phone || "")}"></div><button class="btn btn-primary" type="submit">Guardar cambios</button></form></div>`;
    }

    /* ---------------------------- Ponente ----------------------------- */

    function ownCourse(id) {
        const c = course(id);
        const u = currentUser();
        return c && u.role === "Ponente" && c.ponenteId === u.id ? c : null;
    }

    function viewEditor(id) {
        const isNew = id === "nuevo";
        const c = isNew ? { name: "", description: "", category: "Programación", level: "Principiante", objectives: "", requirements: "", cupo: "", state: "Borrador", modules: [] } : ownCourse(id);
        if (!c) return viewNotFound("Solo el ponente propietario puede editar este curso.");
        const missing = isNew ? ["Guarda los datos de tu curso para empezar."] : missingForPublish(c);
        const locked = !isNew && studentsOf(c).length > 0;
        const lessonForm = (moduleId) => `<form class="form-stack" data-action="lesson" data-course="${c.id}" data-module="${moduleId}"><div class="form-group"><label for="lt-${moduleId}">Título de la clase</label><input class="form-control" id="lt-${moduleId}" name="title" required maxlength="150"></div><div class="form-grid"><div class="form-group"><label for="lk-${moduleId}">Tipo</label><select class="form-control" id="lk-${moduleId}" name="type"><option value="articulo">Artículo</option><option value="video">Video</option><option value="actividad">Actividad</option></select></div><div class="form-group"><label for="lm-${moduleId}">Duración (min)</label><input class="form-control" type="number" id="lm-${moduleId}" name="minutes" min="1" max="600" value="10" required></div></div><div class="form-group"><label for="lc-${moduleId}">Contenido (Markdown)</label><textarea class="form-control" id="lc-${moduleId}" name="content" rows="5" maxlength="20000" placeholder="## Subtítulo&#10;Texto, listas y bloques de código."></textarea></div><button class="btn btn-outline btn-sm" type="submit">Guardar clase</button></form>`;
        return `${crumbs(["Mi taller", "#/panel"], [isNew ? "Nuevo curso" : "Editar curso"])}
            <div class="section-heading"><div><span class="eyebrow">Taller del ponente</span><h1>${isNew ? "Comparte lo que sabes." : esc(c.name)}</h1></div><span class="state state-${c.state.toLowerCase()}">${esc(c.state)}</span></div>
            ${notice()}
            <div class="editor-layout"><div>
            <section class="editor-section"><div class="step-heading"><span>01</span><div><h2>Dale forma a tu curso</h2><p>Una promesa clara ayuda a tus alumnos a elegir.</p></div></div>
            <form data-action="course-save" data-course="${isNew ? "" : c.id}"><div class="form-group"><label for="nombre">Título del curso</label><input class="form-control" id="nombre" name="name" maxlength="150" required value="${esc(c.name)}" placeholder="Por ejemplo, Crea tu primera web con PHP…"></div><div class="form-group"><label for="descripcion">¿De qué trata?</label><textarea class="form-control" id="descripcion" name="description" rows="4" maxlength="15000" required>${esc(c.description)}</textarea></div><div class="form-grid"><div class="form-group"><label for="categoria">Categoría</label><input class="form-control" id="categoria" name="category" required maxlength="80" list="categorias" value="${esc(c.category)}"><datalist id="categorias"><option value="Programación"><option value="Seguridad"><option value="Datos"><option value="Diseño"><option value="Negocios"></datalist></div><div class="form-group"><label for="nivel">Nivel</label><select class="form-control" id="nivel" name="level">${["Principiante", "Intermedio", "Avanzado"].map((x) => `<option ${x === c.level ? "selected" : ""}>${x}</option>`).join("")}</select></div></div><div class="form-group"><label for="objetivos">¿Qué podrán hacer al terminar?</label><textarea class="form-control" id="objetivos" name="objectives" rows="3" maxlength="10000">${esc(c.objectives)}</textarea></div><div class="form-group"><label for="requisitos">Requisitos previos (opcional)</label><textarea class="form-control" id="requisitos" name="requirements" rows="2" maxlength="10000">${esc(c.requirements)}</textarea></div><div class="form-group"><label for="cupo">Cupo (opcional)</label><input class="form-control short-input" type="number" id="cupo" name="cupo" min="1" max="100000" value="${esc(c.cupo ?? "")}"><small>Vacío significa sin límite.</small></div><button class="btn btn-primary" type="submit">${isNew ? "Crear borrador y diseñar temario" : "Guardar datos del curso"}</button></form></section>
            ${isNew ? "" : `<section class="editor-section" id="temario"><div class="step-heading"><span>02</span><div><h2>Construye la ruta de aprendizaje</h2><p>Secciones para organizar. Clases para ver, leer y hacer.</p></div></div>
                ${locked ? `<p class="info-note">Tu curso tiene alumnos inscritos. En la demo puedes agregar clases nuevas, pero no eliminar las existentes.</p>` : ""}
                ${c.modules.map((m, i) => `<article class="editor-module"><div class="row-between"><h3><span class="module-number">${i + 1}</span>${esc(m.title)}</h3></div>${m.lessons.map((l) => `<div class="editor-lesson"><div class="row-between"><span><strong>${esc(l.title)}</strong> <small>${KIND[l.type]} · ${l.minutes} min</small></span>${locked ? "" : `<button class="text-danger" type="button" data-delete-lesson="${l.id}" data-course="${c.id}">Eliminar</button>`}</div></div>`).join("")}<details class="add-lesson"><summary>+ Añadir una clase</summary>${lessonForm(m.id)}</details></article>`).join("")}
                <form class="new-module" data-action="module" data-course="${c.id}"><label for="nuevo-modulo">Nueva sección</label><div class="input-action"><input class="form-control" id="nuevo-modulo" name="title" required maxlength="150" placeholder="Por ejemplo, Fundamentos…"><button class="btn btn-outline" type="submit">+ Añadir sección</button></div></form></section>`}
            </div>
            <aside class="editor-sidebar"><section class="publish-panel"><span class="eyebrow">De la idea al aula</span><h2>${missing.length ? "Tu curso toma forma" : "Listo para compartir"}</h2><p>${missing.length ? "Completa estos pasos para abrir las inscripciones." : "Tu temario está completo. Revisa la vista del alumno y publica cuando estés listo."}</p>
                <ul class="readiness-list">${missing.length ? missing.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>✓ Datos y objetivos completos</li><li>✓ Secciones con contenido</li>"}</ul>
                ${isNew ? "" : `<a class="btn btn-outline" href="#/curso/${c.id}">Previsualizar curso →</a><a class="text-link" href="#/participantes/${c.id}">Alumnos y exámenes →</a>
                ${c.state !== "Publicado" ? `<button class="btn btn-primary" type="button" data-state="Publicado" data-course="${c.id}" ${missing.length ? "disabled" : ""}>Publicar curso</button>` : ""}${c.state === "Publicado" && !locked ? `<button class="btn btn-outline" type="button" data-state="Borrador" data-course="${c.id}">Volver a borrador</button>` : ""}<small>Al publicar, el curso aparece en el catálogo y abre inscripciones.</small>`}
            </section></aside></div>
            ${isNew ? "" : `<section class="exam-course-step"><div><span class="eyebrow">03 · Evaluación final</span><h2>Cierra el curso con un examen.</h2><p>El alumno completa tus clases, responde el examen y espera tu revisión. Tú publicas la calificación final.</p></div><div class="management-actions"><a class="btn btn-primary" href="#/examen-editor/${c.id}">Diseñar examen final →</a><a class="btn btn-outline" href="#/actividades/${c.id}">Revisar actividades</a><a class="text-link" href="#/participantes/${c.id}">Ver alumnos y entregas</a></div></section>`}`;
    }

    function viewExamEditor(id) {
        const c = ownCourse(id);
        if (!c) return viewNotFound();
        const e = c.exam;
        return `${crumbs(["Mi taller", "#/panel"], [c.name, `#/editor/${c.id}`], ["Examen final"])}
            <div class="section-heading"><div><span class="eyebrow">Evaluación final</span><h1>${esc(e.title)}</h1><p>${plural(e.questions.length, "pregunta", "preguntas")} · Nota mínima ${e.passing}/10</p></div><span class="state ${e.published ? "state-publicado" : ""}">${e.published ? "Publicado" : "Borrador"}</span></div>
            ${notice()}
            <div class="editor-layout"><div><section class="editor-section"><h2>Preguntas</h2><div class="question-list">${e.questions.map((q, i) => `<fieldset class="exam-question"><legend>Pregunta ${i + 1} <span class="muted">· ${q.points} puntos · ${q.type === "abierta" ? "Abierta" : "Opción múltiple"}</span></legend><p class="preserve-lines">${esc(q.text)}</p>${q.type === "opcion" ? `<ul>${Object.entries(q.options).map(([k, v]) => `<li>${k === q.answer ? "<strong>✓ " : ""}${k}. ${esc(v)}${k === q.answer ? "</strong>" : ""}</li>`).join("")}</ul>` : ""}</fieldset>`).join("") || `<p class="muted">Aún no hay preguntas.</p>`}</div>
            <details class="add-lesson"><summary>+ Añadir pregunta de opción múltiple</summary><form class="form-stack" data-action="question" data-course="${c.id}"><div class="form-group"><label for="qt">Enunciado</label><textarea class="form-control" id="qt" name="text" rows="2" required></textarea></div><div class="form-grid">${["A", "B", "C", "D"].map((k) => `<div class="form-group"><label for="o${k}">Opción ${k}</label><input class="form-control" id="o${k}" name="${k}" required maxlength="200"></div>`).join("")}</div><div class="form-grid"><div class="form-group"><label for="qa">Respuesta correcta</label><select class="form-control" id="qa" name="answer"><option>A</option><option>B</option><option>C</option><option>D</option></select></div><div class="form-group"><label for="qp">Puntos</label><input class="form-control" type="number" id="qp" name="points" min="1" max="20" value="2"></div></div><button class="btn btn-outline btn-sm" type="submit">Guardar pregunta</button></form></details></section></div>
            <aside class="editor-sidebar"><section class="publish-panel"><span class="eyebrow">Publicación</span><h2>${e.published ? "Disponible para tus alumnos" : "Aún no lo ven tus alumnos"}</h2><p>El examen se desbloquea cuando el alumno completa el contenido.</p>${e.questions.length ? `<button class="btn ${e.published ? "btn-outline" : "btn-primary"}" type="button" data-exam-publish="${c.id}">${e.published ? "Ocultar examen" : "Publicar examen"}</button>` : `<p class="info-note">Agrega al menos una pregunta para publicarlo.</p>`}</section></aside></div>`;
    }

    function viewActivities(id, query) {
        const c = ownCourse(id);
        if (!c) return viewNotFound();
        const state = query.get("estado") || "";
        const all = db.activities.filter((a) => a.courseId === c.id);
        const list = all.filter((a) => !state || a.state === state).sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
        const lessonTitle = (lid) => lessonsOf(c).find((l) => l.id === lid)?.title ?? "Actividad";
        return `${crumbs([c.name, `#/editor/${c.id}`], ["Actividades"])}
            <div class="section-heading"><div><span class="eyebrow">Acompaña la práctica</span><h1>Actividades y correcciones</h1><p>Revisa el trabajo, reconoce lo logrado y explica el siguiente paso.</p></div><a class="btn btn-outline" href="#/participantes/${c.id}">Alumnos y exámenes</a></div>
            ${notice()}
            <div class="metrics-strip">${[["Enviada", "Por revisar"], ["Devuelta", "En corrección"], ["Aceptada", "Aceptadas"]].map(([v, l]) => `<div><strong>${all.filter((a) => a.state === v).length}</strong><span>${l}</span></div>`).join("")}</div>
            <nav class="inbox-tabs" aria-label="Filtrar actividades">${[["", "Todas"], ["Enviada", "Por revisar"], ["Devuelta", "Devueltas"], ["Aceptada", "Aceptadas"]].map(([v, l]) => `<a class="${v === state ? "current" : ""}" href="#/actividades/${c.id}${v ? "?estado=" + v : ""}">${l}</a>`).join("")}</nav>
            ${list.length ? "" : empty(all.length ? "No hay entregas con este filtro" : "Todavía no hay entregas", all.length ? "Prueba otro estado." : "Cuando tus alumnos envíen una actividad, podrás revisarla aquí.")}
            <div class="activity-deliveries">${list.map((a) => { const s = user(a.userId); return `<article class="activity-delivery"><div><span class="activity-status status-${a.state.toLowerCase()}">${esc(a.state)}</span><h2><a href="#/revision/${c.id}/${a.id}">${esc(lessonTitle(a.lessonId))}</a></h2><p>${esc(s.name)} <span class="muted">· ${esc(s.email)}</span></p><small>Versión ${a.version} · Entregada ${fmt(a.submittedAt)}</small></div><a class="btn ${a.state === "Enviada" ? "btn-primary" : "btn-outline"}" href="#/revision/${c.id}/${a.id}">${a.state === "Enviada" ? "Revisar entrega" : "Ver entrega"} →</a></article>`; }).join("")}</div>`;
    }

    function viewActivityReview(id, deliveryId) {
        const c = ownCourse(id);
        const a = db.activities.find((x) => x.id === Number(deliveryId));
        if (!c || !a) return viewNotFound();
        const s = user(a.userId);
        const lesson = lessonsOf(c).find((l) => l.id === a.lessonId);
        const canReview = a.state === "Enviada";
        return `${crumbs(["Actividades", `#/actividades/${c.id}`], ["Revisar entrega"])}
            <div class="section-heading"><div><span class="eyebrow">${esc(c.name)}</span><h1>${esc(lesson?.title)}</h1><p>${esc(s.name)} · ${esc(s.email)}</p></div><span class="activity-status status-${a.state.toLowerCase()}">${esc(a.state)}</span></div>
            ${notice()}
            <div class="editor-layout"><section><article class="review-answer"><div class="row-between"><h2>Trabajo del alumno</h2><small>Versión ${a.version} · ${fmt(a.submittedAt)}</small></div><div class="submitted-answer preserve-lines">${esc(a.answer)}</div><a class="text-link" href="#/aula/${c.id}/${a.lessonId}">Consultar instrucciones de la actividad →</a></article>${activityHistory(a)}</section>
            <aside class="editor-sidebar"><section class="publish-panel"><span class="eyebrow">Retroalimentación del ponente</span><h2>${canReview ? "Ayúdale a dar el siguiente paso" : "Resultado de la revisión"}</h2>
            ${canReview ? `<p>Acepta el trabajo si cumple el objetivo. Si necesita cambios, explica cómo corregirlo.</p><form data-action="review" data-delivery="${a.id}"><div class="form-group"><label for="decision">Decisión</label><select class="form-control" name="decision" id="decision"><option value="Aceptada">Aceptar actividad</option><option value="Devuelta">Devolver para corregir</option></select></div><div class="form-group"><label for="comentario">Comentario o correcciones</label><textarea class="form-control" name="comment" id="comentario" rows="6" maxlength="2000"></textarea><small>Obligatorio al devolver. Al aceptar, puedes dejar una observación opcional.</small></div><button class="btn btn-primary" type="submit">Guardar revisión y avisar al alumno</button></form>` : `<p>${a.state === "Devuelta" ? "El alumno debe corregir y volver a enviar." : "Esta versión quedó aceptada."}</p>${a.comment ? `<div class="feedback-note preserve-lines">${esc(a.comment)}</div>` : ""}${a.reviewedAt ? `<small>Revisada ${fmt(a.reviewedAt)}</small>` : ""}`}
            <p class="muted">La revisión de esta práctica no cambia la calificación del examen final.</p></section></aside></div>`;
    }

    function viewParticipants(id) {
        const c = ownCourse(id);
        if (!c) return viewNotFound();
        const students = studentsOf(c);
        const attempts = db.attempts.filter((a) => a.courseId === c.id);
        return `${crumbs(["Mi panel", "#/panel"], [c.name, `#/editor/${c.id}`])}
            <div class="section-heading"><div><span class="eyebrow">Acompaña su aprendizaje</span><h1>Alumnos y exámenes</h1><p>${esc(c.name)}</p></div><a class="btn btn-outline" href="#/examen-editor/${c.id}">Diseñar examen</a></div>
            ${notice()}
            <div class="metrics-strip"><div><strong>${students.length}</strong><span>Alumnos inscritos</span></div><div><strong>${attempts.filter((a) => a.state === "Entregado").length}</strong><span>Exámenes por revisar</span></div><div><strong>${attempts.filter((a) => a.state === "Calificado").length}</strong><span>Con nota final publicada</span></div></div>
            <section class="activity-entry"><div><h2>Prácticas y actividades</h2><p>Consulta las entregas, acepta con una observación o pide correcciones.</p></div><a class="btn btn-primary" href="#/actividades/${c.id}">Ver actividades y revisiones →</a></section>
            ${students.length ? "" : empty("Aún no hay alumnos inscritos", "Publica tu curso y comparte su enlace para abrir las inscripciones.")}
            <div class="students-list">${students.map((e) => { const s = user(e.userId); const p = progress(c, s); const at = attemptOf(c, s); return `<article class="student-row"><div class="student-info"><h2>${esc(s.name)}</h2><p>${esc(s.email)}</p><div class="progress-label"><span>Contenido completado</span><strong>${p.percent}%</strong></div>${progressBar(p.percent, "Avance de " + s.name)}</div><div class="student-exam-status">${at ? `<span class="state">${esc(at.state)}</span><h3>${at.state === "Calificado" ? "Calificación publicada" : "Examen recibido"}</h3>${at.state === "Calificado" ? `<p class="final-score">${at.grade.toFixed(2)} <small>/ 10</small></p>` : "<p>Sus respuestas están listas para que las revises.</p>"}<a class="btn btn-outline btn-sm" href="#/revision-examen/${c.id}/${at.id}">${at.state === "Calificado" ? "Consultar evaluación" : "Revisar entrega"}</a>` : `<span class="state">Sin entregar</span><h3>${p.percent >= 100 ? "Contenido terminado" : "Aprendizaje en curso"}</h3><p>${p.percent >= 100 ? "El alumno todavía no ha enviado su examen final." : "La evaluación estará disponible después de completar las clases."}</p>`}</div></article>`; }).join("")}</div>`;
    }

    function viewExamReview(id, attemptId) {
        const c = ownCourse(id);
        const at = db.attempts.find((a) => a.id === Number(attemptId));
        if (!c || !at) return viewNotFound();
        const s = user(at.userId);
        const { auto, max } = scoreOf(c, at);
        const suggested = max ? Math.round((auto / max) * 100) / 10 : 0;
        const graded = at.state === "Calificado";
        return `${crumbs(["Alumnos y exámenes", `#/participantes/${c.id}`], ["Revisar examen"])}
            <div class="section-heading"><div><span class="eyebrow">${esc(c.name)}</span><h1>Examen de ${esc(s.name)}</h1><p>Entregado ${fmt(at.submittedAt)}</p></div><span class="state">${esc(at.state)}</span></div>
            ${notice()}
            <div class="editor-layout"><section class="question-list">${c.exam.questions.map((q, i) => { const ans = at.answers[q.id]; const ok = q.type === "opcion" && ans === q.answer; return `<fieldset class="exam-question"><legend>Pregunta ${i + 1} <span class="muted">· ${q.points} puntos</span></legend><p class="preserve-lines">${esc(q.text)}</p>${q.type === "opcion" ? `<p class="answer-review ${ok ? "is-correct" : "is-wrong"}">Respondió <strong>${esc(ans || "—")}. ${esc(q.options[ans] || "")}</strong> · ${ok ? "Correcta" : `Correcta: ${q.answer}. ${esc(q.options[q.answer])}`}</p>` : `<div class="submitted-answer preserve-lines">${esc(ans || "Sin respuesta")}</div>`}</fieldset>`; }).join("")}</section>
            <aside class="editor-sidebar"><section class="publish-panel"><span class="eyebrow">Calificación final</span>${graded ? `<h2>Calificación publicada</h2><p class="final-score">${at.grade.toFixed(2)} <small>/ 10</small></p><div class="feedback-note preserve-lines">${esc(at.feedback || "Sin comentarios adicionales.")}</div>` : `<h2>Publica su resultado</h2><p>Las preguntas de opción múltiple suman <strong>${auto} de ${max}</strong> puntos. Revisa las abiertas y decide la nota.</p><form data-action="grade" data-attempt="${at.id}"><div class="form-group"><label for="nota">Nota final (0 a 10)</label><input class="form-control" type="number" id="nota" name="grade" min="0" max="10" step="0.1" value="${suggested.toFixed(1)}" required></div><div class="form-group"><label for="retro">Retroalimentación</label><textarea class="form-control" id="retro" name="feedback" rows="5" maxlength="2000" placeholder="Reconoce lo logrado y señala qué reforzar."></textarea></div><button class="btn btn-primary" type="submit">Publicar calificación</button></form>`}</section></aside></div>`;
    }

    function viewNotFound(message = "No encontramos esta página.") {
        return empty(message, "Es posible que el registro haya cambiado al restablecer la demo.", `<a class="btn btn-outline" href="#/catalogo">Ir al catálogo</a>`);
    }

    /* ------------------------------------------------------------------ */
    /* Estructura y enrutamiento                                           */
    /* ------------------------------------------------------------------ */

    function shell(content, current) {
        const u = currentUser();
        const link = (href, key, label, extra = "") => `<li><a class="nav-link ${current === key ? "active" : ""}" href="${href}" ${current === key ? 'aria-current="page"' : ""}>${label}${extra}</a></li>`;
        const unread = u ? unreadCount(u) : 0;
        const menu = u
            ? link("#/catalogo", "catalogo", "Explorar cursos") + link("#/panel", "panel", "Mi panel") + (u.role === "Ponente" ? link("#/editor/nuevo", "editor", "Crear curso") : "") + link("#/avisos", "avisos", "Avisos", unread ? ` <span class="notification-badge" aria-label="${unread} avisos sin leer">${unread}</span>` : "") + link("#/perfil", "perfil", esc(u.name)) + `<li><button class="btn btn-outline btn-sm" type="button" data-logout>Salir</button></li>`
            : link("#/catalogo", "catalogo", "Explorar cursos") + `<li><a class="nav-link" href="#/login">Iniciar sesión</a></li><li><a class="btn btn-primary btn-sm" href="#/registro">Crear cuenta</a></li>`;
        return `<a class="skip-link" href="#main-content">Saltar al contenido</a>
            <header class="navbar"><div class="nav-container"><a class="brand-logo" href="${u ? "#/panel" : "#/catalogo"}" aria-label="EduPlatform, inicio"><span class="brand-mark" aria-hidden="true">e<span>.</span></span><span>EduPlatform<small class="brand-subtitle">Aprende. Comparte. Avanza.</small></span></a><nav aria-label="Navegación principal"><ul class="nav-menu">${menu}</ul></nav></div></header>
            <main class="main-wrapper" id="main-content">${content}</main>
            <footer class="site-footer"><div><strong>EduPlatform</strong><span>Un curso puede ser tu próximo comienzo.</span></div><a href="#/catalogo">Explorar cursos</a></footer>`;
    }

    const routes = [
        [/^\/(catalogo)?$/, "catalogo", false, (m, q) => viewCatalog(q)],
        [/^\/curso\/(\d+)$/, "catalogo", false, (m) => viewCourse(m[1])],
        [/^\/login$/, "login", false, (m, q) => viewLogin(q)],
        [/^\/registro$/, "login", false, () => viewRegister()],
        [/^\/panel$/, "panel", true, () => viewDashboard()],
        [/^\/aula\/(\d+)(?:\/(\d+))?$/, "panel", true, (m) => viewClassroom(m[1], m[2])],
        [/^\/examen\/(\d+)$/, "panel", true, (m) => viewExam(m[1])],
        [/^\/avisos$/, "avisos", true, (m, q) => viewNotifications(q)],
        [/^\/perfil$/, "perfil", true, () => viewProfile()],
        [/^\/editor\/(nuevo|\d+)$/, "editor", true, (m) => viewEditor(m[1])],
        [/^\/examen-editor\/(\d+)$/, "panel", true, (m) => viewExamEditor(m[1])],
        [/^\/actividades\/(\d+)$/, "panel", true, (m, q) => viewActivities(m[1], q)],
        [/^\/revision\/(\d+)\/(\d+)$/, "panel", true, (m) => viewActivityReview(m[1], m[2])],
        [/^\/participantes\/(\d+)$/, "panel", true, (m) => viewParticipants(m[1])],
        [/^\/revision-examen\/(\d+)\/(\d+)$/, "panel", true, (m) => viewExamReview(m[1], m[2])]
    ];

    function render() {
        const raw = location.hash.replace(/^#/, "") || "/";
        const [path, qs] = raw.split("?");
        const query = new URLSearchParams(qs || "");
        const u = currentUser();
        let html = null;
        let current = "catalogo";
        for (const [re, key, needsAuth, view] of routes) {
            const m = path.match(re);
            if (!m) continue;
            if (needsAuth && !u) { location.replace(`#/login?volver=${encodeURIComponent("#" + raw)}`); return; }
            if ((key === "login") && u) { location.replace("#/panel"); return; }
            current = key;
            html = view(m, query);
            break;
        }
        if (html === null) html = viewNotFound();
        if ((location.hash.replace(/^#/, "") || "/") !== raw) return; // la vista redirigió
        app.innerHTML = shell(html, current);
        const h1 = app.querySelector("h1");
        document.title = `${h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "Aprende a tu ritmo"} · EduPlatform`;
        window.scrollTo(0, 0);
    }

    /* ------------------------------------------------------------------ */
    /* Acciones                                                            */
    /* ------------------------------------------------------------------ */

    function toast(message) {
        document.querySelectorAll(".toast").forEach((t) => t.remove());
        const el = document.createElement("div");
        el.className = "toast";
        el.setAttribute("role", "status");
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

    function login(email, password, back) {
        const u = db.users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
        if (!u || u.password !== password) { app.innerHTML = shell(viewLogin(new URLSearchParams(), "Correo o contraseña incorrectos."), "login"); return; }
        setSession(u.id);
        flash = `Bienvenido, ${u.name.split(" ")[0]}.`;
        go(back && back.startsWith("#/") ? back : "#/panel");
    }

    const actions = {
        catalog(data) { const p = new URLSearchParams(Object.entries(data).filter(([, v]) => v)); go(`#/catalogo${p.toString() ? "?" + p : ""}`); },
        login(data, form) { login(data.email, data.password, form.dataset.back); },
        register(data) {
            if (db.users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) { app.innerHTML = shell(viewRegister("Ya existe una cuenta con ese correo."), "login"); return; }
            const u = { id: nextId(), name: data.name.trim(), email: data.email.trim().toLowerCase(), password: data.password, role: "Alumno", phone: "" };
            db.users.push(u);
            setSession(u.id);
            save("Tu cuenta está lista. Explora el catálogo e inscríbete a un curso.");
            go("#/panel");
        },
        profile(data) { const u = currentUser(); u.name = data.name.trim(); u.phone = data.phone.trim(); save("Perfil actualizado."); render(); },
        activity(data, form) {
            const c = course(form.dataset.course);
            const u = currentUser();
            const lessonId = Number(form.dataset.lesson);
            let a = activityOf(c, lessonId, u);
            const at = new Date().toISOString();
            if (!a) { a = { id: nextId(), courseId: c.id, lessonId, userId: u.id, version: 0, history: [] }; db.activities.push(a); }
            a.version += 1;
            Object.assign(a, { answer: data.answer.trim(), state: "Enviada", comment: "", submittedAt: at, reviewedAt: null });
            a.history.push({ version: a.version, state: "Enviada", actor: u.name, comment: "", answer: a.answer, at });
            const lesson = lessonsOf(c).find((l) => l.id === lessonId);
            notify(c.ponenteId, c, "Nueva actividad por revisar", `${u.name} entregó «${lesson.title}».`, `#/revision/${c.id}/${a.id}`);
            save("Actividad enviada al ponente. Tu avance quedó guardado.");
            render();
        },
        exam(data, form) {
            const c = course(form.dataset.course);
            const u = currentUser();
            const answers = {};
            c.exam.questions.forEach((q) => { answers[q.id] = (data["q" + q.id] || "").trim(); });
            const at = { id: nextId(), courseId: c.id, userId: u.id, answers, state: "Entregado", grade: null, feedback: "", submittedAt: new Date().toISOString(), gradedAt: null };
            db.attempts.push(at);
            notify(c.ponenteId, c, "Examen final entregado", `${u.name} entregó ${c.exam.title}.`, `#/revision-examen/${c.id}/${at.id}`);
            save("Examen entregado. El ponente revisará tus respuestas y publicará tu calificación.");
            render();
        },
        "course-save"(data, form) {
            const u = currentUser();
            let c = form.dataset.course ? ownCourse(form.dataset.course) : null;
            const fields = { name: data.name.trim(), description: data.description.trim(), category: data.category.trim(), level: data.level, objectives: data.objectives.trim(), requirements: data.requirements.trim(), cupo: data.cupo ? Number(data.cupo) : null };
            if (c) Object.assign(c, fields);
            else {
                c = { id: nextId(), code: `CUR-${100 + db.courses.length}`, state: "Borrador", ponenteId: u.id, modules: [], exam: { title: "Examen final", instructions: "", passing: 7, published: false, questions: [] }, ...fields };
                db.courses.push(c);
            }
            save(form.dataset.course ? "Cambios guardados." : "Borrador creado. Ahora diseña el temario.");
            go(`#/editor/${c.id}`);
        },
        module(data, form) { const c = ownCourse(form.dataset.course); c.modules.push({ id: nextId(), title: data.title.trim(), lessons: [] }); save("Sección agregada."); render(); },
        lesson(data, form) {
            const c = ownCourse(form.dataset.course);
            const m = c.modules.find((x) => x.id === Number(form.dataset.module));
            m.lessons.push({ id: nextId(), title: data.title.trim(), type: data.type, minutes: Number(data.minutes) || 10, content: data.content.trim() || "Contenido en preparación." });
            save("Clase guardada.");
            render();
        },
        question(data, form) {
            const c = ownCourse(form.dataset.course);
            c.exam.questions.push({ id: nextId(), type: "opcion", text: data.text.trim(), options: { A: data.A, B: data.B, C: data.C, D: data.D }, answer: data.answer, points: Number(data.points) || 2 });
            save("Pregunta agregada.");
            render();
        },
        review(data, form) {
            const a = db.activities.find((x) => x.id === Number(form.dataset.delivery));
            const c = course(a.courseId);
            if (data.decision === "Devuelta" && !data.comment.trim()) { toast("Explica qué debe corregir el alumno."); return; }
            const at = new Date().toISOString();
            Object.assign(a, { state: data.decision, comment: data.comment.trim(), reviewedAt: at });
            a.history.push({ version: a.version, state: a.state, actor: currentUser().name, comment: a.comment, answer: a.answer, at });
            const lesson = lessonsOf(c).find((l) => l.id === a.lessonId);
            notify(a.userId, c, a.state === "Aceptada" ? "Tu actividad fue aceptada" : "Tu actividad necesita correcciones", `${currentUser().name} revisó «${lesson.title}»${a.comment ? ": " + a.comment : "."}`, `#/aula/${c.id}/${a.lessonId}`);
            save(a.state === "Devuelta" ? "Actividad devuelta. El alumno recibió tus indicaciones para corregir." : "Actividad aceptada. El alumno ya puede ver tu comentario.");
            render();
        },
        grade(data, form) {
            const at = db.attempts.find((x) => x.id === Number(form.dataset.attempt));
            const c = course(at.courseId);
            const grade = Math.min(10, Math.max(0, parseFloat(data.grade)));
            Object.assign(at, { state: "Calificado", grade, feedback: data.feedback.trim(), gradedAt: new Date().toISOString() });
            notify(at.userId, c, "Tu calificación final está lista", `Obtuviste ${grade.toFixed(2)} en ${c.exam.title}.`, `#/examen/${c.id}`);
            save("Calificación publicada. El alumno ya puede consultarla.");
            render();
        }
    };

    document.addEventListener("submit", (event) => {
        const form = event.target.closest("form[data-action]");
        if (!form) return;
        event.preventDefault();
        actions[form.dataset.action]?.(Object.fromEntries(new FormData(form).entries()), form);
    });

    document.addEventListener("click", (event) => {
        const t = event.target.closest("button, a");
        if (!t) return;
        const u = currentUser();
        if (t.matches("[data-quick-login]")) { login(t.dataset.quickLogin, "demo123", new URLSearchParams(location.hash.split("?")[1] || "").get("volver")); return; }
        if (t.matches("[data-logout]")) { setSession(null); go("#/catalogo"); return; }
        if (t.matches("[data-scroll]")) { event.preventDefault(); document.getElementById(t.dataset.scroll)?.scrollIntoView({ behavior: "smooth" }); return; }
        if (t.matches("[data-reset-demo]")) {
            if (window.confirm("Se borrarán los cambios que hiciste y se cargarán de nuevo los datos de ejemplo.")) {
                const uid = u?.id;
                db = buildSeed();
                persist();
                if (!db.users.some((x) => x.id === uid)) setSession(null);
                flash = "La demo se restableció con los datos de ejemplo.";
                go(currentUser() ? "#/panel" : "#/catalogo");
            }
            return;
        }
        if (t.matches("[data-enroll]")) {
            const c = course(t.dataset.enroll);
            if (c.cupo && studentsOf(c).length >= c.cupo) { toast("El curso ya no tiene lugares disponibles."); return; }
            db.enrollments.push({ courseId: c.id, userId: u.id, completed: [], at: new Date().toISOString() });
            save("Tu inscripción está lista. ¡Comienza tu primera lección!");
            go(`#/aula/${c.id}`);
            return;
        }
        if (t.matches("[data-complete]")) {
            const c = course(t.dataset.course);
            const e = enrollment(c, u);
            const lid = Number(t.dataset.complete);
            const done = t.dataset.done === "1";
            if (done) e.completed = e.completed.filter((x) => x !== lid);
            else if (!e.completed.includes(lid)) e.completed.push(lid);
            const lessons = lessonsOf(c);
            const idx = lessons.findIndex((l) => l.id === lid);
            const next = !done && lessons[idx + 1] ? lessons[idx + 1].id : lid;
            save(done ? "La clase quedó pendiente." : "Clase completada. Tu siguiente paso ya está listo.");
            go(`#/aula/${c.id}/${next}`);
            return;
        }
        if (t.matches("[data-open-notice]")) {
            const n = db.notifications.find((x) => x.id === Number(t.dataset.openNotice));
            n.read = true;
            save();
            go(n.href);
            return;
        }
        if (t.matches("[data-state]")) {
            const c = ownCourse(t.dataset.course);
            c.state = t.dataset.state;
            save(c.state === "Publicado" ? "Curso publicado. Ya aparece en el catálogo." : "El curso volvió a borrador.");
            render();
            return;
        }
        if (t.matches("[data-exam-publish]")) {
            const c = ownCourse(t.dataset.examPublish);
            c.exam.published = !c.exam.published;
            save(c.exam.published ? "Examen publicado." : "Examen oculto para los alumnos.");
            render();
            return;
        }
        if (t.matches("[data-delete-lesson]")) {
            const c = ownCourse(t.dataset.course);
            if (!window.confirm("¿Eliminar esta lección?")) return;
            c.modules.forEach((m) => { m.lessons = m.lessons.filter((l) => l.id !== Number(t.dataset.deleteLesson)); });
            save("Lección eliminada.");
            render();
        }
    });

    window.addEventListener("hashchange", render);
    render();
})();
