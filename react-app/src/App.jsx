import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'simple-notes-react-v1'

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [notes, setNotes] = useState(loadNotes)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes])

  const visibleNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return notes
      .filter((note) => {
        if (!keyword) return true
        return (
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.updatedAt - a.updatedAt
      })
  }, [notes, search])

  const totalCount = notes.length
  const pinnedCount = notes.filter((note) => note.pinned).length

  function addNote(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle && !trimmedContent) return

    const now = Date.now()
    const newNote = {
      id: createId(),
      title: trimmedTitle || '无标题',
      content: trimmedContent,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    }

    setNotes((prev) => [newNote, ...prev])
    setTitle('')
    setContent('')
  }

  function deleteNote(id) {
    setNotes((prev) => prev.filter((note) => note.id !== id))
    if (editingId === id) {
      setEditingId('')
      setEditTitle('')
      setEditContent('')
    }
  }

  function togglePin(id) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, pinned: !note.pinned, updatedAt: Date.now() }
          : note,
      ),
    )
  }

  function startEdit(note) {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  function cancelEdit() {
    setEditingId('')
    setEditTitle('')
    setEditContent('')
  }

  function saveEdit(id) {
    const trimmedTitle = editTitle.trim()
    const trimmedContent = editContent.trim()
    if (!trimmedTitle && !trimmedContent) return

    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              title: trimmedTitle || '无标题',
              content: trimmedContent,
              updatedAt: Date.now(),
            }
          : note,
      ),
    )
    cancelEdit()
  }

  return (
    <main className="app">
      <header className="header">
        <h1>便签小站</h1>
        <p>随手记录想法，自动保存到本地。</p>
      </header>

      <section className="toolbar">
        <form className="new-note" onSubmit={addNote}>
          <input
            type="text"
            placeholder="标题（可选）"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
          />
          <textarea
            placeholder="写点什么..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            maxLength={500}
          />
          <button type="submit">新增便签</button>
        </form>

        <div className="side-panel">
          <input
            className="search"
            type="text"
            placeholder="搜索标题或内容"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="stats">
            <span>总数：{totalCount}</span>
            <span>置顶：{pinnedCount}</span>
          </div>
        </div>
      </section>

      <section className="note-grid">
        {visibleNotes.length === 0 && (
          <div className="empty">没有匹配的便签，试试新增一条吧。</div>
        )}

        {visibleNotes.map((note) => {
          const isEditing = editingId === note.id
          return (
            <article
              className={`note-card ${note.pinned ? 'pinned' : ''}`}
              key={note.id}
            >
              {isEditing ? (
                <div className="edit-area">
                  <input
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    maxLength={80}
                  />
                  <textarea
                    rows={5}
                    value={editContent}
                    onChange={(event) => setEditContent(event.target.value)}
                    maxLength={500}
                  />
                  <div className="actions">
                    <button onClick={() => saveEdit(note.id)}>保存</button>
                    <button className="ghost" onClick={cancelEdit}>
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{note.title}</h3>
                  <p className="content">
                    {note.content || <span className="muted">（无内容）</span>}
                  </p>
                  <p className="time">更新于 {formatTime(note.updatedAt)}</p>
                  <div className="actions">
                    <button onClick={() => togglePin(note.id)}>
                      {note.pinned ? '取消置顶' : '置顶'}
                    </button>
                    <button className="ghost" onClick={() => startEdit(note)}>
                      编辑
                    </button>
                    <button
                      className="danger"
                      onClick={() => deleteNote(note.id)}
                    >
                      删除
                    </button>
                  </div>
                </>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}

export default App
