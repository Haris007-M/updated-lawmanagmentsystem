import type { TKey } from '../../shared'
import { common } from './common'
import { shell } from './shell'
import { auth } from './auth'
import { account } from './account'
import { parts } from './parts'
import { admin } from './admin'
import { lawyerA } from './lawyerA'
import { lawyerB } from './lawyerB'
import { client } from './client'
import { site } from './site'

// The compiler makes sure every English key has an Urdu translation.
export const ur: Record<TKey, string> = {
  ...common, ...shell, ...auth, ...account, ...parts, ...admin, ...lawyerA, ...lawyerB, ...client, ...site,
}
