async function load() {
  const curyear = (new Date()).getFullYear()
  const months = Array.apply(undefined, Array(12))
    .map((a,i) => i)
    .map(a => new Date(curyear, a, 1))
    .map(a => { return {
      month: a.toLocaleDateString(undefined, { month: 'short' }),
      contexts: []
    }})

  const data = await d3.json('/data')

  const tasks = data.map(taskobj => {
    const [x, y, m, d] = taskobj.date.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (x) {
      taskobj.date = new Date(y, m, d)
      taskobj.month = taskobj.date.getMonth()
      taskobj.context = taskobj.context ? taskobj.context.replace('@','') : ''
      return taskobj 
    } else {
      return null
    }
  }).filter(a=>a).filter(task => !task.task.match(/^x/)).filter(task => !task.task.match(/@/))

  var root = []
  tasks
    .forEach(task => {
      root.push( { name: task.task, parent: `${task.context}${task.month}` })
      root.push( { name: `${task.context}${task.month}`, parent: task.month })
      root.push( { name: task.month, parent: 'tasks' } )
    })

  root.push( { name: 'tasks', parent: '' } )
  root = root
    .reduce((unique, task) => {
      if (!unique.some(t => (t.name == task.name && t.parent == task.parent))) {
        unique.push(task)
      }
      return unique
    }, [])

  const whatever = d3.stratify().id(d => d.name).parentId(d => d.parent)(root)
}
load()
