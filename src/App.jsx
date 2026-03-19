import { useState, useRef } from "react";

const uid = () => Math.random().toString(36).slice(2, 8);

const GENRES = [
  "Ficção", "Não-ficção", "Romance", "Terror",
  "Fantasia", "Biografia", "Técnico", "Outro",
];

const EMPTY = { title: "", author: "", year: "", genre: "", rating: 0 };

const loadBooks = () => {
  try { return JSON.parse(localStorage.getItem("books_crud") || "[]"); }
  catch { return []; }
};

const saveBooks = (data) => localStorage.setItem("books_crud", JSON.stringify(data));

// ── Stars ──────────────────────────────────────────────
function Stars({ value, onChange, readonly }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange && onChange(n === value ? 0 : n)}
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </span>
  );
}

// ── BookForm ───────────────────────────────────────────
function BookForm({ initial, onSave, onCancel }) {
  const [form, setForm]     = useState(initial || EMPTY);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim())  e.title  = "Obrigatório";
    if (!form.author.trim()) e.author = "Obrigatório";
    if (form.year && (isNaN(+form.year) || +form.year < 1000 || +form.year > new Date().getFullYear()))
      e.year = "Ano inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, id: initial?.id || uid(), title: form.title.trim(), author: form.author.trim() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{initial ? "Editar livro" : "Novo livro"}</h2>

      <div>
        <label>Título</label><br />
        <input value={form.title} onChange={set("title")} placeholder="Ex: Dom Casmurro" autoFocus />
        {errors.title && <span> — {errors.title}</span>}
      </div>

      <div>
        <label>Autor</label><br />
        <input value={form.author} onChange={set("author")} placeholder="Ex: Machado de Assis" />
        {errors.author && <span> — {errors.author}</span>}
      </div>

      <div>
        <label>Ano</label><br />
        <input type="number" value={form.year} onChange={set("year")} placeholder="Ex: 1899" />
        {errors.year && <span> — {errors.year}</span>}
      </div>

      <div>
        <label>Gênero</label><br />
        <select value={form.genre} onChange={set("genre")}>
          <option value="">Selecione...</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div>
        <label>Avaliação: </label>
        <Stars value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
      </div>

      <br />
      <button type="submit">{initial ? "Salvar" : "Adicionar"}</button>
      <button type="button" onClick={onCancel}>Cancelar</button>
    </form>
  );
}

// ── BookCard ───────────────────────────────────────────
function BookCard({ book, onEdit, onDelete }) {
  return (
    <li>
      <strong>{book.title}</strong> — {book.author}
      {book.year  && <span> ({book.year})</span>}
      {book.genre && <span> [{book.genre}]</span>}
      <span> </span>
      <Stars value={book.rating} readonly />
      <span> </span>
      <button onClick={() => onEdit(book)}>Editar</button>
      <button onClick={() => onDelete(book.id)}>Remover</button>
    </li>
  );
}

// ── App ────────────────────────────────────────────────
export default function App() {
  const [books,   setBooks]   = useState(loadBooks);
  const [editing, setEditing] = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("todos");
  const [flash,   setFlash]   = useState(null);
  const flashTimer = useRef(null);

  const showFlash = (msg, type = "ok") => {
    setFlash({ msg, type });
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 2200);
  };

  // CREATE / UPDATE
  const handleSave = (book) => {
    let updated;
    if (editing) {
      updated = books.map((b) => (b.id === book.id ? book : b));
      showFlash("Livro atualizado!");
    } else {
      updated = [book, ...books];
      showFlash(`"${book.title}" adicionado!`);
    }
    setBooks(updated);
    saveBooks(updated);
    setEditing(null);
    setAdding(false);
  };

  // DELETE
  const handleDelete = (id) => {
    const book    = books.find((b) => b.id === id);
    const updated = books.filter((b) => b.id !== id);
    setBooks(updated);
    saveBooks(updated);
    if (editing?.id === id) setEditing(null);
    showFlash(`"${book.title}" removido.`, "del");
  };

  // Lista filtrada e ordenada A-Z
  const visible = books
    .filter((b) => {
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    })
    .filter((b) => filter === "todos" || b.genre === filter)
    .sort((a, b) => a.title.localeCompare(b.title));

  const showForm = adding || Boolean(editing);

  return (
    <div>
      <h1>Minha Estante de Livros</h1>
      <p>Total: {books.length} {books.length === 1 ? "livro" : "livros"}</p>

      {/* Flash */}
      {flash && <p>[{flash.type === "del" ? "REMOVIDO" : "OK"}] {flash.msg}</p>}

      {/* Formulário */}
      {showForm && (
        <BookForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setAdding(false); }}
        />
      )}

      {/* Toolbar */}
      <div>
        <input
          placeholder="Buscar título ou autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="todos">Todos os gêneros</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        {!showForm && (
          <button onClick={() => { setAdding(true); setEditing(null); }}>
            + Adicionar livro
          </button>
        )}
      </div>

      <p>{visible.length} de {books.length} livros</p>

      {/* Lista */}
      {visible.length === 0 ? (
        <p>
          {search || filter !== "todos"
            ? "Nenhum livro encontrado."
            : "Nenhum livro ainda. Clique em + Adicionar."}
        </p>
      ) : (
        <ul>
          {visible.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={(b) => { setEditing(b); setAdding(false); }}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
