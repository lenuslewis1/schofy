import React, { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { importSchemas, importTargets } from './import-core.mjs'
import { applyRecordProposal, parseRecordProposal, previewRecordProposal } from './pomaa-records.mjs'

export default function PomaaRecordReview({ action, db, role, allowed, commitImport, onCancel, onSaved, onError }) {
  const targets = importTargets(role, allowed)
  const [proposal, setProposal] = useState(() => parseRecordProposal(action.body, targets))
  const [saving, setSaving] = useState(false)
  const previews = useMemo(() => previewRecordProposal(db, proposal, targets), [db, proposal, role, allowed])
  const ready = previews.reduce((count, table) => count + table.plan.ready, 0)
  const invalid = previews.reduce((count, table) => count + table.plan.invalid, 0)
  const duplicates = previews.reduce((count, table) => count + table.plan.duplicates, 0)

  function edit(tableIndex, rowIndex, key, value) {
    setProposal(current => ({ tables: current.tables.map((table, index) => index !== tableIndex ? table : {
      ...table, records: table.records.map((record, row) => row !== rowIndex ? record : { ...record, [key]: value }),
    }) }))
  }

  async function save(event) {
    event.preventDefault()
    if (saving || invalid || !ready) return
    setSaving(true)
    try {
      await commitImport(current => applyRecordProposal(current, proposal, targets), `Added ${ready} reviewed Pomaa records`)
      onSaved(`${ready} reviewed record${ready === 1 ? '' : 's'} saved to your school workspace.`)
    } catch (error) { onError(error.message || 'The records could not be saved.') }
    finally { setSaving(false) }
  }

  return <form className="pomaa-review pomaa-record-review" onSubmit={save}>
    <h3>Review records before adding</h3>
    <p>These are proposals, not saved records. Check every detail. Existing records stay in place.</p>
    <p role="status"><strong>{ready} ready</strong> · {duplicates} already present · {invalid} need correction</p>
    {proposal.tables.map((table, tableIndex) => {
      const fields = importSchemas[table.target].fields
      return <section className="pomaa-record-group" key={`${table.target}-${tableIndex}`}>
        <h4>{importSchemas[table.target].label}</h4>
        {table.records.map((record, rowIndex) => {
          const entry = previews[tableIndex].plan.entries[rowIndex]
          const keys = [...new Set([...Object.keys(fields).filter(key => fields[key].required), ...Object.keys(record)])]
          return <div className="pomaa-record-row" key={rowIndex}>
            <strong>Record {rowIndex + 1} · {entry.status}</strong>
            <div className="pomaa-record-fields">{keys.map(key => <label key={key}>{fields[key].label}{fields[key].required ? ' *' : ''}<input value={record[key] ?? ''} maxLength={1000} onChange={event => edit(tableIndex, rowIndex, key, event.target.value)}/></label>)}</div>
            {entry.errors.map((message, index) => <small className={entry.status === 'invalid' ? 'pomaa-record-error' : ''} key={index}>{message}</small>)}
          </div>
        })}
      </section>
    })}
    <div><button type="button" disabled={saving} onClick={onCancel}>Cancel</button><button className="pomaa-primary" type="submit" disabled={saving || invalid > 0 || ready === 0}><Check size={15}/>{saving ? 'Saving…' : `Add ${ready} reviewed record${ready === 1 ? '' : 's'}`}</button></div>
    <small>Saved records become part of school totals. Sample records are clearly labelled and can be edited in their modules.</small>
  </form>
}
