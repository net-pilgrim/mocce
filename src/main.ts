/**
 * MOCCE - Call Control XML (CCXML 1.0) Visual Studio
 * Copyright (C) 2026 Daniel Voina <dvoina@outlook.com>
 *
 * Licensed under the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
