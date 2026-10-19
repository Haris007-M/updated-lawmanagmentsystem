'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setLanguage(lang: string) {
  const value = lang === 'ur' ? 'ur' : 'en'
  ;(await cookies()).set('lang', value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  revalidatePath('/', 'layout')
}
