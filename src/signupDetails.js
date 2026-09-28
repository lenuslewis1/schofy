export const schoolTypes = ['Basic school','Secondary school','Vocational / technical','Tertiary / university','International school','Training institute']
export const schoolSizes = ['Under 100','100–499','500–999','1,000–2,499','2,500+']
export function signupMetadata(details, password, confirmation) {
  if(password.length<8) throw new Error('Use a password with at least 8 characters.')
  if(password!==confirmation) throw new Error('Your passwords do not match.')
  const clean = key => String(details[key]||'').trim()
  for(const key of ['fullName','jobTitle','schoolName','country']) {
    if(!clean(key)) throw new Error('Complete your name, role, school name and country.')
    if(clean(key).length>120) throw new Error('Keep names and location details under 120 characters.')
  }
  if(!schoolTypes.includes(details.schoolType)||!schoolSizes.includes(details.schoolSize)) throw new Error('Choose your school type and student count.')
  // Descriptive onboarding data only; never used for permissions or authorization.
  return {
    full_name: clean('fullName'), job_title: clean('jobTitle'), phone: clean('phone').slice(0,40),
    school_setup: { name:clean('schoolName'), type:details.schoolType, studentCount:details.schoolSize, country:clean('country'), city:clean('city').slice(0,120) },
  }
}
