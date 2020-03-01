async function load () {
  const tasks = await d3.json(`${process.env.ROOTPATH}/data`)

  // template hierarchichal data structure for d3.treemap
  // children array elements are months
  // children.children ... are context
  // children.children.children ... are tasks
  class HierTemplate {
    constructor (parent, id, data) {
      this.parent = parent
      this.data = data
      this.id = id
      this.children = []
    }
  }

  // create root and populate all months
  const root = new HierTemplate(null, 'root')
  const monthName = (monthNum) => {
    const curYear = (new Date()).getFullYear()
    return (new Date(curYear, monthNum, 1).toLocaleDateString(undefined, { month: 'short' }))
  }
  root.children = Array.apply(undefined, Array(12)).map((_, i) => new HierTemplate(root.id, i, monthName(i)))

  // insert tasks into hierarchy
  tasks
    .map(task => { task.date = new Date(task.date); return task })
    .forEach(
      task => {
        const monthElement = root.children[task.date.getMonth()]
        var contextElement = monthElement.children.find(m => m.data === task.context)
        if (!contextElement) {
          contextElement = new HierTemplate(monthElement.id, `${monthElement.id}${task.context}`, task.context)
          monthElement.children.push(contextElement)
        }
        contextElement.children.push(new HierTemplate(contextElement.id, 'dummyid', task))
      }
    )

  const treedata = d3.treemap().size([1000, 1000])(d3.hierarchy(root).count())

  // group for each month
  const monthgroup = d3.select('svg#cals').selectAll('g.month')
    .data(treedata.children)
    .join('g')
    .classed('month', true)
    .attr('transform', d => `translate(${d.x0},${d.y0})`)

  monthgroup
    .append('rect')
    .attr('width', d => (d.x1 - d.x0))
    .attr('height', d => (d.y1 - d.y0))

  monthgroup
    .append('text')
    .text(d => d.data.data)
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2)

  // each context
  const contextgroup = monthgroup
    .selectAll('g.context')
    .data(d => d.children)
    .join('g')
    .classed('context', true)

  const PADDING = 2

  contextgroup
    .append('rect')
    .attr('id', d => `rect${d.ancestors()[0].data.id}`)
    .attr('x', d => (d.x0 - d.ancestors()[1].x0) + PADDING)
    .attr('y', d => (d.y0 - d.ancestors()[1].y0) + PADDING)
    .attr('width', d => (d.x1 - d.x0) - PADDING * 2)
    .attr('height', d => (d.y1 - d.y0) - PADDING * 2)

  // clip path for text, using the context rect
  contextgroup
    .append('clipPath')
    .attr('id', d => `clip${d.ancestors()[0].data.id}`)
    .append('use')
    .attr('href', d => `#rect${d.ancestors()[0].data.id}`)

  const TEXTOFFSETX = PADDING + 2
  const TEXTOFFSETY = PADDING + 15

  contextgroup
    .append('text')
    .attr('clip-path', d => `url(#clip${d.ancestors()[0].data.id})`)
    .text(d => `${d.data.data} ${d.value}`)
    .attr('x', d => d.x0 - d.ancestors()[1].x0 + TEXTOFFSETX)
    .attr('y', d => d.y0 - d.ancestors()[1].y0 + TEXTOFFSETY)

  contextgroup
    .append('title')
    .text(d => `${d.data.data} ${d.value}`)
}

load()
