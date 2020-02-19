async function load() {
  const today = new Date()
  const months = Array.apply(undefined, Array(12))
    .map((a,i) => i)
    .map(a => new Date(today.getFullYear(), a, 1))
    .map(a=>a.toLocaleDateString(undefined, { month: 'short' }))
  
  var cal = d3.select("body").select("div#cal").selectAll("div.mbox")
    .data(months)
    .text(d=>d)

  cal.enter().append("div")
    .classed("mbox", true)
    .text(d=>d)
}
