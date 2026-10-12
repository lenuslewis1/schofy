// School type tailors the workspace UI; role access remains a separate check.
const hiddenBySchoolType = {
  'Basic school': ['hostel'],
  'Secondary school': [],
  'Vocational / technical': ['progress'],
  'Tertiary / university': ['parents', 'progress'],
  'International school': ['progress'],
  'Training institute': ['parents', 'transport', 'hostel', 'progress', 'wellbeing'],
}

export function modulesForSchool(schoolType, roleModules) {
  const hidden = hiddenBySchoolType[schoolType] || []
  return roleModules.filter(id => !hidden.includes(id))
}

export function rolesForSchool(schoolType, roles) {
  const roleModules = {
    Parent: 'parents',
    'Transport officer': 'transport',
    'Hostel manager': 'hostel',
  }
  return roles.filter(role => !roleModules[role] || modulesForSchool(schoolType, [roleModules[role]]).length > 0)
}
