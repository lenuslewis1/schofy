// One private school workspace per owner. The database enforces ownership and revisions.
export const emptyWorkspace = () => ({
  settings: { name: 'My school', type: 'Secondary school', year: '2026 / 2027', period: 'Term 1', currency: 'GHS', grading: 'Percentage', passMark: '50' },
  ...Object.fromEntries(['students','teachers','parents','classes','admissions','timetable','invoices','payments','expenses','attendance','results','library','transport','hostel','users','messages','audit','staffAttendance','wellbeing'].map(key => [key, []])),
  progressScores: {},
})

export async function loadWorkspace(client, userId) {
  const result = await client.from('school_workspaces').select('*').eq('owner_id', userId).maybeSingle()
  if (result.error) throw result.error
  return result.data
}

export async function createWorkspace(client, userId, schoolName, profile = {}) {
  const data = emptyWorkspace()
  data.settings.name = schoolName.trim()
  const school=profile.school_setup || {}
  for(const key of ['type','studentCount','country','city']) if(typeof school[key]==='string') data.settings[key]=school[key].slice(0,120)
  if(profile.full_name) data.users=[{id:userId,name:String(profile.full_name).slice(0,120),email:profile.email||'',phone:profile.phone||'',jobTitle:profile.job_title||'',role:'Admin',status:'Active'}]
  const result = await client.from('school_workspaces').insert({ owner_id: userId, data }).select().single()
  if (result.error) throw result.error
  return result.data
}

export async function saveWorkspace(client, rowId, revision, data) {
  const result = await client.rpc('save_school_workspace', {
    workspace_id: rowId, expected_revision: revision, next_data: data,
  })
  if (result.error) throw result.error
  if (!Number.isInteger(result.data)) throw new Error('The server did not confirm the save.')
  return result.data
}

export function createSaveQueue(save, onPending, onError) {
  let queue = Promise.resolve(), pending = 0, failed = false
  return {
    enqueue(snapshot) {
      if (failed) return false
      onPending(++pending)
      queue = queue.then(async () => {
        if (failed) return
        try { await save(snapshot) }
        catch (error) { failed = true; onError(error) }
      }).finally(() => onPending(--pending))
      return true
    },
    settled: () => queue,
  }
}
