function dateParam (date) {
  const m = date.getMonth() + 1
  const d = date.getDay()
  return `${date.getFullYear()}-${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`
}

function monthName (monthNum) {
  const curYear = (new Date()).getFullYear()
  return (new Date(curYear, monthNum - 1, 1).toLocaleDateString(undefined, { month: 'short' }))
}

async function load (from, to) {
  if (from !== null && to !== null) {
    const tasks = await d3.json(`data/${dateParam(from)}/${dateParam(to)}`)

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

    // create root
    const root = new HierTemplate(null, 'root')

    // insert tasks into hierarchy
    tasks
      .forEach(
        task => {
          const month = task.date.month
          var monthElement = root.children.find(m => m.id === month)
          if (!monthElement) {
            monthElement = new HierTemplate(root.id, month, monthName(month))
            root.children.push(monthElement)
          }
          var contextElement = monthElement.children.find(m => m.data === task.context)
          if (!contextElement) {
            contextElement = new HierTemplate(monthElement.id, `${monthElement.id}${task.context}`, task.context)
            monthElement.children.push(contextElement)
          }
          contextElement.children.push(new HierTemplate(contextElement.id, 'dummyid', task))
        }
      )

    return d3.treemap()
      .padding(1)
      .size([1000, 1000])(d3.hierarchy(root).count())
  }
}

function setupTreemap (data) {
  const t = d3.transition()
    .duration(250)
    .ease(d3.easeLinear)

  // group for each month
  const monthgroup = d3.select('svg#cals').selectAll('svg.month')
    .data(data.children, d => d.data.id)

  monthgroup
    .join(
      enter => {
        const group = enter.append('svg')
          .classed('month', true)

        group
          .transition(t)
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)

        group.append('rect')
          .classed('month', true)
          .transition(t)
          .attr('width', d => (d.x1 - d.x0))
          .attr('height', d => (d.y1 - d.y0))

        group.append('text')
          .text(d => d.data.data)
          .transition(t)
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
      },
      update => {
        update
          .transition(t)
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)

        update.select('rect')
          .transition(t)
          .attr('width', d => (d.x1 - d.x0))
          .attr('height', d => (d.y1 - d.y0))

        update.select('text')
          .transition(t)
          .attr('x', d => (d.x1 - d.x0) / 2)
          .attr('y', d => (d.y1 - d.y0) / 2)
      },
      exit => {
        exit.selectAll('rect').remove()
        exit.selectAll('text').remove()
        exit.remove()
      }
    )

  // each context
  const TEXTOFFSETX = 4
  const TEXTOFFSETY = 17
  d3.select('svg#cals').selectAll('svg.month')
    .selectAll('g.context')
    .data(d => d.children)
    .join(
      enter => {
        const contextgroup = enter.append('g').classed('context', true)

        contextgroup
          .append('rect')
          .attr('id', d => `rect${d.ancestors()[0].data.id}`)
          .attr('x', d => (d.x0 - d.ancestors()[1].x0))
          .attr('y', d => (d.y0 - d.ancestors()[1].y0))
          .attr('width', d => (d.x1 - d.x0))
          .attr('height', d => (d.y1 - d.y0))
          .attr('fill', d => colourForContext(d.data.data))
          .attr('stroke', d => colourForContext(d.data.data))

        // clip path for text, using the context rect
        contextgroup
          .append('clipPath')
          .attr('id', d => `clip${d.ancestors()[0].data.id}`)
          .append('use')
          .attr('href', d => `#rect${d.ancestors()[0].data.id}`)

        contextgroup
          .append('text')
          .attr('clip-path', d => `url(#clip${d.ancestors()[0].data.id})`)
          .text(d => `${d.data.data} ${d.value}`)
          .attr('x', d => d.x0 - d.ancestors()[1].x0 + TEXTOFFSETX)
          .attr('y', d => d.y0 - d.ancestors()[1].y0 + TEXTOFFSETY)

        contextgroup
          .append('title')
          .text(d => `${d.data.data} ${d.value}`)
      },
      update => {
        update.select('rect')
          .attr('x', d => (d.x0 - d.ancestors()[1].x0))
          .attr('y', d => (d.y0 - d.ancestors()[1].y0))
          .attr('width', d => (d.x1 - d.x0))
          .attr('height', d => (d.y1 - d.y0))

        update.select('text')
          .attr('x', d => d.x0 - d.ancestors()[1].x0 + TEXTOFFSETX)
          .attr('y', d => d.y0 - d.ancestors()[1].y0 + TEXTOFFSETY)
      },
      exit => {
        exit.select('rect').remove()
        exit.select('text').remove()
        exit.remove()
      })
}

function colourForContext (contextName) {
  const colours = new Map()
  colours.set('Waiting', 'maroon')
  colours.set('Office', 'blue')
  colours.set('Home', 'green')
  colours.set('Online-Work', 'teal')
  colours.set('Outside', 'darkgreen')
  colours.set('Shops', 'darkgoldenrod')
  colours.set('Online', 'cadetblue')
  colours.set('Phone', 'darkorchid')

  if (colours.has(contextName)) {
    return colours.get(contextName)
  } else {
    return 'gray'
  }
}

async function updateTreemap (from, to) {
  const data = await load(from, to)
  setupTreemap(data)
}
