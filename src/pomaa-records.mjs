import { applyImport, importSchemas, planImport } from './import-core.mjs'

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key)

export function parseRecordProposal(body, allowedTargets) {
  if (typeof body !== 'string' || body.length > 16000) throw new Error('The record proposal is too large.')
  let proposal
  try { proposal = JSON.parse(body) } catch { throw new Error('Pomaa did not return valid records.') }
  if (!proposal || !Array.isArray(proposal.tables) || !proposal.tables.length || proposal.tables.length > 4) throw new Error('Pomaa can propose up to four record types at once.')
  let total = 0
  const seen = new Set()
  const tables = proposal.tables.map(table => {
    const target = table?.target
    if (!allowedTargets.includes(target) || !importSchemas[target]) throw new Error('Your role cannot add one of these record types.')
    if (seen.has(target)) throw new Error('Combine rows of the same record type for review.')
    seen.add(target)
    if (!Array.isArray(table.records) || !table.records.length || table.records.length > 10) throw new Error('Each record type needs 1–10 rows for review.')
    total += table.records.length
    const fields = importSchemas[target].fields
    const records = table.records.map(row => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('A proposed row is not a record.')
      const clean = {}
      for (const [key, value] of Object.entries(row)) {
        if (!own(fields, key) || !['string', 'number'].includes(typeof value) || String(value).length > 1000) throw new Error('A proposed field is not supported.')
        clean[key] = String(value)
      }
      return clean
    })
    return { target, records }
  })
  if (total > 20) throw new Error('Review up to 20 records at once.')
  const order = ['students', 'teachers', 'classes', 'parents', 'admissions', 'timetable', 'library', 'transport', 'hostel', 'invoices', 'payments', 'expenses', 'results', 'attendance', 'staffAttendance']
  return { tables: tables.sort((a, b) => order.indexOf(a.target) - order.indexOf(b.target)) }
}

function importTable(target, records) {
  const headers = Object.keys(importSchemas[target].fields)
  return {
    file: 'Pomaa proposal', name: importSchemas[target].label, headers,
    rows: records.map((record, index) => ({
      row: index + 1,
      cells: headers.map(key => record[key] ?? ''),
    })),
  }
}

export function previewRecordProposal(db, proposal, allowedTargets) {
  let working = db
  const previews = proposal.tables.map(({ target, records }) => {
    const table = importTable(target, records)
    const mapping = Object.fromEntries(table.headers.map((key, index) => [key, index]))
    const plan = planImport(working, table, target, mapping)
    if (plan.ready) working = applyImport(working, table, target, mapping, allowedTargets)
    return { target, plan }
  })
  return previews
}

export function applyRecordProposal(db, proposal, allowedTargets) {
  const previews = previewRecordProposal(db, proposal, allowedTargets)
  if (previews.some(({ plan }) => plan.invalid)) throw new Error('Correct the flagged records before saving.')
  if (!previews.some(({ plan }) => plan.ready)) throw new Error('All proposed records already exist.')
  return proposal.tables.reduce((working, { target, records }, index) => {
    if (!previews[index].plan.ready) return working
    const table = importTable(target, records)
    const mapping = Object.fromEntries(table.headers.map((key, column) => [key, column]))
    return applyImport(working, table, target, mapping, allowedTargets)
  }, db)
}

export function isSampleDataRequest(text) {
  const normalized = String(text).toLowerCase().replace(/dum\W*my/g, 'dummy')
  return /\b(dummy|sample|fictional|test)\b/.test(normalized) && /\b(populate|add|create|generate|fill|seed)\b/.test(normalized)
}

export function sampleRecordProposal(schoolType) {
  const groups = {
    'Basic school': ['Grade 4 A', 'Grade 6 A'],
    'Secondary school': ['Form 1 A', 'Form 2 A'],
    'Vocational / technical': ['Level 1 A', 'Level 2 A'],
    'Tertiary / university': ['Year 1 A', 'Year 2 A'],
    'International school': ['Grade 7 A', 'Grade 8 A'],
    'Training institute': ['Cohort A', 'Cohort B'],
  }[schoolType] || ['Class A', 'Class B']
  return { tables: [
    { target: 'classes', records: groups.map(name => ({ name, department: 'Sample programme', capacity: '30' })) },
    { target: 'teachers', records: [
      { name: 'Sample Teacher One', subject: 'Mathematics', role: 'Teacher', status: 'Active' },
      { name: 'Sample Teacher Two', subject: 'English', role: 'Teacher', status: 'Active' },
    ] },
    { target: 'students', records: [
      { name: 'Sample Learner One', group: groups[0], status: 'Active' },
      { name: 'Sample Learner Two', group: groups[0], status: 'Active' },
      { name: 'Sample Learner Three', group: groups[1], status: 'Active' },
      { name: 'Sample Learner Four', group: groups[1], status: 'Active' },
    ] },
  ] }
}
