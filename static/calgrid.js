async function load() {
  const curyear = (new Date()).getFullYear()
  const months = Array.apply(undefined, Array(12))
    .map((a,i) => i)
    .map(a => new Date(curyear, a, 1))
    .map(a => a.toLocaleDateString(undefined, { month: 'short' }))

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
  }).filter(a=>a)

  const tasksbymonth = tasks.reduce((a,v,i) => {
    a[v.month].push(v)
    return a
  }, months.map(a=>[]))

  var cal = d3.select("body").select("div#cal").selectAll("div.mbox")
    .data(months)
    .join("div")
    .attr("class", "mbox").attr('month', (d,i) => i)
    .text(d => d)
    .selectAll("span.taskdot")
    .data((d,i) => tasksbymonth[i])
    .join("span")
    .attr("class", "taskdot")
    .text(d => d.context)
}
