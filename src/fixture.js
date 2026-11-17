import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { tasks } from './tasks.js'

const blank = () => ({
  opened: false, visited: false, submissions: [], compact: false, settingReads: [],
  filters: [], handoffs: [], code: randomBytes(4).toString('hex'),
})

function page(title, content, script = '') {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${title}</title>
  <style>
  body{max-width:42rem;margin:3rem auto;padding:0 1.5rem;font:18px/1.5 system-ui;color:#172439}
  label{display:block;margin:1rem 0} input,select,button{font:inherit} button{margin:.3rem}
  </style><main><h1>${title}</h1>${content}</main>
  <script>
  async function act(action, fields = {}) {
    const response = await fetch(location.pathname + '/action', {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({action,...fields}),
    });
    return response.json();
  }
  const status = document.querySelector('[role=status]');
  ${script}
  </script></html>`
}

function render(task, state, section, inbox) {
  if (inbox) return page('Inbox', `
    <form><label>Handoff code <input name="code" required></label>
    <button>Send handoff</button></form><p role="status"></p>`, `
    document.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const result = await act('handoff', Object.fromEntries(new FormData(event.target)));
      status.textContent = result.accepted ? 'Handoff received' : 'Invalid code';
    };`)

  if (task === 'navigate') {
    if (section === 'releases' && state.opened) {
      state.visited = true
      return page('Version history', '<p>Workspace release notes</p>')
    }
    return page('Workspace launcher', `
      <button id="open">Open workspace</button>
      <a id="releases" href="?section=releases" ${state.opened ? '' : 'hidden'}>Release notes</a>`, `
      document.querySelector('#open').onclick = async () => {
        await act('open');
        document.querySelector('#releases').hidden = false;
      };`)
  }

  if (task === 'form') return page('Service requests', `
    <form><label>Request title <input name="title" required></label>
    <label>Department <select name="department"><option>Support</option><option>Operations</option></select></label>
    <label>Priority <select name="priority"><option>Normal</option><option>High</option></select></label>
    <button>Submit request</button></form><p role="status"></p>`, `
    document.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      await act('submit', Object.fromEntries(new FormData(event.target)));
      status.textContent = 'Request saved';
    };`)

  if (task === 'setting') {
    state.settingReads.push(state.compact)
    return page('Workspace settings', `
      <label><input id="compact" type="checkbox" ${state.compact ? 'checked' : ''}> Compact layout</label>
      <button id="save">Save settings</button><p role="status"></p>`, `
      document.querySelector('#save').onclick = async () => {
        await act('setting', {compact: document.querySelector('#compact').checked});
        status.textContent = 'Settings saved';
      };`)
  }

  if (task === 'bug') return page('Saved filters', `
    <button data-filter="Archived">Load Archived</button>
    <button data-filter="Active">Load Active</button><p role="alert"></p><p role="status"></p>`, `
    for (const button of document.querySelectorAll('button')) {
      button.onclick = async () => {
        const result = await act('filter', {filter: button.dataset.filter});
        document.querySelector('[role=alert]').textContent = result.error ?? '';
        status.textContent = result.error ? '' : 'Active results loaded';
      };
    }`)

  return page('Workspace handoff', `<p>Copy this code into Inbox.</p>
    <output aria-label="Handoff code">${state.code}</output>`)
}

function act(state, { action, ...fields }) {
  switch (action) {
    case 'open': state.opened = true; return {}
    case 'visit': state.visited = state.opened && fields.section === 'releases'; return {}
    case 'submit': state.submissions.push(fields); return {}
    case 'setting': state.compact = fields.compact === true; return {}
    case 'readSetting': state.settingReads.push(state.compact); return { compact: state.compact }
    case 'filter': {
      state.filters.push(fields.filter)
      return fields.filter === 'Archived' ? { error: 'Saved filter unavailable' } : {}
    }
    case 'readCode': return { code: state.code }
    case 'handoff': {
      const accepted = fields.code === state.code
      state.handoffs.push(accepted)
      return { accepted }
    }
    default: throw new Error('Unknown action')
  }
}

function verified(task, state) {
  switch (task) {
    case 'navigate': return state.opened && state.visited
    case 'form': {
      const [request] = state.submissions
      return state.submissions.length === 1 && request.title === 'Replace monitor'
        && request.department === 'Operations' && request.priority === 'High'
    }
    case 'setting': return state.compact && state.settingReads.at(-1) === true
    case 'bug': return state.filters.join(',') === 'Archived,Active'
    case 'handoff': return state.handoffs.length === 1 && state.handoffs[0]
  }
}

export async function startFixture() {
  const runs = new Map()
  const servers = []
  try {
    for (const inbox of [false, true]) {
      const server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost')
          const match = /^\/run\/([\da-f]+)(\/action)?$/.exec(url.pathname)
          const run = match && runs.get(match[1])
          if (!run || (inbox && run.task !== 'handoff')) {
            res.writeHead(404).end()
          } else if (req.method === 'GET' && !match[2]) {
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
              .end(render(run.task, run.state, url.searchParams.get('section'), inbox))
          } else if (req.method === 'POST' && match[2]) {
            let body = ''
            for await (const chunk of req) {
              body += chunk
              if (body.length > 4096) throw new Error('Input too large')
            }
            const response = act(run.state, JSON.parse(body))
            res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(response))
          } else {
            res.writeHead(405).end()
          }
        } catch {
          res.writeHead(400).end()
        }
      })
      await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
      })
      servers.push(server)
    }
  } catch (error) {
    for (const server of servers) server.close()
    throw error
  }
  const origin = server => `http://127.0.0.1:${server.address().port}`
  return {
    create(task) {
      if (!Object.hasOwn(tasks, task)) throw new Error('Unknown task')
      const id = randomBytes(12).toString('hex')
      const state = blank()
      runs.set(id, { task, state })
      return {
        url: `${origin(servers[0])}/run/${id}`,
        inbox: `${origin(servers[1])}/run/${id}`,
        verify: () => verified(task, state),
        dispose: () => runs.delete(id),
      }
    },
    async close() {
      await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))))
    },
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fixture = await startFixture()
  const task = process.argv[2] ?? 'form'
  const run = fixture.create(task)
  console.log(JSON.stringify({ task, goal: tasks[task].goal, url: run.url, inbox: run.inbox }))
  process.stdin.setEncoding('utf8')
  process.stdin.resume()
  process.stdin.on('data', data => {
    if (data.trim() === 'verify') console.log(JSON.stringify({ verified: run.verify() }))
  })
}
