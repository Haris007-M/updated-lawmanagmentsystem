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

// Each area keeps its own file so several people can add words without clashing.
export const en = {
  ...common, ...shell, ...auth, ...account, ...parts, ...admin, ...lawyerA, ...lawyerB, ...client, ...site,
} as const
