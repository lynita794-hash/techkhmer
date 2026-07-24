import { useEffect, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import {
  createFooterGroup,
  createMenu,
  deleteFooterGroup,
  deleteMenu,
  fetchFooterGroups,
  reorderFooterGroups,
  reorderMenus,
  updateFooterGroup,
  updateMenu,
} from '../../utils/adminApi'
import './AdminFooterManager.css'

const emptyLinkForm = { label: '', labelEn: '', url: '', openNewTab: false }

function AdminFooterManager() {
  const { token } = useAdminAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Column (group) rename state
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [groupLabelDraft, setGroupLabelDraft] = useState('')
  const [groupLabelEnDraft, setGroupLabelEnDraft] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupLabel, setNewGroupLabel] = useState('')
  const [newGroupLabelEn, setNewGroupLabelEn] = useState('')

  // Link add/edit state — keyed by groupId so each column can have its own
  // inline form open at the same time.
  const [addingLinkGroupId, setAddingLinkGroupId] = useState(null)
  const [editingLink, setEditingLink] = useState(null) // { groupId, linkId } | null
  const [linkForm, setLinkForm] = useState(emptyLinkForm)

  // Drag-and-drop state
  const [draggedGroupIndex, setDraggedGroupIndex] = useState(null)
  const [dragOverGroupIndex, setDragOverGroupIndex] = useState(null)
  const [draggedLink, setDraggedLink] = useState(null) // { groupId, index } | null
  const [dragOverLink, setDragOverLink] = useState(null) // { groupId, index } | null

  const load = () => {
    setLoading(true)
    fetchFooterGroups()
      .then(setGroups)
      .catch(() => setError('មិនអាចទាញទិន្នន័យបានទេ។'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  // --- Column (footer group) actions ---
  const handleAddGroup = async (e) => {
    e.preventDefault()
    if (!newGroupLabel.trim()) return
    setError('')
    try {
      const created = await createFooterGroup(token, {
        label: newGroupLabel.trim(),
        labelEn: newGroupLabelEn.trim(),
      })
      setGroups((prev) => [...prev, { ...created, links: [] }])
      setNewGroupLabel('')
      setNewGroupLabelEn('')
      setAddingGroup(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const startEditGroup = (group) => {
    setEditingGroupId(group.id)
    setGroupLabelDraft(group.label)
    setGroupLabelEnDraft(group.labelEn || '')
  }

  const handleSaveGroupLabel = async (groupId) => {
    if (!groupLabelDraft.trim()) return
    setError('')
    try {
      await updateFooterGroup(token, groupId, {
        label: groupLabelDraft.trim(),
        labelEn: groupLabelEnDraft.trim(),
      })
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, label: groupLabelDraft.trim(), labelEn: groupLabelEnDraft.trim() }
            : g,
        ),
      )
      setEditingGroupId(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteGroup = async (group) => {
    if (
      !window.confirm(
        `លុបជួរឈរ "${group.label}" ព្រមទាំងតំណភ្ជាប់ទាំង ${group.links.length} ចេញមែនទេ?`,
      )
    )
      return
    setError('')
    try {
      await deleteFooterGroup(token, group.id)
      setGroups((prev) => prev.filter((g) => g.id !== group.id))
    } catch (err) {
      setError(err.message)
    }
  }

  // --- Link actions ---
  const startAddLink = (groupId) => {
    setAddingLinkGroupId(groupId)
    setEditingLink(null)
    setLinkForm(emptyLinkForm)
  }

  const startEditLink = (groupId, link) => {
    setEditingLink({ groupId, linkId: link.id })
    setAddingLinkGroupId(null)
    setLinkForm({
      label: link.label,
      labelEn: link.labelEn || '',
      url: link.url,
      openNewTab: link.openNewTab,
    })
  }

  const cancelLinkForm = () => {
    setAddingLinkGroupId(null)
    setEditingLink(null)
    setLinkForm(emptyLinkForm)
  }

  const handleLinkSubmit = async (e, groupId) => {
    e.preventDefault()
    if (!linkForm.label.trim() || !linkForm.url.trim()) return
    setError('')
    try {
      if (editingLink) {
        const updated = await updateMenu(token, editingLink.linkId, {
          label: linkForm.label.trim(),
          labelEn: linkForm.labelEn.trim(),
          url: linkForm.url.trim(),
          openNewTab: linkForm.openNewTab,
        })
        setGroups((prev) =>
          prev.map((g) =>
            g.id !== groupId
              ? g
              : { ...g, links: g.links.map((l) => (l.id === updated.id ? updated : l)) },
          ),
        )
      } else {
        const created = await createMenu(token, {
          location: 'footer',
          groupId,
          label: linkForm.label.trim(),
          labelEn: linkForm.labelEn.trim(),
          url: linkForm.url.trim(),
          openNewTab: linkForm.openNewTab,
        })
        setGroups((prev) =>
          prev.map((g) => (g.id !== groupId ? g : { ...g, links: [...g.links, created] })),
        )
      }
      cancelLinkForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteLink = async (groupId, link) => {
    if (!window.confirm(`លុបតំណភ្ជាប់ "${link.label}" ចេញមែនទេ?`)) return
    setError('')
    try {
      await deleteMenu(token, link.id)
      setGroups((prev) =>
        prev.map((g) =>
          g.id !== groupId ? g : { ...g, links: g.links.filter((l) => l.id !== link.id) },
        ),
      )
    } catch (err) {
      setError(err.message)
    }
  }

  // --- Drag and drop: reorder columns ---
  const handleGroupDrop = async (targetIndex) => {
    if (draggedGroupIndex === null || draggedGroupIndex === targetIndex) {
      setDraggedGroupIndex(null)
      setDragOverGroupIndex(null)
      return
    }
    const reordered = [...groups]
    const [moved] = reordered.splice(draggedGroupIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    setGroups(reordered)
    setDraggedGroupIndex(null)
    setDragOverGroupIndex(null)
    try {
      await reorderFooterGroups(token, reordered.map((g) => g.id))
    } catch (err) {
      setError(err.message)
    }
  }

  // --- Drag and drop: reorder links (within or across columns) ---
  const handleLinkDrop = async (targetGroupId, targetIndex) => {
    if (!draggedLink) return
    const { groupId: sourceGroupId, index: sourceIndex } = draggedLink
    setDraggedLink(null)
    setDragOverLink(null)

    if (sourceGroupId === targetGroupId && sourceIndex === targetIndex) return

    const sourceGroup = groups.find((g) => g.id === sourceGroupId)
    const link = sourceGroup.links[sourceIndex]

    let nextGroups = groups.map((g) => ({ ...g, links: [...g.links] }))
    const srcGroup = nextGroups.find((g) => g.id === sourceGroupId)
    srcGroup.links.splice(sourceIndex, 1)

    const destGroup = nextGroups.find((g) => g.id === targetGroupId)
    const insertAt = Math.min(targetIndex, destGroup.links.length)
    destGroup.links.splice(insertAt, 0, link)

    setGroups(nextGroups)

    try {
      if (sourceGroupId !== targetGroupId) {
        await updateMenu(token, link.id, { groupId: targetGroupId })
      }
      await reorderMenus(token, destGroup.links.map((l) => l.id))
      if (sourceGroupId !== targetGroupId) {
        await reorderMenus(token, srcGroup.links.map((l) => l.id))
      }
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  if (loading) {
    return <p className="admin-loading">កំពុងផ្ទុក...</p>
  }

  return (
    <div className="admin-footer-manager">
      <div className="afm-header">
        <h1>គ្រប់គ្រង Footer Columns</h1>
        <button
          type="button"
          className="afm-add-group-btn"
          onClick={() => setAddingGroup((v) => !v)}
        >
          + ADD ជួរឈរថ្មី
        </button>
      </div>

      <p className="settings-hint">
        អូស (Drag) ចាប់ត្រង់ handle <strong>⠿</strong> ដើម្បីផ្លាស់ប្តូរទីតាំងជួរឈរ ឬ តំណភ្ជាប់
        ខាងក្នុង។ អាចអូសតំណភ្ជាប់ពីជួរឈរមួយទៅជួរឈរផ្សេងបានផងដែរ។
      </p>

      {error && <p className="admin-error">{error}</p>}

      {addingGroup && (
        <form className="afm-new-group-form" onSubmit={handleAddGroup}>
          <input
            type="text"
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            placeholder="ឈ្មោះជួរឈរថ្មី (ខ្មែរ, ឧ. ជំនួយ)"
            autoFocus
          />
          <input
            type="text"
            value={newGroupLabelEn}
            onChange={(e) => setNewGroupLabelEn(e.target.value)}
            placeholder="English name (optional, e.g. Support)"
          />
          <button type="submit" className="afm-save-btn">
            រក្សាទុក
          </button>
          <button
            type="button"
            className="afm-cancel-btn"
            onClick={() => {
              setAddingGroup(false)
              setNewGroupLabel('')
            }}
          >
            បោះបង់
          </button>
        </form>
      )}

      <div className="afm-columns">
        {groups.map((group, groupIndex) => (
          <div
            key={group.id}
            className={`afm-column ${dragOverGroupIndex === groupIndex ? 'is-drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverGroupIndex(groupIndex)
            }}
            onDrop={(e) => {
              e.preventDefault()
              handleGroupDrop(groupIndex)
            }}
          >
            <div className="afm-column-header">
              <span
                className="afm-drag-handle"
                draggable
                onDragStart={() => setDraggedGroupIndex(groupIndex)}
                onDragEnd={() => {
                  setDraggedGroupIndex(null)
                  setDragOverGroupIndex(null)
                }}
                aria-label="អូសផ្លាស់ប្តូរទីតាំងជួរឈរ"
              >
                ⠿
              </span>

              {editingGroupId === group.id ? (
                <div className="afm-inline-edit">
                  <input
                    type="text"
                    value={groupLabelDraft}
                    onChange={(e) => setGroupLabelDraft(e.target.value)}
                    placeholder="ខ្មែរ"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={groupLabelEnDraft}
                    onChange={(e) => setGroupLabelEnDraft(e.target.value)}
                    placeholder="English (optional)"
                  />
                  <button
                    type="button"
                    className="afm-save-btn"
                    onClick={() => handleSaveGroupLabel(group.id)}
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    className="afm-cancel-btn"
                    onClick={() => setEditingGroupId(null)}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <h3>{group.label}</h3>
                  <div className="afm-column-actions">
                    <button
                      type="button"
                      className="afm-edit-btn"
                      onClick={() => startEditGroup(group)}
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      className="afm-delete-btn"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      លុប
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="afm-link-list">
              {group.links.map((link, linkIndex) => (
                <div key={link.id}>
                  {editingLink?.linkId === link.id ? (
                    <form
                      className="afm-link-form"
                      onSubmit={(e) => handleLinkSubmit(e, group.id)}
                    >
                      <input
                        type="text"
                        value={linkForm.label}
                        onChange={(e) =>
                          setLinkForm((p) => ({ ...p, label: e.target.value }))
                        }
                        placeholder="ចំណងជើង (ខ្មែរ)"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={linkForm.labelEn}
                        onChange={(e) =>
                          setLinkForm((p) => ({ ...p, labelEn: e.target.value }))
                        }
                        placeholder="English (optional)"
                      />
                      <input
                        type="text"
                        value={linkForm.url}
                        onChange={(e) => setLinkForm((p) => ({ ...p, url: e.target.value }))}
                        placeholder="URL (ឧ. /about)"
                      />
                      <label className="afm-checkbox">
                        <input
                          type="checkbox"
                          checked={linkForm.openNewTab}
                          onChange={(e) =>
                            setLinkForm((p) => ({ ...p, openNewTab: e.target.checked }))
                          }
                        />
                        <span>Tab ថ្មី</span>
                      </label>
                      <div className="afm-link-form-actions">
                        <button type="submit" className="afm-save-btn">
                          រក្សាទុក
                        </button>
                        <button
                          type="button"
                          className="afm-cancel-btn"
                          onClick={cancelLinkForm}
                        >
                          បោះបង់
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      className={`afm-link-row ${
                        dragOverLink?.groupId === group.id && dragOverLink?.index === linkIndex
                          ? 'is-drag-over'
                          : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOverLink({ groupId: group.id, index: linkIndex })
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        handleLinkDrop(group.id, linkIndex)
                      }}
                    >
                      <span
                        className="afm-drag-handle"
                        draggable
                        onDragStart={() =>
                          setDraggedLink({ groupId: group.id, index: linkIndex })
                        }
                        onDragEnd={() => {
                          setDraggedLink(null)
                          setDragOverLink(null)
                        }}
                        aria-label="អូសផ្លាស់ប្តូរទីតាំងតំណភ្ជាប់"
                      >
                        ⠿
                      </span>
                      <span className="afm-link-label">{link.label}</span>
                      <span className="afm-link-url">{link.url}</span>
                      <div className="afm-link-actions">
                        <button
                          type="button"
                          className="afm-edit-btn"
                          onClick={() => startEditLink(group.id, link)}
                        >
                          EDIT
                        </button>
                        <button
                          type="button"
                          className="afm-delete-btn"
                          onClick={() => handleDeleteLink(group.id, link)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Drop target for appending to the end of this column's list */}
              <div
                className={`afm-link-drop-end ${
                  dragOverLink?.groupId === group.id &&
                  dragOverLink?.index === group.links.length
                    ? 'is-drag-over'
                    : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverLink({ groupId: group.id, index: group.links.length })
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleLinkDrop(group.id, group.links.length)
                }}
              />
            </div>

            {addingLinkGroupId === group.id ? (
              <form className="afm-link-form" onSubmit={(e) => handleLinkSubmit(e, group.id)}>
                <input
                  type="text"
                  value={linkForm.label}
                  onChange={(e) => setLinkForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="ចំណងជើង (ខ្មែរ)"
                  autoFocus
                />
                <input
                  type="text"
                  value={linkForm.labelEn}
                  onChange={(e) => setLinkForm((p) => ({ ...p, labelEn: e.target.value }))}
                  placeholder="English (optional)"
                />
                <input
                  type="text"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder="URL (ឧ. /about)"
                />
                <label className="afm-checkbox">
                  <input
                    type="checkbox"
                    checked={linkForm.openNewTab}
                    onChange={(e) =>
                      setLinkForm((p) => ({ ...p, openNewTab: e.target.checked }))
                    }
                  />
                  <span>Tab ថ្មី</span>
                </label>
                <div className="afm-link-form-actions">
                  <button type="submit" className="afm-save-btn">
                    រក្សាទុក
                  </button>
                  <button type="button" className="afm-cancel-btn" onClick={cancelLinkForm}>
                    បោះបង់
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="afm-add-link-btn"
                onClick={() => startAddLink(group.id)}
              >
                + ADD តំណភ្ជាប់
              </button>
            )}
          </div>
        ))}

        {groups.length === 0 && !addingGroup && (
          <p className="admin-empty">មិនទាន់មានជួរឈរណាមួយទេ។ ចុច "+ ADD ជួរឈរថ្មី" ដើម្បីបង្កើត។</p>
        )}
      </div>
    </div>
  )
}

export default AdminFooterManager
