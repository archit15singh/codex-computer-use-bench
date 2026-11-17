export const tasks = {
  navigate: {
    goal: 'Open the Workspace and navigate to Release notes.',
    steps: [
      ['button', 'Open workspace'],
      ['link', 'Release notes'],
      ['heading', 'Version history'],
    ],
    actions: [['open'], ['visit', { section: 'releases' }]],
  },
  form: {
    goal: 'Submit a service request titled Replace monitor, with department Operations and priority High.',
    steps: [
      ['fill', 'Request title', 'Replace monitor'],
      ['select', 'Department', 'Operations'],
      ['select', 'Priority', 'High'],
      ['button', 'Submit request'],
      ['status', 'Request saved'],
    ],
    actions: [['submit', { title: 'Replace monitor', department: 'Operations', priority: 'High' }]],
  },
  setting: {
    goal: 'Enable compact layout and verify it remains enabled after reloading.',
    steps: [
      ['checkbox', 'Compact layout'],
      ['button', 'Save settings'],
      ['status', 'Settings saved'],
      ['reload'],
      ['checked', 'Compact layout'],
    ],
    actions: [['setting', { compact: true }], ['readSetting']],
  },
  bug: {
    goal: 'Reproduce the saved-filter bug using Archived and confirm the visible error. Then recover by loading Active.',
    steps: [
      ['button', 'Load Archived'],
      ['alert', 'Saved filter unavailable'],
      ['button', 'Load Active'],
      ['status', 'Active results loaded'],
    ],
    actions: [['filter', { filter: 'Archived' }], ['filter', { filter: 'Active' }]],
  },
  handoff: {
    goal: 'Read the handoff code from Workspace and send it through the separate Inbox app.',
    steps: [
      ['read', 'Handoff code'],
      ['inbox'],
      ['fillFromRead', 'Handoff code'],
      ['button', 'Send handoff'],
      ['status', 'Handoff received'],
    ],
    actions: [['readCode'], ['handoff']],
  },
}
