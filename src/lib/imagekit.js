import { supabase } from './supabase'

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

async function getUploadAuth() {
 const { data: { session } } = await supabase.auth.getSession()
 if (!session?.access_token) throw new Error('Sesi admin tidak valid. Silakan login ulang.')

 const response = await fetch('/api/imagekit-auth', {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.access_token}` },
 })

 if (!response.ok) throw new Error('Upload gambar belum bisa diotorisasi.')
 return response.json()
}

export async function uploadImage(file, folder) {
 const auth = await getUploadAuth()
 const body = new FormData()
 body.append('file', file)
 body.append('fileName', file.name)
 body.append('folder', `/${folder}`)
 body.append('useUniqueFileName', 'true')
 body.append('token', auth.token)
 body.append('expire', String(auth.expire))
 body.append('signature', auth.signature)
 body.append('publicKey', auth.publicKey)

 const response = await fetch(IMAGEKIT_UPLOAD_URL, { method: 'POST', body })
 if (!response.ok) throw new Error('ImageKit menolak upload gambar.')

 const result = await response.json()
 if (!result.url || typeof result.url !== 'string') throw new Error('ImageKit tidak mengembalikan URL gambar.')
 return result.url
}

export async function uploadImages(files, folder) {
 const uploaded = []
 for (const file of files) uploaded.push(await uploadImage(file, folder))
 return uploaded
}
