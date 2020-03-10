async function attach () {
  const from = document.getElementById('fromDate')
  const to = document.getElementById('toDate')

  const now = new Date()
  to.valueAsDate = now
  from.valueAsDate = new Date(now.getFullYear(), 0, 1)

  from.addEventListener('input', dateChange)
  to.addEventListener('input', dateChange)
}

function dateChange (event) {
  const from = document.getElementById('fromDate')
  const to = document.getElementById('toDate')

  if (from.validity.valid && to.validity.valid) {
    updateTreemap(from.valueAsDate, to.valueAsDate)
  }
}

window.addEventListener('load', attach)
window.addEventListener('load', dateChange)
