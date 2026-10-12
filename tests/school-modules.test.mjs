import test from 'node:test'
import assert from 'node:assert/strict'
import { modulesForSchool, rolesForSchool } from '../src/schoolModules.js'

const all = ['overview', 'students', 'parents', 'transport', 'hostel', 'progress', 'wellbeing', 'settings']

test('school level hides irrelevant modules while retaining common modules', () => {
  assert.deepEqual(modulesForSchool('Basic school', all), all.filter(id => id !== 'hostel'))
  assert.deepEqual(modulesForSchool('Secondary school', all), all)
  assert.deepEqual(modulesForSchool('Tertiary / university', all), all.filter(id => !['parents', 'progress'].includes(id)))
  assert.deepEqual(modulesForSchool('Training institute', all), ['overview', 'students', 'settings'])
})

test('school filtering cannot add access beyond the selected role', () => {
  assert.deepEqual(modulesForSchool('Basic school', ['overview', 'students']), ['overview', 'students'])
  assert.deepEqual(modulesForSchool('Basic school', ['overview', 'hostel']), ['overview'])
})

test('role previews follow the modules available to the school', () => {
  const roles = ['Admin', 'Teacher', 'Parent', 'Transport officer', 'Hostel manager']
  assert.deepEqual(rolesForSchool('Basic school', roles), roles.slice(0, 4))
  assert.deepEqual(rolesForSchool('Tertiary / university', roles), ['Admin', 'Teacher', 'Transport officer', 'Hostel manager'])
  assert.deepEqual(rolesForSchool('Training institute', roles), roles.slice(0, 2))
})
