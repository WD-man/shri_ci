import React from 'react'
import Link from 'next/link'

export default () => (
  <ul>
    <li><Link href='/build/[id]' as={`/build/${1}`}><a>a</a></Link></li>
  </ul>
)
