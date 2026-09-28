export const structuredExtensions=['xlsx','xls','xlsm','ods','csv','tsv','json']
export const imageTypes={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}
export const audioTypes={mp3:'audio/mpeg',mpga:'audio/mpeg',mpeg:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',mp4:'audio/mp4',ogg:'audio/ogg',webm:'audio/webm',flac:'audio/flac'}
export const documentTypes={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',odt:'application/vnd.oasis.opendocument.text',rtf:'application/rtf',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',txt:'text/plain',md:'text/markdown',html:'text/html',xml:'text/xml',vcf:'text/vcard'}
export const extensionOf=name=>String(name||'').split('.').pop().toLowerCase()
export const aiFileTypes={...imageTypes,...audioTypes,...documentTypes}
export function checkImportFile(file){if(!file||!file.size)throw new Error('Choose a non-empty file.');if(file.size>5*1024*1024)throw new Error('Choose a file up to 5 MB.');const extension=extensionOf(file.name);if(!structuredExtensions.includes(extension)&&!aiFileTypes[extension])throw new Error('Pomaa cannot read this file type yet. Use a spreadsheet, PDF, Word document, JPG, PNG, WebP, text file or supported audio recording.');return extension}
export function extractionSheets(answer,file){
 if(!answer||answer.complete!==true)throw new Error('Pomaa could not read the entire file. Split it into smaller files and retry.')
 if(!Array.isArray(answer.tables)||!answer.tables.length)throw new Error('No school records were found. Use a clear document, image or recording containing names and record details.')
 let total=0
 const sheets=answer.tables.map(table=>{if(typeof table.name!=='string'||table.name.length>200||!Array.isArray(table.headers)||!table.headers.length||table.headers.length>60||table.headers.some(h=>typeof h!=='string'||h.length>256)||!Array.isArray(table.rows))throw new Error('Pomaa returned invalid columns. Please retry.');total+=table.rows.length;if(table.rows.some(row=>!Array.isArray(row)||row.length!==table.headers.length||row.some(v=>typeof v!=='string'||v.length>1000)))throw new Error('Pomaa returned invalid record values. Please retry.');return {name:table.name,target:table.target,file,matrix:[table.headers,...table.rows],aiExtracted:true}})
 if(sheets.length>20||total>5000)throw new Error('Split the file into fewer than 20 tables and 5,000 rows.')
 if(!total)throw new Error('No importable records were found in this file.')
 return sheets
}
